from youtube_transcript_api import YouTubeTranscriptApi
import re

def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")

def get_youtube_transcript(url: str) -> str:
    """Fetch transcript from a YouTube video."""
    video_id = extract_video_id(url)
    
    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
    
    # Join all transcript pieces into one text
    transcript = " ".join([entry["text"] for entry in transcript_list])
    return transcript