import sqlite3
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from esm_fullstack_challenge.db import DB
from esm_fullstack_challenge.dependencies import get_db
from esm_fullstack_challenge.models import AutoGenModels
from esm_fullstack_challenge.models.responses import (
    CircuitResponse,
    RaceDriverResult,
    RaceConstructorResult,
)
from esm_fullstack_challenge.routers.utils import \
    get_route_list_function, get_route_id_function


races_router = APIRouter()

table_model = AutoGenModels['races']


# Route to get race by id
get_race = get_route_id_function('races', table_model)
races_router.add_api_route(
    '/{id}', get_race,
    methods=["GET"], response_model=table_model,
)

# Route to get a list of races
get_races = get_route_list_function('races', table_model)
races_router.add_api_route(
    '', get_races,
    methods=["GET"], response_model=List[table_model],
)


@races_router.get('/{id}/circuit', response_model=CircuitResponse)
def get_race_circuit(id: int, db: DB = Depends(get_db)) -> CircuitResponse:
    """Get the circuit for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Get the race to find circuit_id
        cur.execute('SELECT circuit_id FROM races WHERE id = ?', (id,))
        race = cur.fetchone()
        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={id} does not exist!'
            )

        # Get circuit details
        cur.execute('SELECT * FROM circuits WHERE id = ?', (race['circuit_id'],))
        circuit = cur.fetchone()
        if not circuit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Circuit not found for race id={id}'
            )

    return CircuitResponse(**dict(circuit))


@races_router.get('/{id}/drivers', response_model=List[RaceDriverResult])
def get_race_drivers(id: int, db: DB = Depends(get_db)) -> List[RaceDriverResult]:
    """Get all drivers and their results for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Check race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={id} does not exist!'
            )

        # Get results with driver info
        cur.execute('''
            SELECT
                r.id as result_id,
                r.position,
                r.position_order,
                r.points,
                r.laps,
                r.time,
                r.grid,
                r.fastest_lap_time,
                d.id as driver_id,
                d.driver_ref,
                d.number,
                d.code,
                d.forename,
                d.surname,
                d.nationality
            FROM results r
            JOIN drivers d ON r.driver_id = d.id
            WHERE r.race_id = ?
            ORDER BY r.position_order
        ''', (id,))
        results = cur.fetchall()

    return [RaceDriverResult(**dict(row)) for row in results]


@races_router.get('/{id}/constructors', response_model=List[RaceConstructorResult])
def get_race_constructors(id: int, db: DB = Depends(get_db)) -> List[RaceConstructorResult]:
    """Get all constructors and their results for a specific race."""
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Check race exists
        cur.execute('SELECT id FROM races WHERE id = ?', (id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Race with id={id} does not exist!'
            )

        # Get constructor results aggregated
        cur.execute('''
            SELECT
                c.id as constructor_id,
                c.constructor_ref,
                c.name,
                c.nationality,
                SUM(r.points) as total_points,
                COUNT(r.id) as drivers_count,
                MIN(r.position_order) as best_position
            FROM results r
            JOIN constructors c ON r.constructor_id = c.id
            WHERE r.race_id = ?
            GROUP BY c.id, c.constructor_ref, c.name, c.nationality
            ORDER BY total_points DESC
        ''', (id,))
        results = cur.fetchall()

    return [RaceConstructorResult(**dict(row)) for row in results]
