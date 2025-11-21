"""
Delete a user from the database
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))

print("DATABASE_URL:", os.getenv("DATABASE_URL"))

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models.user import User

def delete_user(email: str):
    """Delete user by email"""
    
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ User {email} not found")
            return
        
        db.delete(user)
        db.commit()
        
        print(f"✅ User {email} deleted successfully!")
        
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        db.rollback()
        
    finally:
        db.close()

if __name__ == "__main__":
    # Change to the email you want to delete
    delete_user("testuser@example.com")