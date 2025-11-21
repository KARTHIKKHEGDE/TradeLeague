"""
Create a fresh admin user with Argon2 password hash
Run this after clearing old users
"""
import sys
import os

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models.user import User
from app.services.auth_service import get_password_hash

def create_admin_user():
    """Create admin user with Argon2 hash"""
    
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == "admin@test.com").first()
        if existing:
            print(f"❌ User admin@test.com already exists")
            return
        
        # Create new admin user
        admin = User(
            email="admin@test.com",
            username="admin",
            hashed_password=get_password_hash("Password@123"),
            is_active=True,
            is_admin=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"   Email: admin@test.com")
        print(f"   Password: Password@123")
        print(f"   User ID: {admin.id}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Creating Admin User with Argon2 Password Hash")
    print("=" * 60)
    create_admin_user()
