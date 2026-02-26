import sqlite3
import json
import urllib.request
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query

from esm_fullstack_challenge.db import DB
from esm_fullstack_challenge.dependencies import get_db
from esm_fullstack_challenge.models.responses import (
    DriverStandingResponse,
    ConstructorStandingResponse,
    CumulativeWinResponse,
    FastestLapByCircuit,
    LapTimeResponse,
    PitStopResponse,
    RaceResultResponse,
    ConstructorRaceResult,
    RaceInfoResponse,
    RaceListItem,
    RaceWeatherResponse,
    QualifyingResult,
    ChampionshipProgressionPoint,
    PositionChangePoint,
    GridVsFinishResult,
)


dashboard_router = APIRouter()


# =============================================================================
# SEASON DASHBOARD ENDPOINTS
# =============================================================================

@dashboard_router.get("/driver_standings", response_model=List[DriverStandingResponse])
def get_driver_standings(
    year: Optional[int] = None,
    limit: int = Query(default=10, ge=1, le=100),
    db: DB = Depends(get_db)
) -> List[DriverStandingResponse]:
    """Get current driver championship standings."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Get the most recent race's standings for the given year (or most recent year)
        if year:
            cur.execute('''
                SELECT ds.*, d.forename || ' ' || d.surname as driver_name,
                       d.code, d.nationality, r.year
                FROM driver_standings ds
                JOIN drivers d ON ds.driver_id = d.id
                JOIN races r ON ds.race_id = r.id
                WHERE r.year = ?
                AND ds.race_id = (
                    SELECT MAX(race_id) FROM driver_standings ds2
                    JOIN races r2 ON ds2.race_id = r2.id
                    WHERE r2.year = ?
                )
                ORDER BY ds.position ASC
                LIMIT ?
            ''', (year, year, limit))
        else:
            cur.execute('''
                SELECT ds.*, d.forename || ' ' || d.surname as driver_name,
                       d.code, d.nationality, r.year
                FROM driver_standings ds
                JOIN drivers d ON ds.driver_id = d.id
                JOIN races r ON ds.race_id = r.id
                WHERE ds.race_id = (SELECT MAX(race_id) FROM driver_standings)
                ORDER BY ds.position ASC
                LIMIT ?
            ''', (limit,))

        standings = cur.fetchall()

    return [DriverStandingResponse(**dict(row)) for row in standings]


@dashboard_router.get("/constructor_standings", response_model=List[ConstructorStandingResponse])
def get_constructor_standings(
    year: Optional[int] = None,
    limit: int = Query(default=10, ge=1, le=100),
    db: DB = Depends(get_db)
) -> List[ConstructorStandingResponse]:
    """Get current constructor championship standings."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        if year:
            cur.execute('''
                SELECT cs.*, c.name as constructor_name, c.nationality, r.year
                FROM constructor_standings cs
                JOIN constructors c ON cs.constructor_id = c.id
                JOIN races r ON cs.race_id = r.id
                WHERE r.year = ?
                AND cs.race_id = (
                    SELECT MAX(race_id) FROM constructor_standings cs2
                    JOIN races r2 ON cs2.race_id = r2.id
                    WHERE r2.year = ?
                )
                ORDER BY cs.position ASC
                LIMIT ?
            ''', (year, year, limit))
        else:
            cur.execute('''
                SELECT cs.*, c.name as constructor_name, c.nationality, r.year
                FROM constructor_standings cs
                JOIN constructors c ON cs.constructor_id = c.id
                JOIN races r ON cs.race_id = r.id
                WHERE cs.race_id = (SELECT MAX(race_id) FROM constructor_standings)
                ORDER BY cs.position ASC
                LIMIT ?
            ''', (limit,))

        standings = cur.fetchall()

    return [ConstructorStandingResponse(**dict(row)) for row in standings]


@dashboard_router.get("/cumulative_wins", response_model=List[CumulativeWinResponse])
def get_cumulative_wins(
    year: Optional[int] = None,
    db: DB = Depends(get_db)
) -> List[CumulativeWinResponse]:
    """Get cumulative wins over time for drivers. If year is provided, shows wins accumulated during that season."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        if year:
            # Get wins for a specific season, showing cumulative within that season
            cur.execute('''
                SELECT
                    r.id as race_id,
                    r.year,
                    r.round,
                    r.date,
                    r.name as race_name,
                    d.id as driver_id,
                    d.forename || ' ' || d.surname as driver_name,
                    d.surname
                FROM results res
                JOIN races r ON res.race_id = r.id
                JOIN drivers d ON res.driver_id = d.id
                WHERE res.position_order = 1
                AND r.year = ?
                ORDER BY r.round ASC
            ''', (year,))
        else:
            # Get all race wins with dates, ordered chronologically
            cur.execute('''
                SELECT
                    r.id as race_id,
                    r.year,
                    r.round,
                    r.date,
                    r.name as race_name,
                    d.id as driver_id,
                    d.forename || ' ' || d.surname as driver_name,
                    d.surname
                FROM results res
                JOIN races r ON res.race_id = r.id
                JOIN drivers d ON res.driver_id = d.id
                WHERE res.position_order = 1
                ORDER BY r.date ASC
            ''')

        wins = cur.fetchall()

        # Calculate cumulative wins for each driver
        driver_cumulative = {}
        result = []

        for win in wins:
            driver_name = win['driver_name']
            win_year = win['year']

            if driver_name not in driver_cumulative:
                driver_cumulative[driver_name] = 0
            driver_cumulative[driver_name] += 1

            result.append(CumulativeWinResponse(
                year=win_year,
                round=win['round'],
                date=win['date'],
                race_name=win['race_name'],
                driver_name=driver_name,
                surname=win['surname'],
                cumulative_wins=driver_cumulative[driver_name]
            ))

    return result


@dashboard_router.get("/fastest_laps_by_circuit", response_model=List[FastestLapByCircuit])
def get_fastest_laps_by_circuit(
    year: Optional[int] = None,
    limit: int = Query(default=20, ge=1, le=100),
    db: DB = Depends(get_db)
) -> List[FastestLapByCircuit]:
    """Get fastest lap records by circuit. If year is provided, shows fastest laps for that season only."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        if year:
            cur.execute('''
                SELECT
                    c.id as circuit_id,
                    c.name as circuit_name,
                    c.country,
                    res.fastest_lap_time,
                    res.fastest_lap_speed,
                    d.forename || ' ' || d.surname as driver_name,
                    d.code as driver_code,
                    con.name as constructor_name,
                    r.year,
                    r.round,
                    r.name as race_name
                FROM results res
                JOIN races r ON res.race_id = r.id
                JOIN circuits c ON r.circuit_id = c.id
                JOIN drivers d ON res.driver_id = d.id
                JOIN constructors con ON res.constructor_id = con.id
                WHERE res.fastest_lap_time IS NOT NULL
                AND res.fastest_lap_time != ''
                AND res.rank = '1'
                AND r.year = ?
                ORDER BY r.round ASC
                LIMIT ?
            ''', (year, limit))
        else:
            cur.execute('''
                SELECT
                    c.id as circuit_id,
                    c.name as circuit_name,
                    c.country,
                    res.fastest_lap_time,
                    res.fastest_lap_speed,
                    d.forename || ' ' || d.surname as driver_name,
                    d.code as driver_code,
                    con.name as constructor_name,
                    r.year,
                    r.round,
                    r.name as race_name
                FROM results res
                JOIN races r ON res.race_id = r.id
                JOIN circuits c ON r.circuit_id = c.id
                JOIN drivers d ON res.driver_id = d.id
                JOIN constructors con ON res.constructor_id = con.id
                WHERE res.fastest_lap_time IS NOT NULL
                AND res.fastest_lap_time != ''
                AND res.rank = '1'
                ORDER BY r.year DESC, c.name
                LIMIT ?
            ''', (limit,))

        records = cur.fetchall()

    return [FastestLapByCircuit(**dict(row)) for row in records]


# =============================================================================
# RACE-SPECIFIC DASHBOARD ENDPOINTS
# =============================================================================

@dashboard_router.get("/race/{race_id}/lap_times", response_model=List[LapTimeResponse])
def get_race_lap_times(
    race_id: int,
    db: DB = Depends(get_db)
) -> List[LapTimeResponse]:
    """Get all lap times for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                lt.race_id,
                lt.driver_id,
                lt.lap,
                lt.position,
                lt.time,
                lt.milliseconds,
                d.forename || ' ' || d.surname as driver_name,
                d.code as driver_code,
                con.name as constructor_name
            FROM lap_times lt
            JOIN drivers d ON lt.driver_id = d.id
            JOIN results r ON lt.race_id = r.race_id AND lt.driver_id = r.driver_id
            JOIN constructors con ON r.constructor_id = con.id
            WHERE lt.race_id = ?
            ORDER BY lt.lap, lt.position
        ''', (race_id,))

        lap_times = cur.fetchall()

    return [LapTimeResponse(**dict(row)) for row in lap_times]


@dashboard_router.get("/race/{race_id}/pit_stops", response_model=List[PitStopResponse])
def get_race_pit_stops(
    race_id: int,
    db: DB = Depends(get_db)
) -> List[PitStopResponse]:
    """Get all pit stops for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                ps.race_id,
                ps.driver_id,
                ps.stop,
                ps.lap,
                ps.time,
                ps.duration,
                ps.milliseconds,
                d.forename || ' ' || d.surname as driver_name,
                d.code as driver_code,
                con.name as constructor_name
            FROM pit_stops ps
            JOIN drivers d ON ps.driver_id = d.id
            JOIN results r ON ps.race_id = r.race_id AND ps.driver_id = r.driver_id
            JOIN constructors con ON r.constructor_id = con.id
            WHERE ps.race_id = ?
            ORDER BY ps.lap, ps.stop
        ''', (race_id,))

        pit_stops = cur.fetchall()

    return [PitStopResponse(**dict(row)) for row in pit_stops]


@dashboard_router.get("/race/{race_id}/results", response_model=List[RaceResultResponse])
def get_race_results(
    race_id: int,
    db: DB = Depends(get_db)
) -> List[RaceResultResponse]:
    """Get full results for a specific race with podium info."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                res.id as result_id,
                res.position,
                res.position_order,
                res.points,
                res.laps,
                res.time,
                res.grid,
                res.fastest_lap_time,
                res.fastest_lap_speed,
                d.id as driver_id,
                d.forename || ' ' || d.surname as driver_name,
                d.code as driver_code,
                d.nationality as driver_nationality,
                con.id as constructor_id,
                con.name as constructor_name,
                s.status
            FROM results res
            JOIN drivers d ON res.driver_id = d.id
            JOIN constructors con ON res.constructor_id = con.id
            JOIN status s ON res.status_id = s.id
            WHERE res.race_id = ?
            ORDER BY res.position_order
        ''', (race_id,))

        results = cur.fetchall()

    return [RaceResultResponse(**dict(row)) for row in results]


@dashboard_router.get("/race/{race_id}/constructor_results", response_model=List[ConstructorRaceResult])
def get_race_constructor_results(
    race_id: int,
    db: DB = Depends(get_db)
) -> List[ConstructorRaceResult]:
    """Get constructor standings for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                con.id as constructor_id,
                con.name as constructor_name,
                con.nationality,
                SUM(res.points) as total_points,
                COUNT(res.id) as drivers_count,
                MIN(res.position_order) as best_position,
                GROUP_CONCAT(d.code, ', ') as driver_codes
            FROM results res
            JOIN constructors con ON res.constructor_id = con.id
            JOIN drivers d ON res.driver_id = d.id
            WHERE res.race_id = ?
            GROUP BY con.id, con.name, con.nationality
            ORDER BY total_points DESC, best_position ASC
        ''', (race_id,))

        results = cur.fetchall()

    return [ConstructorRaceResult(**dict(row)) for row in results]


@dashboard_router.get("/race/{race_id}/fastest_pit_stops", response_model=List[PitStopResponse])
def get_race_fastest_pit_stops(
    race_id: int,
    limit: int = Query(default=3, ge=1, le=20),
    db: DB = Depends(get_db)
) -> List[PitStopResponse]:
    """Get top fastest pit stops for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                ps.race_id,
                ps.driver_id,
                ps.stop,
                ps.lap,
                ps.time,
                ps.duration,
                ps.milliseconds,
                d.forename || ' ' || d.surname as driver_name,
                d.code as driver_code,
                con.name as constructor_name
            FROM pit_stops ps
            JOIN drivers d ON ps.driver_id = d.id
            JOIN results r ON ps.race_id = r.race_id AND ps.driver_id = r.driver_id
            JOIN constructors con ON r.constructor_id = con.id
            WHERE ps.race_id = ?
            AND ps.milliseconds IS NOT NULL
            ORDER BY ps.milliseconds ASC
            LIMIT ?
        ''', (race_id, limit))

        pit_stops = cur.fetchall()

    return [PitStopResponse(**dict(row)) for row in pit_stops]


@dashboard_router.get("/race/{race_id}/info", response_model=RaceInfoResponse)
def get_race_info(
    race_id: int,
    db: DB = Depends(get_db)
) -> RaceInfoResponse:
    """Get race info with circuit details."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute('''
            SELECT r.*, c.name as circuit_name, c.location, c.country
            FROM races r
            JOIN circuits c ON r.circuit_id = c.id
            WHERE r.id = ?
        ''', (race_id,))

        race = cur.fetchone()

        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

    return RaceInfoResponse(**dict(race))


@dashboard_router.get("/races_list", response_model=List[RaceListItem])
def get_races_list(
    year: Optional[int] = None,
    db: DB = Depends(get_db)
) -> List[RaceListItem]:
    """Get list of races for selector (optionally filtered by year)."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        if year:
            cur.execute('''
                SELECT r.id, r.year, r.round, r.name, r.date, c.name as circuit_name
                FROM races r
                JOIN circuits c ON r.circuit_id = c.id
                WHERE r.year = ?
                ORDER BY r.round
            ''', (year,))
        else:
            cur.execute('''
                SELECT r.id, r.year, r.round, r.name, r.date, c.name as circuit_name
                FROM races r
                JOIN circuits c ON r.circuit_id = c.id
                ORDER BY r.year DESC, r.round DESC
                LIMIT 100
            ''')

        races = cur.fetchall()

    return [RaceListItem(**dict(row)) for row in races]


@dashboard_router.get("/years_list", response_model=List[int])
def get_years_list(db: DB = Depends(get_db)) -> List[int]:
    """Get list of years with race data."""
    with db.get_connection() as conn:
        cur = conn.cursor()
        cur.execute('SELECT DISTINCT year FROM races ORDER BY year DESC')
        years = [row[0] for row in cur.fetchall()]

    return years


@dashboard_router.get("/race/{race_id}/weather", response_model=RaceWeatherResponse)
def get_race_weather(
    race_id: int,
    db: DB = Depends(get_db)
) -> RaceWeatherResponse:
    """Get weather data for race day and qualifying day using Open-Meteo API."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Get race info with circuit coordinates
        cur.execute('''
            SELECT r.date, r.quali_date, r.name,
                   c.lat, c.lng, c.name as circuit_name, c.country
            FROM races r
            JOIN circuits c ON r.circuit_id = c.id
            WHERE r.id = ?
        ''', (race_id,))

        race = cur.fetchone()

        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        race_data = dict(race)

    lat = race_data['lat']
    lng = race_data['lng']
    race_date = race_data['date']
    quali_date = race_data.get('quali_date')

    # Skip if coordinates are missing
    if lat is None or lng is None:
        return RaceWeatherResponse(
            race_name=race_data['name'],
            circuit_name=race_data['circuit_name'],
            race_date=race_date,
            error='No coordinates available for this circuit'
        )

    # Build dates list
    dates = [race_date]
    if quali_date and quali_date != '\\N' and quali_date != race_date:
        dates.append(quali_date)

    start_date = min(dates)
    end_date = max(dates)

    # Fetch weather from Open-Meteo Archive API
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat}&longitude={lng}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&hourly=temperature_2m,precipitation,wind_speed_10m,cloud_cover,weather_code"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
        f"&timezone=auto"
    )

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            weather_data = json.loads(response.read().decode())
    except Exception as e:
        return RaceWeatherResponse(
            race_name=race_data['name'],
            circuit_name=race_data['circuit_name'],
            country=race_data['country'],
            race_date=race_date,
            quali_date=quali_date,
            error=f'Failed to fetch weather data: {str(e)}'
        )

    # Process daily data
    daily = weather_data.get('daily', {})
    daily_times = daily.get('time', [])

    def get_daily_for_date(target_date):
        if target_date in daily_times:
            idx = daily_times.index(target_date)
            return {
                'date': target_date,
                'temp_max': daily.get('temperature_2m_max', [None])[idx],
                'temp_min': daily.get('temperature_2m_min', [None])[idx],
                'precipitation': daily.get('precipitation_sum', [None])[idx],
                'wind_max': daily.get('wind_speed_10m_max', [None])[idx],
            }
        return None

    return RaceWeatherResponse(
        race_name=race_data['name'],
        circuit_name=race_data['circuit_name'],
        country=race_data['country'],
        race_date=race_date,
        quali_date=quali_date if quali_date != '\\N' else None,
        race_weather=get_daily_for_date(race_date),
        quali_weather=get_daily_for_date(quali_date) if quali_date and quali_date != '\\N' else None,
        timezone=weather_data.get('timezone'),
    )


@dashboard_router.get("/race/{race_id}/qualifying", response_model=List[QualifyingResult])
def get_race_qualifying(
    race_id: int,
    db: DB = Depends(get_db)
) -> List[QualifyingResult]:
    """Get qualifying results for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                q.id,
                q.position,
                q.q1,
                q.q2,
                q.q3,
                d.id as driver_id,
                d.forename || ' ' || d.surname as driver_name,
                d.code as driver_code,
                d.nationality,
                con.id as constructor_id,
                con.name as constructor_name
            FROM qualifying q
            JOIN drivers d ON q.driver_id = d.id
            JOIN constructors con ON q.constructor_id = con.id
            WHERE q.race_id = ?
            ORDER BY q.position
        ''', (race_id,))

        qualifying = cur.fetchall()

    return [QualifyingResult(**dict(row)) for row in qualifying]


# =============================================================================
# NEW VISUALIZATION ENDPOINTS
# =============================================================================

@dashboard_router.get("/championship_progression", response_model=List[ChampionshipProgressionPoint])
def get_championship_progression(
    year: int,
    db: DB = Depends(get_db)
) -> List[ChampionshipProgressionPoint]:
    """Get championship points progression throughout a season."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute('''
            SELECT
                ds.race_id,
                r.round,
                r.name as race_name,
                ds.driver_id,
                d.forename || ' ' || d.surname as driver_name,
                d.code as driver_code,
                ds.points,
                ds.position
            FROM driver_standings ds
            JOIN races r ON ds.race_id = r.id
            JOIN drivers d ON ds.driver_id = d.id
            WHERE r.year = ?
            ORDER BY r.round, ds.position
        ''', (year,))

        results = cur.fetchall()

    return [ChampionshipProgressionPoint(**dict(row)) for row in results]


@dashboard_router.get("/race/{race_id}/position_changes", response_model=List[PositionChangePoint])
def get_race_position_changes(
    race_id: int,
    db: DB = Depends(get_db)
) -> List[PositionChangePoint]:
    """Get lap-by-lap position changes for a race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                lt.lap,
                lt.position,
                lt.driver_id,
                d.code as driver_code,
                d.forename || ' ' || d.surname as driver_name,
                con.name as constructor_name
            FROM lap_times lt
            JOIN drivers d ON lt.driver_id = d.id
            JOIN results res ON lt.race_id = res.race_id AND lt.driver_id = res.driver_id
            JOIN constructors con ON res.constructor_id = con.id
            WHERE lt.race_id = ?
            ORDER BY lt.lap, lt.position
        ''', (race_id,))

        results = cur.fetchall()

    return [PositionChangePoint(**dict(row)) for row in results]


@dashboard_router.get("/race/{race_id}/grid_vs_finish", response_model=List[GridVsFinishResult])
def get_race_grid_vs_finish(
    race_id: int,
    db: DB = Depends(get_db)
) -> List[GridVsFinishResult]:
    """Get grid vs finish position comparison for a race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Verify race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (race_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={race_id} does not exist!'
            )

        cur.execute('''
            SELECT
                res.driver_id,
                d.code as driver_code,
                d.forename || ' ' || d.surname as driver_name,
                con.name as constructor_name,
                res.grid,
                res.position_order as finish_position,
                (res.grid - res.position_order) as positions_gained,
                s.status
            FROM results res
            JOIN drivers d ON res.driver_id = d.id
            JOIN constructors con ON res.constructor_id = con.id
            JOIN status s ON res.status_id = s.id
            WHERE res.race_id = ?
            ORDER BY res.position_order
        ''', (race_id,))

        results = cur.fetchall()

    return [GridVsFinishResult(**dict(row)) for row in results]
