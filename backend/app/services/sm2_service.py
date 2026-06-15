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