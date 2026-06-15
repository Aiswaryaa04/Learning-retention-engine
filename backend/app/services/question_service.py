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

def evaluate_answer(question: str, correct_answer: str, user_answer: str, concept_title: str) -> dict:
    """Claude evaluates the user's answer and gives feedback."""
    
    prompt = f"""You are a helpful tutor evaluating a student's answer.

Concept: {concept_title}
Question: {question}
Correct Answer: {correct_answer}
Student's Answer: {user_answer}

Evaluate the student's answer and respond with:
1. Whether they got it right (fully, partially, or not quite)
2. Specific feedback on what they got right and what they missed
3. A short tip to remember this better

Return ONLY a JSON object, no markdown, no code blocks:
{{
  "score": "full" | "partial" | "incorrect",
  "feedback": "your specific feedback here",
  "tip": "a memorable tip to retain this concept"
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
    
    return json.loads(response_text)


def get_concept_brushup(concept_title: str, concept_explanation: str, related_context: str = "") -> str:
    """Claude gives a deeper explanation of a concept."""
    
    context_section = ""
    if related_context:
        context_section = f"\nRelated concepts from the study material:\n{related_context}\n"
    
    prompt = f"""You are a patient tutor helping a student understand a concept deeply.

Concept: {concept_title}
Explanation: {concept_explanation}
{context_section}

Give a thorough but friendly explanation of this concept. Include:
1. The core idea in simple terms
2. A real-world analogy or example
3. Common mistakes or misconceptions
4. How it connects to related concepts

Keep it conversational and under 200 words. Return plain text, no markdown headers."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return message.content[0].text