from starlette.config import Config

config = Config()
ENVIRONMENT = config('ENVIRONMENT', default='development')
PORT = config('PORT', cast=int, default=8000)
CORS_ORIGINS = config('CORS_ORIGINS', default='http://localhost:5173,http://127.0.0.1:5173')
DB_FILE = config('DB_FILE', default='data.db')

# JWT Settings
# NOTE: In production, this should be set via environment variable (SECRET_KEY).
# Using a default here for demo/development ease of use only.
SECRET_KEY = config('SECRET_KEY', default='demo-secret-key-not-for-production')
ALGORITHM = config('ALGORITHM', default='HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = config('ACCESS_TOKEN_EXPIRE_MINUTES', cast=int, default=30)
