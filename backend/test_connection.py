from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv('.env.local')

database_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {database_url}\n")

try:
    engine = create_engine(database_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()
        print(f"✅ PostgreSQL connected successfully!")
        print(f"Version: {version[0][:50]}...")
except Exception as e:
    print(f"❌ Connection failed: {e}")