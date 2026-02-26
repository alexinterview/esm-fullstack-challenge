"""Initialize the users table and seed with test users."""
import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def init_users_table(db_file: str = "data.db"):
    """Create users table and seed with test users."""
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()

    # Create users table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            disabled INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Check if users already exist
    cur.execute('SELECT COUNT(*) FROM users')
    count = cur.fetchone()[0]

    if count == 0:
        # Seed with test users (matching users.json)
        test_users = [
            {
                "id": 1,
                "username": "janedoe",
                "email": "jane@example.com",
                "password": "password",
                "full_name": "Jane Doe"
            },
            {
                "id": 2,
                "username": "johndoe",
                "email": "john@example.com",
                "password": "password",
                "full_name": "John Doe"
            }
        ]

        for user in test_users:
            hashed_password = get_password_hash(user["password"])
            cur.execute(
                '''INSERT INTO users (id, username, email, hashed_password, full_name, disabled)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (user["id"], user["username"], user["email"], hashed_password, user["full_name"], 0)
            )
            print(f"Created user: {user['username']}")

    conn.commit()
    conn.close()
    print("Users table initialized successfully!")


if __name__ == "__main__":
    init_users_table()
