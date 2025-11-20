from celery import Celery
from ..config import settings

celery_app = Celery('tasks', broker=settings.REDIS_URL)

@celery_app.task
def send_email(to: str, subject: str, body: str):
    """Send email notification"""
    pass

@celery_app.task
def end_tournament(tournament_id: int):
    """End tournament and calculate final rankings"""
    pass

@celery_app.task
def export_tournament_data(tournament_id: int):
    """Export tournament data to CSV"""
    pass
