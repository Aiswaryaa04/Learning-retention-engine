from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
import re

def extract_video_id(url: str) -> str:
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")

def get_youtube_transcript(url: str) -> str:
    video_id = extract_video_id(url)
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = " ".join([entry["text"] for entry in transcript_list])
        return transcript
    except TranscriptsDisabled:
        raise ValueError("This video has disabled transcripts. Try a different video.")
    except NoTranscriptFound:
        raise ValueError("No transcript found for this video. Try a video with captions enabled.")
    except Exception as e:
        raise ValueError(f"YouTube is blocking transcript access from this server. Try pasting the transcript manually as text instead.")