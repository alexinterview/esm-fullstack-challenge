#!/usr/bin/env python
"""Tests for drivers CRUD operations."""
import sqlite3
import tempfile
import os

import pytest
from fastapi.testclient import TestClient

from esm_fullstack_challenge.main import app
from esm_fullstack_challenge.db import DB
from esm_fullstack_challenge.dependencies import get_db
from esm_fullstack_challenge.auth.dependencies import get_current_active_user
from esm_fullstack_challenge.auth.models import User


@pytest.fixture
def test_db():
    """Create a temporary test database with drivers table."""
    # Create a temporary database file
    fd, db_path = tempfile.mkstemp(suffix='.db')
    os.close(fd)

    # Create the drivers table
    conn = sqlite3.connect(db_path)
    conn.execute('''
        CREATE TABLE drivers (
            id INTEGER PRIMARY KEY,
            driver_ref TEXT,
            number TEXT,
            code TEXT,
            forename TEXT,
            surname TEXT,
            dob TEXT,
            nationality TEXT,
            url TEXT
        )
    ''')

    # Insert some test data
    conn.execute('''
        INSERT INTO drivers (id, driver_ref, number, code, forename, surname, dob, nationality, url)
        VALUES (1, 'hamilton', '44', 'HAM', 'Lewis', 'Hamilton', '1985-01-07', 'British', 'http://example.com/hamilton')
    ''')
    conn.execute('''
        INSERT INTO drivers (id, driver_ref, number, code, forename, surname, dob, nationality, url)
        VALUES (2, 'verstappen', '1', 'VER', 'Max', 'Verstappen', '1997-09-30', 'Dutch', 'http://example.com/verstappen')
    ''')
    conn.commit()
    conn.close()

    yield db_path

    # Cleanup
    os.unlink(db_path)


@pytest.fixture
def client(test_db):
    """Create a test client with overridden database dependency."""

    class TestDB(DB):
        """Test database class that uses the test database file."""
        def __init__(self):
            self.db_file = test_db

        def get_connection(self):
            """Return a connection context manager for the test database."""
            from contextlib import contextmanager

            @contextmanager
            def _get_connection():
                conn = sqlite3.connect(test_db)
                try:
                    yield conn
                    conn.commit()
                finally:
                    conn.close()

            return _get_connection()

    def override_get_db():
        yield TestDB()

    def override_get_current_user():
        return User(
            id=1,
            username="testuser",
            email="test@example.com",
            full_name="Test User",
            disabled=False
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


class TestGetDrivers:
    """Tests for GET /drivers endpoint."""

    def test_get_drivers_list(self, client):
        """Test getting list of all drivers."""
        response = client.get("/drivers")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]['forename'] == 'Lewis'
        assert data[1]['forename'] == 'Max'

    def test_get_driver_by_id(self, client):
        """Test getting a single driver by ID."""
        response = client.get("/drivers/1")
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 1
        assert data['forename'] == 'Lewis'
        assert data['surname'] == 'Hamilton'
        assert data['nationality'] == 'British'

    def test_get_driver_not_found(self, client):
        """Test getting a non-existent driver returns 404."""
        response = client.get("/drivers/999")
        assert response.status_code == 404


class TestCreateDriver:
    """Tests for POST /drivers endpoint."""

    def test_create_driver_success(self, client):
        """Test creating a new driver with all fields."""
        new_driver = {
            'driver_ref': 'leclerc',
            'number': '16',
            'code': 'LEC',
            'forename': 'Charles',
            'surname': 'Leclerc',
            'dob': '1997-10-16',
            'nationality': 'Monegasque',
            'url': 'http://example.com/leclerc'
        }
        response = client.post("/drivers", json=new_driver)
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 3  # Next available ID after 1 and 2
        assert data['forename'] == 'Charles'
        assert data['surname'] == 'Leclerc'
        assert data['driver_ref'] == 'leclerc'

    def test_create_driver_generates_driver_ref(self, client):
        """Test that driver_ref is generated from surname if not provided."""
        new_driver = {
            'number': '55',
            'code': 'SAI',
            'forename': 'Carlos',
            'surname': 'Sainz',
            'dob': '1994-09-01',
            'nationality': 'Spanish',
            'url': 'http://example.com/sainz'
        }
        response = client.post("/drivers", json=new_driver)
        assert response.status_code == 200
        data = response.json()
        assert data['driver_ref'] == 'sainz'  # Generated from surname

    def test_create_driver_with_all_fields(self, client):
        """Test creating a driver with all fields."""
        new_driver = {
            'number': '4',
            'code': 'NOR',
            'forename': 'Lando',
            'surname': 'Norris',
            'dob': '1999-11-13',
            'nationality': 'British',
            'url': 'http://example.com/norris'
        }
        response = client.post("/drivers", json=new_driver)
        assert response.status_code == 200
        data = response.json()
        assert data['forename'] == 'Lando'
        assert data['surname'] == 'Norris'
        assert data['number'] == '4'
        assert data['code'] == 'NOR'

    def test_create_driver_missing_required_field(self, client):
        """Test that missing required fields return validation error."""
        incomplete_driver = {
            'forename': 'Test',
            # Missing surname, dob, nationality
        }
        response = client.post("/drivers", json=incomplete_driver)
        assert response.status_code == 422  # Validation error


class TestUpdateDriver:
    """Tests for PUT /drivers/{id} endpoint."""

    def test_update_driver_success(self, client):
        """Test updating an existing driver."""
        updated_data = {
            'driver_ref': 'hamilton',
            'number': '44',
            'code': 'HAM',
            'forename': 'Lewis',
            'surname': 'Hamilton',
            'dob': '1985-01-07',
            'nationality': 'British',
            'url': 'http://updated-url.com/hamilton'
        }
        response = client.put("/drivers/1", json=updated_data)
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 1
        assert data['url'] == 'http://updated-url.com/hamilton'

    def test_update_driver_change_name(self, client):
        """Test updating driver's name."""
        updated_data = {
            'driver_ref': 'hamilton',
            'number': '44',
            'code': 'HAM',
            'forename': 'Sir Lewis',
            'surname': 'Hamilton',
            'dob': '1985-01-07',
            'nationality': 'British',
            'url': 'http://example.com/hamilton'
        }
        response = client.put("/drivers/1", json=updated_data)
        assert response.status_code == 200
        data = response.json()
        assert data['forename'] == 'Sir Lewis'

    def test_update_driver_generates_driver_ref(self, client):
        """Test that driver_ref is generated if not provided during update."""
        updated_data = {
            'number': '44',
            'code': 'HAM',
            'forename': 'Lewis',
            'surname': 'Hamilton-Test',
            'dob': '1985-01-07',
            'nationality': 'British',
            'url': 'http://example.com/hamilton'
        }
        response = client.put("/drivers/1", json=updated_data)
        assert response.status_code == 200
        data = response.json()
        assert data['driver_ref'] == 'hamilton-test'

    def test_update_driver_not_found(self, client):
        """Test updating a non-existent driver returns 404."""
        updated_data = {
            'driver_ref': 'test',
            'number': '0',
            'code': 'TST',
            'forename': 'Test',
            'surname': 'Driver',
            'dob': '1990-01-01',
            'nationality': 'Test',
            'url': 'http://test.com'
        }
        response = client.put("/drivers/999", json=updated_data)
        assert response.status_code == 404
        assert 'does not exist' in response.json()['detail']

    def test_update_driver_missing_required_field(self, client):
        """Test that missing required fields return validation error."""
        incomplete_data = {
            'forename': 'Test',
            # Missing surname, dob, nationality
        }
        response = client.put("/drivers/1", json=incomplete_data)
        assert response.status_code == 422  # Validation error


class TestDeleteDriver:
    """Tests for DELETE /drivers/{id} endpoint."""

    def test_delete_driver_success(self, client):
        """Test deleting an existing driver."""
        response = client.delete("/drivers/1")
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 1
        assert data['forename'] == 'Lewis'

        # Verify driver is actually deleted
        get_response = client.get("/drivers/1")
        assert get_response.status_code == 404

    def test_delete_driver_not_found(self, client):
        """Test deleting a non-existent driver returns 404."""
        response = client.delete("/drivers/999")
        assert response.status_code == 404
        assert 'does not exist' in response.json()['detail']

    def test_delete_driver_reduces_count(self, client):
        """Test that deleting a driver reduces the total count."""
        # Get initial count
        initial_response = client.get("/drivers")
        initial_count = len(initial_response.json())

        # Delete a driver
        client.delete("/drivers/1")

        # Verify count decreased
        final_response = client.get("/drivers")
        final_count = len(final_response.json())
        assert final_count == initial_count - 1


class TestDriversCRUDIntegration:
    """Integration tests for full CRUD workflow."""

    def test_full_crud_workflow(self, client):
        """Test complete create, read, update, delete workflow."""
        # Create
        new_driver = {
            'driver_ref': 'test_driver',
            'number': '99',
            'code': 'TST',
            'forename': 'Test',
            'surname': 'Driver',
            'dob': '2000-01-01',
            'nationality': 'TestNation',
            'url': 'http://test.com'
        }
        create_response = client.post("/drivers", json=new_driver)
        assert create_response.status_code == 200
        created_id = create_response.json()['id']

        # Read
        read_response = client.get(f"/drivers/{created_id}")
        assert read_response.status_code == 200
        assert read_response.json()['forename'] == 'Test'

        # Update
        updated_data = {
            'driver_ref': 'test_driver_updated',
            'number': '99',
            'code': 'TST',
            'forename': 'Updated',
            'surname': 'Driver',
            'dob': '2000-01-01',
            'nationality': 'TestNation',
            'url': 'http://test-updated.com'
        }
        update_response = client.put(f"/drivers/{created_id}", json=updated_data)
        assert update_response.status_code == 200
        assert update_response.json()['forename'] == 'Updated'

        # Verify update persisted
        verify_response = client.get(f"/drivers/{created_id}")
        assert verify_response.json()['forename'] == 'Updated'

        # Delete
        delete_response = client.delete(f"/drivers/{created_id}")
        assert delete_response.status_code == 200

        # Verify deletion
        final_response = client.get(f"/drivers/{created_id}")
        assert final_response.status_code == 404
