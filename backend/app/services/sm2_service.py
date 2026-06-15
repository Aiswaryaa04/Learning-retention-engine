from datetime import datetime, timedelta, timezone

def calculate_next_review(quality: int, repetitions: int, interval: int, easiness_factor: float):
    """
    SM-2 Algorithm implementation.
    
    quality: 0-5 score from user
    repetitions: how many times reviewed successfully
    interval: current interval in days
    easiness_factor: how easy the card is (min 1.3)
    
    Returns: (next_interval, new_repetitions, new_easiness_factor, due_date)
    """
    
    if quality < 3:
        # Forgot it — reset back to beginning
        repetitions = 0
        interval = 1
    else:
        # Remembered it — increase interval
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * easiness_factor)
        
        repetitions += 1

    # Update easiness factor based on quality
    easiness_factor = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    
    # Easiness factor never goes below 1.3
    if easiness_factor < 1.3:
        easiness_factor = 1.3

    due_date = datetime.now(timezone.utc) + timedelta(days=interval)

    return interval, repetitions, easiness_factor, due_date

from datetime import datetime, timezone

def calculate_forgetting_risk(due_date, interval: int) -> dict:
    """
    Calculate how at-risk a concept is of being forgotten.
    Returns a risk level and days overdue/remaining.
    """
    now = datetime.now(timezone.utc)
    
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)
    
    days_overdue = (now - due_date).days
    
    if days_overdue < 0:
        # Not due yet
        days_remaining = abs(days_overdue)
        if days_remaining > interval * 0.5:
            risk = "safe"
        else:
            risk = "due_soon"
    elif days_overdue == 0:
        risk = "due_today"
    elif days_overdue <= 3:
        risk = "overdue"
    else:
        risk = "at_risk"
    
    return {
        "risk": risk,
        "days_overdue": max(0, days_overdue),
        "days_remaining": max(0, -days_overdue)
    }