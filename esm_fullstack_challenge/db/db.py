import sqlite3
from contextlib import contextmanager


# Index definitions for performance optimization
# Format: (index_name, table, columns)
INDEXES = [
    # Results table indexes (heavily queried)
    ('idx_results_race_id', 'results', ['race_id']),
    ('idx_results_driver_id', 'results', ['driver_id']),
    ('idx_results_constructor_id', 'results', ['constructor_id']),
    ('idx_results_race_driver', 'results', ['race_id', 'driver_id']),
    ('idx_results_position', 'results', ['position_order']),

    # Qualifying indexes
    ('idx_qualifying_race_id', 'qualifying', ['race_id']),
    ('idx_qualifying_driver_id', 'qualifying', ['driver_id']),

    # Lap times indexes
    ('idx_lap_times_race_id', 'lap_times', ['race_id']),
    ('idx_lap_times_driver_id', 'lap_times', ['driver_id']),
    ('idx_lap_times_race_driver', 'lap_times', ['race_id', 'driver_id']),

    # Pit stops indexes
    ('idx_pit_stops_race_id', 'pit_stops', ['race_id']),
    ('idx_pit_stops_driver_id', 'pit_stops', ['driver_id']),

    # Standings indexes
    ('idx_driver_standings_race_id', 'driver_standings', ['race_id']),
    ('idx_driver_standings_driver_id', 'driver_standings', ['driver_id']),
    ('idx_constructor_standings_race_id', 'constructor_standings', ['race_id']),
    ('idx_constructor_standings_constructor_id', 'constructor_standings', ['constructor_id']),

    # Races indexes
    ('idx_races_circuit_id', 'races', ['circuit_id']),
    ('idx_races_year', 'races', ['year']),
    ('idx_races_date', 'races', ['date']),

    # Users indexes
    ('idx_users_username', 'users', ['username']),
    ('idx_users_email', 'users', ['email']),
]


class DB:
    """Database class for managing SQLite connections."""
    def __init__(self, db_file: str):
        self.db_file = db_file

    @contextmanager
    def get_connection(self):
        """Context manager for database connection."""
        conn = sqlite3.connect(self.db_file)
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def ensure_indexes(self):
        """Create indexes if they don't exist for better query performance."""
        with self.get_connection() as conn:
            cur = conn.cursor()

            # Get existing indexes
            cur.execute("SELECT name FROM sqlite_master WHERE type='index'")
            existing_indexes = {row[0] for row in cur.fetchall()}

            for index_name, table, columns in INDEXES:
                if index_name not in existing_indexes:
                    # Check if table exists before creating index
                    cur.execute(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                        (table,)
                    )
                    if cur.fetchone():
                        columns_str = ', '.join(columns)
                        try:
                            cur.execute(
                                f'CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({columns_str})'
                            )
                        except sqlite3.OperationalError:
                            # Index creation might fail if columns don't exist
                            pass

            conn.commit()
