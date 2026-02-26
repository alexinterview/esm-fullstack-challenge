# ESM FullStack Challenge
Formula One Web App - Implementation Summary

## Overview

This is a Formula One data visualization web app with a FastAPI backend, React-Admin frontend, and SQLite database. All four challenge tasks were completed, plus additional improvements.

## Challenge Tasks Completed

### 1. Drivers CRUD Operations

**Backend (`esm_fullstack_challenge/routers/drivers.py`):**
- `POST /drivers` - Create new drivers with auto-generated IDs
- `PUT /drivers/{id}` - Update existing drivers
- `DELETE /drivers/{id}` - Remove drivers
- All mutating endpoints require JWT authentication

**Frontend (`dashboard/src/pages/drivers.tsx`):**
- Create driver dialog with full form validation (driver_ref, number, code, forename, surname, dob, nationality, url)
- Edit driver dialog with pre-populated form data
- Delete functionality from both detail view and list selection
- Floating action buttons (FABs) for quick Create/Edit/Delete actions
- Detail dialog showing driver information with Edit/Delete actions

### 2. Races Tabbed View

**Backend (`esm_fullstack_challenge/routers/races.py`):**
- `GET /races/{id}/circuit` - Returns circuit details
- `GET /races/{id}/drivers` - Returns race results with driver info
- `GET /races/{id}/constructors` - Returns aggregated constructor results

**Frontend (`dashboard/src/pages/races.tsx`):**
- Race detail dialog with 4-tab navigation: Summary, Circuit, Drivers, Constructors
- Tabbed interface with lazy-loading of tab content
- "Analyze Race" button linking to dashboard race analysis

### 3. Dashboard Visualizations

**Backend (`esm_fullstack_challenge/routers/dashboard.py`):**
- Dashboard endpoints split into season and race-specific categories
- Season endpoints: driver/constructor standings, cumulative wins, fastest laps by circuit, championship progression, years list, races list
- Race endpoints: lap times, pit stops, results, constructor results, qualifying, weather, position changes, grid vs finish comparison

**Frontend (`dashboard/src/pages/dashboard.tsx` + components):**
- Tabbed dashboard with "Season Overview" and "Race Analysis" views
- Season Overview includes:
  - Season selector dropdown
  - Driver/Constructor standings tables
  - Cumulative wins chart (line chart)
  - Championship progression chart
  - Fastest laps table
- Race Analysis includes:
  - Race selector
  - Race info header with weather data
  - Podium display cards
  - Qualifying results table
  - Lap times chart
  - Position changes chart (line chart)
  - Grid vs finish comparison chart

### 4. User Authentication

**Backend (`esm_fullstack_challenge/auth/`):**
- JWT-based authentication with bcrypt password hashing
- `POST /auth/register` - User registration with validation
- `POST /auth/login` - OAuth2-compatible login (form data)
- `POST /auth/login/json` - JSON login endpoint for frontend
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Stateless logout
- Password strength validation (min 8 characters)
- Username validation (alphanumeric + underscores only)

**Frontend:**
- `LoginPage.tsx` - Custom login page with username/password form
- `RegisterPage.tsx` - Registration page with validation
- Updated `authProvider.ts` to use JWT tokens and backend endpoints

---

## Part 5: Additional Improvements

### 1. Standardized Table Views
- Replaced raw tables with consistent `DataTable` components across all list views
- Consistent overflow handling and pagination styling
- `DetailDialog` reusable component for drill-down views

### 2. Dashboard Split: Season vs Race Analysis
- Season-level view: Standings, cumulative statistics, championship progression over rounds
- Race-level view: Detailed race analytics including lap times, pit stops, position changes
- Deep linking support: Navigate from races list directly to race analysis via URL params (`?raceId=123`)

### 3. Historical Weather Lookup
- Integration with Open-Meteo Archive API (free, no auth required)
- `GET /dashboard/race/{race_id}/weather` endpoint fetches historical weather for race day
- Uses circuit coordinates (lat/lng) from database
- Returns temperature range, precipitation, and wind speed
- Frontend `WeatherCard` component displays conditions for race and qualifying days

### 4. Database Indexing

Added 20+ indexes in `esm_fullstack_challenge/db/db.py` for performance:
- Results table: race_id, driver_id, constructor_id, composite indexes, position_order
- Qualifying, Lap times, Pit stops: race_id, driver_id
- Standings: race_id, driver_id/constructor_id
- Races: circuit_id, year, date
- Users: username, email

Indexes are created lazily via `db.ensure_indexes()` on startup. Given that F1 historical data is largely read-only, being generous with indexes is acceptable since write performance penalties are minimal.

### 5. SQL Injection Protection

Enhanced `esm_fullstack_challenge/db/utils.py`:
- `validate_identifier()` function with whitelist pattern for column/table names
- `query_builder()` validates all dynamic identifiers
- Operators restricted to whitelist: `=`, `!=`, `<`, `>`, `<=`, `>=`
- All user-provided values use parameterized queries

### 6. Test Coverage

Added test files:
- `tests/test_auth.py` - Authentication endpoint tests
- `tests/test_drivers.py` - Driver CRUD endpoint tests
- `tests/test_dashboard.py` - Dashboard endpoint tests

---

## New Frontend Components

**`dashboard/src/components/`**

| Category | Components |
|----------|------------|
| Common | `TabPanel`, `DetailDialog` |
| Season | `SeasonDashboard`, `SeasonSelector`, `DriverStandingsTable`, `ConstructorStandingsTable`, `CumulativeWinsChart`, `ChampionshipProgressionChart`, `FastestLapsTable` |
| Race | `RaceDashboard`, `RaceSelector`, `RaceInfoHeader`, `WeatherCard`, `PodiumCard`, `RacePodiums`, `QualifyingResultsTable`, `LapTimesChart`, `PositionChangesChart`, `GridVsFinishChart` |

## Getting Started
The easiest way to get started is by running the following command:
```
make run
```
This uses Docker Compose to launch two containerized services (`ui`, `api`) and mounts the `dashboard/src` and `esm_fullstack_challenge` folders which enables hot reload of the files as you work on them.


Alternatively, you can launch the applications individually by running:
```
make api
```
and (in a separate terminal)
```
make ui
```
This launches the applications without docker but requires you to have Python (v3.13+), NodeJS (v22.17.0+), and Yarn (v1.22.22+) installed.

## Submitting Work
Please create a public GitHub repo and share the link via email.

## Criteria
* The bare minimum requirement is that the Web App is able to run using the following command:
    ```
    make run
    ```
* Software development best practices are encouraged, but not required.
* Any documentation provided will help us better understand your work.
* Please take no longer than 72 hours to complete the challenge once you have begun.
