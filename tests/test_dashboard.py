#!/usr/bin/env python
"""Tests for dashboard endpoints."""
import sqlite3
import tempfile
import os
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from esm_fullstack_challenge.main import app
from esm_fullstack_challenge.db import DB
from esm_fullstack_challenge.dependencies import get_db


@pytest.fixture
def test_db():
    """Create a temporary test database with all required tables."""
    fd, db_path = tempfile.mkstemp(suffix='.db')
    os.close(fd)

    conn = sqlite3.connect(db_path)

    # Create all required tables
    conn.executescript('''
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
        );

        CREATE TABLE constructors (
            id INTEGER PRIMARY KEY,
            constructor_ref TEXT,
            name TEXT,
            nationality TEXT,
            url TEXT
        );

        CREATE TABLE circuits (
            id INTEGER PRIMARY KEY,
            circuit_ref TEXT,
            name TEXT,
            location TEXT,
            country TEXT,
            lat REAL,
            lng REAL,
            url TEXT
        );

        CREATE TABLE races (
            id INTEGER PRIMARY KEY,
            year INTEGER,
            round INTEGER,
            circuit_id INTEGER,
            name TEXT,
            date TEXT,
            time TEXT,
            quali_date TEXT,
            url TEXT,
            FOREIGN KEY (circuit_id) REFERENCES circuits(id)
        );

        CREATE TABLE status (
            id INTEGER PRIMARY KEY,
            status TEXT
        );

        CREATE TABLE results (
            id INTEGER PRIMARY KEY,
            race_id INTEGER,
            driver_id INTEGER,
            constructor_id INTEGER,
            number TEXT,
            grid INTEGER,
            position TEXT,
            position_order INTEGER,
            points REAL,
            laps INTEGER,
            time TEXT,
            milliseconds INTEGER,
            fastest_lap INTEGER,
            rank TEXT,
            fastest_lap_time TEXT,
            fastest_lap_speed TEXT,
            status_id INTEGER,
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id),
            FOREIGN KEY (constructor_id) REFERENCES constructors(id),
            FOREIGN KEY (status_id) REFERENCES status(id)
        );

        CREATE TABLE driver_standings (
            id INTEGER PRIMARY KEY,
            race_id INTEGER,
            driver_id INTEGER,
            points REAL,
            position INTEGER,
            wins INTEGER,
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        );

        CREATE TABLE constructor_standings (
            id INTEGER PRIMARY KEY,
            race_id INTEGER,
            constructor_id INTEGER,
            points REAL,
            position INTEGER,
            wins INTEGER,
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (constructor_id) REFERENCES constructors(id)
        );

        CREATE TABLE lap_times (
            race_id INTEGER,
            driver_id INTEGER,
            lap INTEGER,
            position INTEGER,
            time TEXT,
            milliseconds INTEGER,
            PRIMARY KEY (race_id, driver_id, lap),
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        );

        CREATE TABLE pit_stops (
            race_id INTEGER,
            driver_id INTEGER,
            stop INTEGER,
            lap INTEGER,
            time TEXT,
            duration TEXT,
            milliseconds INTEGER,
            PRIMARY KEY (race_id, driver_id, stop),
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        );

        CREATE TABLE qualifying (
            id INTEGER PRIMARY KEY,
            race_id INTEGER,
            driver_id INTEGER,
            constructor_id INTEGER,
            number TEXT,
            position INTEGER,
            q1 TEXT,
            q2 TEXT,
            q3 TEXT,
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id),
            FOREIGN KEY (constructor_id) REFERENCES constructors(id)
        );
    ''')

    # Insert test data
    # Status
    conn.execute("INSERT INTO status (id, status) VALUES (1, 'Finished')")
    conn.execute("INSERT INTO status (id, status) VALUES (2, 'Retired')")
    conn.execute("INSERT INTO status (id, status) VALUES (3, '+1 Lap')")

    # Drivers
    conn.execute('''
        INSERT INTO drivers (id, driver_ref, number, code, forename, surname, dob, nationality, url)
        VALUES (1, 'hamilton', '44', 'HAM', 'Lewis', 'Hamilton', '1985-01-07', 'British', 'http://example.com/hamilton')
    ''')
    conn.execute('''
        INSERT INTO drivers (id, driver_ref, number, code, forename, surname, dob, nationality, url)
        VALUES (2, 'verstappen', '1', 'VER', 'Max', 'Verstappen', '1997-09-30', 'Dutch', 'http://example.com/verstappen')
    ''')
    conn.execute('''
        INSERT INTO drivers (id, driver_ref, number, code, forename, surname, dob, nationality, url)
        VALUES (3, 'leclerc', '16', 'LEC', 'Charles', 'Leclerc', '1997-10-16', 'Monegasque', 'http://example.com/leclerc')
    ''')
    conn.execute('''
        INSERT INTO drivers (id, driver_ref, number, code, forename, surname, dob, nationality, url)
        VALUES (4, 'norris', '4', 'NOR', 'Lando', 'Norris', '1999-11-13', 'British', 'http://example.com/norris')
    ''')

    # Constructors
    conn.execute('''
        INSERT INTO constructors (id, constructor_ref, name, nationality, url)
        VALUES (1, 'mercedes', 'Mercedes', 'German', 'http://example.com/mercedes')
    ''')
    conn.execute('''
        INSERT INTO constructors (id, constructor_ref, name, nationality, url)
        VALUES (2, 'red_bull', 'Red Bull', 'Austrian', 'http://example.com/redbull')
    ''')
    conn.execute('''
        INSERT INTO constructors (id, constructor_ref, name, nationality, url)
        VALUES (3, 'ferrari', 'Ferrari', 'Italian', 'http://example.com/ferrari')
    ''')
    conn.execute('''
        INSERT INTO constructors (id, constructor_ref, name, nationality, url)
        VALUES (4, 'mclaren', 'McLaren', 'British', 'http://example.com/mclaren')
    ''')

    # Circuits
    conn.execute('''
        INSERT INTO circuits (id, circuit_ref, name, location, country, lat, lng, url)
        VALUES (1, 'monaco', 'Circuit de Monaco', 'Monte-Carlo', 'Monaco', 43.7347, 7.4206, 'http://example.com/monaco')
    ''')
    conn.execute('''
        INSERT INTO circuits (id, circuit_ref, name, location, country, lat, lng, url)
        VALUES (2, 'silverstone', 'Silverstone Circuit', 'Silverstone', 'UK', 52.0786, -1.0169, 'http://example.com/silverstone')
    ''')
    conn.execute('''
        INSERT INTO circuits (id, circuit_ref, name, location, country, lat, lng, url)
        VALUES (3, 'spa', 'Circuit de Spa-Francorchamps', 'Spa', 'Belgium', 50.4372, 5.9714, 'http://example.com/spa')
    ''')

    # Races - including past and future races
    today = date.today()
    past_date = (today - timedelta(days=30)).isoformat()
    future_date = (today + timedelta(days=30)).isoformat()

    # 2023 Season races
    conn.execute('''
        INSERT INTO races (id, year, round, circuit_id, name, date, quali_date, url)
        VALUES (1, 2023, 1, 1, 'Monaco Grand Prix', '2023-05-28', '2023-05-27', 'http://example.com/race1')
    ''')
    conn.execute('''
        INSERT INTO races (id, year, round, circuit_id, name, date, quali_date, url)
        VALUES (2, 2023, 2, 2, 'British Grand Prix', '2023-07-09', '2023-07-08', 'http://example.com/race2')
    ''')
    conn.execute('''
        INSERT INTO races (id, year, round, circuit_id, name, date, quali_date, url)
        VALUES (3, 2023, 3, 3, 'Belgian Grand Prix', '2023-07-30', '2023-07-29', 'http://example.com/race3')
    ''')

    # 2024 Season races
    conn.execute(f'''
        INSERT INTO races (id, year, round, circuit_id, name, date, quali_date, url)
        VALUES (4, 2024, 1, 1, 'Monaco Grand Prix 2024', '{past_date}', '{past_date}', 'http://example.com/race4')
    ''')
    conn.execute(f'''
        INSERT INTO races (id, year, round, circuit_id, name, date, quali_date, url)
        VALUES (5, 2024, 2, 2, 'British Grand Prix 2024', '{future_date}', '{future_date}', 'http://example.com/race5')
    ''')

    # Results for 2023 races
    # Race 1 - Monaco 2023
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (1, 1, 2, 2, 1, '1', 1, 25, 78, '1:45:32.123', '1', '1:12.123', '165.5', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (2, 1, 1, 1, 2, '2', 2, 18, 78, '+5.123', '2', '1:12.456', '165.2', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (3, 1, 3, 3, 3, '3', 3, 15, 78, '+10.456', '3', '1:12.789', '164.8', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (4, 1, 4, 4, 4, '4', 4, 12, 78, '+15.789', '4', '1:13.012', '164.5', 1)
    ''')

    # Race 2 - British 2023
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (5, 2, 1, 1, 1, '1', 1, 25, 52, '1:25:12.345', '1', '1:28.123', '245.5', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (6, 2, 2, 2, 2, '2', 2, 18, 52, '+3.456', '2', '1:28.456', '245.2', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (7, 2, 3, 3, 3, '3', 3, 15, 52, '+8.789', '3', '1:28.789', '244.8', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (8, 2, 4, 4, 4, '4', 4, 12, 52, '+12.012', '4', '1:29.012', '244.5', 1)
    ''')

    # Race 3 - Belgian 2023
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (9, 3, 2, 2, 1, '1', 1, 25, 44, '1:22:45.678', '1', '1:45.123', '255.5', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (10, 3, 1, 1, 2, '2', 2, 18, 44, '+6.789', '2', '1:45.456', '255.2', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (11, 3, 4, 4, 3, '3', 3, 15, 44, '+11.012', '3', '1:45.789', '254.8', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (12, 3, 3, 3, 4, '4', 4, 12, 44, '+15.345', '4', '1:46.012', '254.5', 1)
    ''')

    # Results for 2024 race (past)
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (13, 4, 2, 2, 1, '1', 1, 25, 78, '1:44:32.123', '1', '1:11.123', '166.5', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (14, 4, 4, 4, 2, '2', 2, 18, 78, '+4.123', '2', '1:11.456', '166.2', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (15, 4, 3, 3, 3, '3', 3, 15, 78, '+9.456', '3', '1:11.789', '165.8', 1)
    ''')
    conn.execute('''
        INSERT INTO results (id, race_id, driver_id, constructor_id, grid, position, position_order, points, laps, time, rank, fastest_lap_time, fastest_lap_speed, status_id)
        VALUES (16, 4, 1, 1, 4, '4', 4, 12, 78, '+14.789', '4', '1:12.012', '165.5', 1)
    ''')

    # Driver standings after race 3 (2023)
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (1, 3, 2, 68, 1, 2)')
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (2, 3, 1, 61, 2, 1)')
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (3, 3, 3, 42, 3, 0)')
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (4, 3, 4, 39, 4, 0)')

    # Driver standings after race 4 (2024)
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (5, 4, 2, 25, 1, 1)')
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (6, 4, 4, 18, 2, 0)')
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (7, 4, 3, 15, 3, 0)')
    conn.execute('INSERT INTO driver_standings (id, race_id, driver_id, points, position, wins) VALUES (8, 4, 1, 12, 4, 0)')

    # Constructor standings after race 3 (2023)
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (1, 3, 2, 68, 1, 2)')
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (2, 3, 1, 61, 2, 1)')
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (3, 3, 3, 42, 3, 0)')
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (4, 3, 4, 39, 4, 0)')

    # Constructor standings after race 4 (2024)
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (5, 4, 2, 25, 1, 1)')
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (6, 4, 4, 18, 2, 0)')
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (7, 4, 3, 15, 3, 0)')
    conn.execute('INSERT INTO constructor_standings (id, race_id, constructor_id, points, position, wins) VALUES (8, 4, 1, 12, 4, 0)')

    # Lap times for race 1 (Monaco)
    for lap in range(1, 6):
        conn.execute(f'INSERT INTO lap_times (race_id, driver_id, lap, position, time, milliseconds) VALUES (1, 1, {lap}, {2}, "1:12.{100+lap}", {72000+lap*100})')
        conn.execute(f'INSERT INTO lap_times (race_id, driver_id, lap, position, time, milliseconds) VALUES (1, 2, {lap}, {1}, "1:11.{900+lap}", {71000+lap*100})')
        conn.execute(f'INSERT INTO lap_times (race_id, driver_id, lap, position, time, milliseconds) VALUES (1, 3, {lap}, {3}, "1:12.{300+lap}", {72300+lap*100})')
        conn.execute(f'INSERT INTO lap_times (race_id, driver_id, lap, position, time, milliseconds) VALUES (1, 4, {lap}, {4}, "1:12.{500+lap}", {72500+lap*100})')

    # Pit stops for race 1 (Monaco)
    conn.execute('INSERT INTO pit_stops (race_id, driver_id, stop, lap, time, duration, milliseconds) VALUES (1, 1, 1, 20, "14:35:23", "23.456", 23456)')
    conn.execute('INSERT INTO pit_stops (race_id, driver_id, stop, lap, time, duration, milliseconds) VALUES (1, 2, 1, 22, "14:38:45", "21.234", 21234)')
    conn.execute('INSERT INTO pit_stops (race_id, driver_id, stop, lap, time, duration, milliseconds) VALUES (1, 3, 1, 21, "14:36:12", "22.567", 22567)')
    conn.execute('INSERT INTO pit_stops (race_id, driver_id, stop, lap, time, duration, milliseconds) VALUES (1, 4, 1, 23, "14:40:33", "24.789", 24789)')
    conn.execute('INSERT INTO pit_stops (race_id, driver_id, stop, lap, time, duration, milliseconds) VALUES (1, 1, 2, 45, "15:05:23", "22.123", 22123)')
    conn.execute('INSERT INTO pit_stops (race_id, driver_id, stop, lap, time, duration, milliseconds) VALUES (1, 2, 2, 47, "15:08:45", "20.567", 20567)')

    # Qualifying for race 1 (Monaco)
    conn.execute('INSERT INTO qualifying (id, race_id, driver_id, constructor_id, number, position, q1, q2, q3) VALUES (1, 1, 2, 2, "1", 1, "1:11.123", "1:10.456", "1:10.012")')
    conn.execute('INSERT INTO qualifying (id, race_id, driver_id, constructor_id, number, position, q1, q2, q3) VALUES (2, 1, 1, 1, "44", 2, "1:11.234", "1:10.567", "1:10.123")')
    conn.execute('INSERT INTO qualifying (id, race_id, driver_id, constructor_id, number, position, q1, q2, q3) VALUES (3, 1, 3, 3, "16", 3, "1:11.345", "1:10.678", "1:10.234")')
    conn.execute('INSERT INTO qualifying (id, race_id, driver_id, constructor_id, number, position, q1, q2, q3) VALUES (4, 1, 4, 4, "4", 4, "1:11.456", "1:10.789", "1:10.345")')

    conn.commit()
    conn.close()

    yield db_path

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

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# =============================================================================
# SEASON DASHBOARD ENDPOINT TESTS
# =============================================================================

class TestDriverStandings:
    """Tests for GET /dashboard/driver_standings endpoint."""

    def test_get_driver_standings_default(self, client):
        """Test getting driver standings without year filter."""
        response = client.get("/dashboard/driver_standings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check structure
        assert 'driver_name' in data[0]
        assert 'points' in data[0]
        assert 'position' in data[0]

    def test_get_driver_standings_with_year(self, client):
        """Test getting driver standings for specific year."""
        response = client.get("/dashboard/driver_standings?year=2023")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All results should be from 2023
        for standing in data:
            assert standing['year'] == 2023

    def test_get_driver_standings_with_limit(self, client):
        """Test getting driver standings with limit."""
        response = client.get("/dashboard/driver_standings?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3

    def test_driver_standings_ordered_by_position(self, client):
        """Test that driver standings are ordered by position."""
        response = client.get("/dashboard/driver_standings?year=2023")
        assert response.status_code == 200
        data = response.json()
        positions = [d['position'] for d in data]
        assert positions == sorted(positions)


class TestConstructorStandings:
    """Tests for GET /dashboard/constructor_standings endpoint."""

    def test_get_constructor_standings_default(self, client):
        """Test getting constructor standings without year filter."""
        response = client.get("/dashboard/constructor_standings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check structure
        assert 'constructor_name' in data[0]
        assert 'points' in data[0]
        assert 'position' in data[0]

    def test_get_constructor_standings_with_year(self, client):
        """Test getting constructor standings for specific year."""
        response = client.get("/dashboard/constructor_standings?year=2023")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for standing in data:
            assert standing['year'] == 2023

    def test_get_constructor_standings_with_limit(self, client):
        """Test getting constructor standings with limit."""
        response = client.get("/dashboard/constructor_standings?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2


class TestCumulativeWins:
    """Tests for GET /dashboard/cumulative_wins endpoint."""

    def test_get_cumulative_wins_all_time(self, client):
        """Test getting cumulative wins across all time."""
        response = client.get("/dashboard/cumulative_wins")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check structure
        assert 'driver_name' in data[0]
        assert 'cumulative_wins' in data[0]
        assert 'year' in data[0]
        assert 'round' in data[0]

    def test_get_cumulative_wins_for_year(self, client):
        """Test getting cumulative wins for specific year."""
        response = client.get("/dashboard/cumulative_wins?year=2023")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All results should be from 2023
        for win in data:
            assert win['year'] == 2023

    def test_cumulative_wins_are_increasing(self, client):
        """Test that cumulative wins increase for each driver."""
        response = client.get("/dashboard/cumulative_wins?year=2023")
        assert response.status_code == 200
        data = response.json()

        # Group by driver and verify cumulative wins increase
        driver_wins = {}
        for win in data:
            driver = win['driver_name']
            if driver not in driver_wins:
                driver_wins[driver] = []
            driver_wins[driver].append(win['cumulative_wins'])

        for driver, wins in driver_wins.items():
            for i in range(1, len(wins)):
                assert wins[i] >= wins[i-1], f"Cumulative wins should not decrease for {driver}"


class TestFastestLapsByCircuit:
    """Tests for GET /dashboard/fastest_laps_by_circuit endpoint."""

    def test_get_fastest_laps_default(self, client):
        """Test getting fastest laps without filters."""
        response = client.get("/dashboard/fastest_laps_by_circuit")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check structure
        if len(data) > 0:
            assert 'circuit_name' in data[0]
            assert 'fastest_lap_time' in data[0]
            assert 'driver_name' in data[0]

    def test_get_fastest_laps_with_year(self, client):
        """Test getting fastest laps for specific year."""
        response = client.get("/dashboard/fastest_laps_by_circuit?year=2023")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for lap in data:
            assert lap['year'] == 2023

    def test_get_fastest_laps_with_limit(self, client):
        """Test getting fastest laps with limit."""
        response = client.get("/dashboard/fastest_laps_by_circuit?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2


class TestRacesList:
    """Tests for GET /dashboard/races_list endpoint."""

    def test_get_races_list_default(self, client):
        """Test getting races list without filters."""
        response = client.get("/dashboard/races_list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check structure
        assert 'id' in data[0]
        assert 'name' in data[0]
        assert 'year' in data[0]
        assert 'round' in data[0]

    def test_get_races_list_with_year(self, client):
        """Test getting races list for specific year."""
        response = client.get("/dashboard/races_list?year=2023")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for race in data:
            assert race['year'] == 2023

    def test_races_list_ordered_by_round(self, client):
        """Test that races are ordered by round within a year."""
        response = client.get("/dashboard/races_list?year=2023")
        assert response.status_code == 200
        data = response.json()
        rounds = [r['round'] for r in data]
        assert rounds == sorted(rounds)


class TestYearsList:
    """Tests for GET /dashboard/years_list endpoint."""

    def test_get_years_list(self, client):
        """Test getting list of years."""
        response = client.get("/dashboard/years_list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Should include 2023 and 2024
        assert 2023 in data
        assert 2024 in data

    def test_years_list_descending_order(self, client):
        """Test that years are in descending order."""
        response = client.get("/dashboard/years_list")
        assert response.status_code == 200
        data = response.json()
        assert data == sorted(data, reverse=True)


# =============================================================================
# RACE-SPECIFIC ENDPOINT TESTS
# =============================================================================

class TestRaceInfo:
    """Tests for GET /dashboard/race/{race_id}/info endpoint."""

    def test_get_race_info(self, client):
        """Test getting race info for valid race."""
        response = client.get("/dashboard/race/1/info")
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 1
        assert data['name'] == 'Monaco Grand Prix'
        assert data['circuit_name'] == 'Circuit de Monaco'
        assert data['country'] == 'Monaco'

    def test_get_race_info_not_found(self, client):
        """Test getting race info for non-existent race."""
        response = client.get("/dashboard/race/999/info")
        assert response.status_code == 404
        assert 'does not exist' in response.json()['detail']


class TestRaceLapTimes:
    """Tests for GET /dashboard/race/{race_id}/lap_times endpoint."""

    def test_get_race_lap_times(self, client):
        """Test getting lap times for valid race."""
        response = client.get("/dashboard/race/1/lap_times")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check structure
        assert 'lap' in data[0]
        assert 'driver_name' in data[0]
        assert 'milliseconds' in data[0]
        assert 'constructor_name' in data[0]

    def test_get_race_lap_times_not_found(self, client):
        """Test getting lap times for non-existent race."""
        response = client.get("/dashboard/race/999/lap_times")
        assert response.status_code == 404

    def test_lap_times_ordered_by_lap_and_position(self, client):
        """Test that lap times are ordered correctly."""
        response = client.get("/dashboard/race/1/lap_times")
        assert response.status_code == 200
        data = response.json()
        # Verify ordered by lap then position
        for i in range(1, len(data)):
            if data[i]['lap'] == data[i-1]['lap']:
                assert data[i]['position'] >= data[i-1]['position']
            else:
                assert data[i]['lap'] >= data[i-1]['lap']


class TestRacePitStops:
    """Tests for GET /dashboard/race/{race_id}/pit_stops endpoint."""

    def test_get_race_pit_stops(self, client):
        """Test getting pit stops for valid race."""
        response = client.get("/dashboard/race/1/pit_stops")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check structure
        assert 'lap' in data[0]
        assert 'stop' in data[0]
        assert 'duration' in data[0]
        assert 'driver_name' in data[0]

    def test_get_race_pit_stops_not_found(self, client):
        """Test getting pit stops for non-existent race."""
        response = client.get("/dashboard/race/999/pit_stops")
        assert response.status_code == 404


class TestRaceResults:
    """Tests for GET /dashboard/race/{race_id}/results endpoint."""

    def test_get_race_results(self, client):
        """Test getting results for valid race."""
        response = client.get("/dashboard/race/1/results")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4  # 4 drivers in race 1
        # Check structure
        assert 'position_order' in data[0]
        assert 'driver_name' in data[0]
        assert 'constructor_name' in data[0]
        assert 'points' in data[0]

    def test_get_race_results_not_found(self, client):
        """Test getting results for non-existent race."""
        response = client.get("/dashboard/race/999/results")
        assert response.status_code == 404

    def test_race_results_ordered_by_position(self, client):
        """Test that results are ordered by position."""
        response = client.get("/dashboard/race/1/results")
        assert response.status_code == 200
        data = response.json()
        positions = [r['position_order'] for r in data]
        assert positions == sorted(positions)

    def test_race_results_podium(self, client):
        """Test that podium positions are correct."""
        response = client.get("/dashboard/race/1/results")
        assert response.status_code == 200
        data = response.json()
        # P1 should be Verstappen
        assert data[0]['driver_name'] == 'Max Verstappen'
        assert data[0]['points'] == 25
        # P2 should be Hamilton
        assert data[1]['driver_name'] == 'Lewis Hamilton'
        assert data[1]['points'] == 18
        # P3 should be Leclerc
        assert data[2]['driver_name'] == 'Charles Leclerc'
        assert data[2]['points'] == 15


class TestRaceConstructorResults:
    """Tests for GET /dashboard/race/{race_id}/constructor_results endpoint."""

    def test_get_race_constructor_results(self, client):
        """Test getting constructor results for valid race."""
        response = client.get("/dashboard/race/1/constructor_results")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4  # 4 constructors in race 1
        # Check structure
        assert 'constructor_name' in data[0]
        assert 'total_points' in data[0]
        assert 'nationality' in data[0]

    def test_get_race_constructor_results_not_found(self, client):
        """Test getting constructor results for non-existent race."""
        response = client.get("/dashboard/race/999/constructor_results")
        assert response.status_code == 404

    def test_constructor_results_ordered_by_points(self, client):
        """Test that constructor results are ordered by points."""
        response = client.get("/dashboard/race/1/constructor_results")
        assert response.status_code == 200
        data = response.json()
        points = [r['total_points'] for r in data]
        assert points == sorted(points, reverse=True)


class TestRaceFastestPitStops:
    """Tests for GET /dashboard/race/{race_id}/fastest_pit_stops endpoint."""

    def test_get_race_fastest_pit_stops(self, client):
        """Test getting fastest pit stops for valid race."""
        response = client.get("/dashboard/race/1/fastest_pit_stops")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Default limit is 3
        assert len(data) <= 3
        # Check structure
        if len(data) > 0:
            assert 'driver_name' in data[0]
            assert 'duration' in data[0]
            assert 'milliseconds' in data[0]

    def test_get_race_fastest_pit_stops_not_found(self, client):
        """Test getting fastest pit stops for non-existent race."""
        response = client.get("/dashboard/race/999/fastest_pit_stops")
        assert response.status_code == 404

    def test_fastest_pit_stops_ordered_by_time(self, client):
        """Test that pit stops are ordered by time (fastest first)."""
        response = client.get("/dashboard/race/1/fastest_pit_stops")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 1:
            times = [r['milliseconds'] for r in data]
            assert times == sorted(times)

    def test_fastest_pit_stops_custom_limit(self, client):
        """Test getting fastest pit stops with custom limit."""
        response = client.get("/dashboard/race/1/fastest_pit_stops?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5


class TestRaceQualifying:
    """Tests for GET /dashboard/race/{race_id}/qualifying endpoint."""

    def test_get_race_qualifying(self, client):
        """Test getting qualifying results for valid race."""
        response = client.get("/dashboard/race/1/qualifying")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4  # 4 drivers qualified
        # Check structure
        assert 'position' in data[0]
        assert 'driver_name' in data[0]
        assert 'q1' in data[0]
        assert 'q2' in data[0]
        assert 'q3' in data[0]

    def test_get_race_qualifying_not_found(self, client):
        """Test getting qualifying for non-existent race."""
        response = client.get("/dashboard/race/999/qualifying")
        assert response.status_code == 404

    def test_qualifying_ordered_by_position(self, client):
        """Test that qualifying results are ordered by position."""
        response = client.get("/dashboard/race/1/qualifying")
        assert response.status_code == 200
        data = response.json()
        positions = [r['position'] for r in data]
        assert positions == sorted(positions)

    def test_qualifying_pole_position(self, client):
        """Test that pole position is correct."""
        response = client.get("/dashboard/race/1/qualifying")
        assert response.status_code == 200
        data = response.json()
        # Verstappen on pole
        assert data[0]['driver_name'] == 'Max Verstappen'
        assert data[0]['position'] == 1


class TestRaceWeather:
    """Tests for GET /dashboard/race/{race_id}/weather endpoint."""

    def test_get_race_weather_structure(self, client):
        """Test that weather endpoint returns correct structure."""
        response = client.get("/dashboard/race/1/weather")
        assert response.status_code == 200
        data = response.json()
        # Should have race info even if weather fetch fails
        assert 'race_name' in data
        assert 'circuit_name' in data

    def test_get_race_weather_not_found(self, client):
        """Test getting weather for non-existent race."""
        response = client.get("/dashboard/race/999/weather")
        assert response.status_code == 404


# =============================================================================
# EDGE CASE AND ERROR HANDLING TESTS
# =============================================================================

class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_race_with_no_lap_times(self, client):
        """Test getting lap times for race with no lap time data."""
        # Race 2 has results but no lap times in our test data
        response = client.get("/dashboard/race/2/lap_times")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_race_with_no_pit_stops(self, client):
        """Test getting pit stops for race with no pit stop data."""
        # Race 2 has results but no pit stops in our test data
        response = client.get("/dashboard/race/2/pit_stops")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_race_with_no_qualifying(self, client):
        """Test getting qualifying for race with no qualifying data."""
        # Race 2 has no qualifying in our test data
        response = client.get("/dashboard/race/2/qualifying")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_driver_standings_nonexistent_year(self, client):
        """Test driver standings for year with no data."""
        response = client.get("/dashboard/driver_standings?year=1900")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_constructor_standings_nonexistent_year(self, client):
        """Test constructor standings for year with no data."""
        response = client.get("/dashboard/constructor_standings?year=1900")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_races_list_nonexistent_year(self, client):
        """Test races list for year with no data."""
        response = client.get("/dashboard/races_list?year=1900")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_cumulative_wins_nonexistent_year(self, client):
        """Test cumulative wins for year with no wins."""
        response = client.get("/dashboard/cumulative_wins?year=1900")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_fastest_laps_nonexistent_year(self, client):
        """Test fastest laps for year with no data."""
        response = client.get("/dashboard/fastest_laps_by_circuit?year=1900")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_invalid_race_id_type(self, client):
        """Test that invalid race ID types are handled."""
        response = client.get("/dashboard/race/invalid/info")
        assert response.status_code == 422  # Validation error

    def test_negative_race_id(self, client):
        """Test race info with negative ID."""
        response = client.get("/dashboard/race/-1/info")
        assert response.status_code == 404


class TestDataIntegrity:
    """Tests for data integrity and consistency."""

    def test_driver_standings_points_consistency(self, client):
        """Test that driver standings points are non-negative."""
        response = client.get("/dashboard/driver_standings?year=2023")
        assert response.status_code == 200
        data = response.json()
        for standing in data:
            assert standing['points'] >= 0

    def test_constructor_standings_points_consistency(self, client):
        """Test that constructor standings points are non-negative."""
        response = client.get("/dashboard/constructor_standings?year=2023")
        assert response.status_code == 200
        data = response.json()
        for standing in data:
            assert standing['points'] >= 0

    def test_race_results_points_standard(self, client):
        """Test that race results have valid F1 points."""
        response = client.get("/dashboard/race/1/results")
        assert response.status_code == 200
        data = response.json()
        # P1 = 25, P2 = 18, P3 = 15, P4 = 12 (standard F1 points)
        expected_points = [25, 18, 15, 12]
        for i, result in enumerate(data[:4]):
            assert result['points'] == expected_points[i]

    def test_lap_times_milliseconds_positive(self, client):
        """Test that lap times are positive."""
        response = client.get("/dashboard/race/1/lap_times")
        assert response.status_code == 200
        data = response.json()
        for lap in data:
            assert lap['milliseconds'] > 0

    def test_pit_stop_duration_positive(self, client):
        """Test that pit stop durations are positive."""
        response = client.get("/dashboard/race/1/pit_stops")
        assert response.status_code == 200
        data = response.json()
        for stop in data:
            assert stop['milliseconds'] > 0
