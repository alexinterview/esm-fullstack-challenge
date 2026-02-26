"""Tests for authentication endpoints."""
import uuid
import pytest
from fastapi.testclient import TestClient

from esm_fullstack_challenge.main import app
from esm_fullstack_challenge.db.init_users import init_users_table


@pytest.fixture(scope="module")
def client():
    """Create a test client."""
    # Initialize users table for testing
    init_users_table("data.db")
    with TestClient(app) as c:
        yield c


def test_login_success(client):
    """Test successful login with valid credentials."""
    response = client.post(
        "/auth/login/json",
        json={"username": "janedoe", "password": "password"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post(
        "/auth/login/json",
        json={"username": "janedoe", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """Test login with non-existent user."""
    response = client.post(
        "/auth/login/json",
        json={"username": "nonexistent", "password": "password"}
    )
    assert response.status_code == 401


def test_register_success(client):
    """Test successful user registration."""
    unique_id = uuid.uuid4().hex[:8]
    username = f"newuser_{unique_id}"
    email = f"newuser_{unique_id}@example.com"
    response = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "testpass123",
            "full_name": "New User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == username
    assert data["email"] == email
    assert data["full_name"] == "New User"
    assert "hashed_password" not in data


def test_register_duplicate_username(client):
    """Test registration with duplicate username."""
    response = client.post(
        "/auth/register",
        json={
            "username": "janedoe",
            "email": "another@example.com",
            "password": "testpass123",
            "full_name": "Another User"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_duplicate_email(client):
    """Test registration with duplicate email."""
    response = client.post(
        "/auth/register",
        json={
            "username": "uniqueuser",
            "email": "jane@example.com",
            "password": "testpass123",
            "full_name": "Unique User"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_get_current_user(client):
    """Test getting current user info with valid token."""
    # First login to get token
    login_response = client.post(
        "/auth/login/json",
        json={"username": "janedoe", "password": "password"}
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "janedoe"


def test_get_current_user_no_token(client):
    """Test getting current user without token."""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_get_current_user_invalid_token(client):
    """Test getting current user with invalid token."""
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalidtoken"}
    )
    assert response.status_code == 401


def test_protected_driver_create_without_auth(client):
    """Test that creating a driver requires authentication."""
    response = client.post(
        "/drivers",
        json={
            "forename": "Test",
            "surname": "Driver",
            "dob": "1990-01-01",
            "nationality": "Test"
        }
    )
    assert response.status_code == 401


def test_protected_driver_create_with_auth(client):
    """Test that creating a driver works with authentication."""
    # First login to get token
    login_response = client.post(
        "/auth/login/json",
        json={"username": "janedoe", "password": "password"}
    )
    token = login_response.json()["access_token"]

    response = client.post(
        "/drivers",
        json={
            "forename": "Test",
            "surname": "Driver",
            "dob": "1990-01-01",
            "nationality": "Test"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200


def test_logout(client):
    """Test logout endpoint."""
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
