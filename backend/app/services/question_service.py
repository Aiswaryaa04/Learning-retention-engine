import anthropic
import json
import re
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

def generate_question(concept_title: str, concept_explanation: str, related_context: str = "") -> dict:
    """Generate a quiz question for a concept using Claude."""
    
    context_section = ""
    if related_context:
        context_section = f"\nRelated context from the study material:\n{related_context}\n"
    
    prompt = f"""You are a quiz generator for a spaced repetition learning app.

Generate ONE quiz question for this concept:

Concept: {concept_title}
Explanation: {concept_explanation}
{context_section}

Generate a question that tests deep understanding, not just memorization.

Return ONLY a JSON object with this exact format, no markdown, no code blocks:
{{
  "question": "your question here",
  "answer": "the correct answer here",
  "hint": "a helpful hint without giving away the answer"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    
    response_text = message.content[0].text
    response_text = re.sub(r'```json\s*', '', response_text)
    response_text = re.sub(r'```\s*', '', response_text)
    response_text = response_text.strip()
    
    question_data = json.loads(response_text)
    return question_data