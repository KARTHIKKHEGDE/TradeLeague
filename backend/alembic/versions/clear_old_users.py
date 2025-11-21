"""Clear old users with bcrypt passwords

Revision ID: clear_old_users
Revises: 98f180f6ed8a
Create Date: 2025-11-21 01:50:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'clear_old_users'
down_revision = '98f180f6ed8a'
branch_labels = None
depends_on = None


def upgrade():
    # Delete all existing users (they have bcrypt passwords)
    op.execute("DELETE FROM wallets")
    op.execute("DELETE FROM trades")
    op.execute("DELETE FROM positions")
    op.execute("DELETE FROM users")
    print("✅ All old users and related data cleared")


def downgrade():
    # Can't restore deleted data
    pass
