import sqlite3
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from esm_fullstack_challenge.db import DB
from esm_fullstack_challenge.dependencies import get_db
from esm_fullstack_challenge.models import AutoGenModels
from esm_fullstack_challenge.routers.utils import \
    get_route_list_function, get_route_id_function
from esm_fullstack_challenge.auth.dependencies import get_current_active_user
from esm_fullstack_challenge.auth.models import User


drivers_router = APIRouter()

table_model = AutoGenModels['drivers']


class DriverInput(BaseModel):
    driver_ref: Optional[str] = None
    number: Optional[str] = None
    code: Optional[str] = None
    forename: str
    surname: str
    dob: str
    nationality: str
    url: Optional[str] = None


# Route to get driver by id
get_driver = get_route_id_function('drivers', table_model)
drivers_router.add_api_route(
    '/{id}', get_driver,
    methods=["GET"], response_model=table_model,
)

# Route to get a list of drivers
get_drivers = get_route_list_function('drivers', table_model)
drivers_router.add_api_route(
    '', get_drivers,
    methods=["GET"], response_model=List[table_model],
)


# Add route to create a new driver
@drivers_router.post('', response_model=table_model)
def create_driver(
    driver: DriverInput,
    db: DB = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new driver.
    """
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Get next available ID
        cur.execute('SELECT COALESCE(MAX(id), 0) + 1 FROM drivers')
        new_id = cur.fetchone()[0]

        # Generate driver_ref from surname if not provided
        driver_ref = driver.driver_ref or driver.surname.lower()

        # Insert new driver
        cur.execute(
            '''INSERT INTO drivers (id, driver_ref, number, code, forename, surname, dob, nationality, url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (new_id, driver_ref, driver.number, driver.code, driver.forename,
             driver.surname, driver.dob, driver.nationality, driver.url)
        )
        conn.commit()

        # Fetch and return the created driver
        cur.execute('SELECT * FROM drivers WHERE id = ?', (new_id,))
        created_driver = cur.fetchone()

    return table_model(**created_driver)


# Add route to update driver
@drivers_router.put('/{id}', response_model=table_model)
def update_driver(
    id: int,
    driver: DriverInput,
    db: DB = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update driver.
    """
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Check if driver exists
        cur.execute('SELECT * FROM drivers WHERE id = ?', (id,))
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Driver with id={id} does not exist!'
            )

        # Generate driver_ref from surname if not provided
        driver_ref = driver.driver_ref or driver.surname.lower()

        # Update driver
        cur.execute(
            '''UPDATE drivers
               SET driver_ref = ?, number = ?, code = ?, forename = ?,
                   surname = ?, dob = ?, nationality = ?, url = ?
               WHERE id = ?''',
            (driver_ref, driver.number, driver.code, driver.forename,
             driver.surname, driver.dob, driver.nationality, driver.url, id)
        )
        conn.commit()

        # Fetch and return the updated driver
        cur.execute('SELECT * FROM drivers WHERE id = ?', (id,))
        updated_driver = cur.fetchone()

    return table_model(**updated_driver)


# Add route to delete driver
@drivers_router.delete('/{id}', response_model=table_model)
def delete_driver(
    id: int,
    db: DB = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete driver.
    """
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Check if driver exists and get data before deletion
        cur.execute('SELECT * FROM drivers WHERE id = ?', (id,))
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Driver with id={id} does not exist!'
            )

        # Store the driver data before deletion
        deleted_driver = table_model(**existing)

        # Delete the driver
        cur.execute('DELETE FROM drivers WHERE id = ?', (id,))
        conn.commit()

    return deleted_driver
