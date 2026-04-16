"""
LLM chat route — only loaded when USE_LLM = True in routes.py.
Adds a POST /api/chat endpoint for the POURfect wine chatbot.

Setup:
  1. Add API_KEY=your_key to .env
  2. Set USE_LLM = True in routes.py
"""
import json
import os
import logging
from flask import request, jsonify, Response, stream_with_context
from infosci_spark_client import LLMClient

logger = logging.getLogger(__name__)


def register_chat_route(app, get_chatbot_context):
    """Register the /api/chat SSE endpoint. Called from routes.py."""

    @app.route("/api/chat", methods=["POST"])
    def chat():
        data = request.get_json() or {}
        user_message = (data.get("message") or "").strip()

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        api_key = os.getenv("API_KEY")
        if not api_key:
            return jsonify({"error": "API_KEY not set — add it to your .env file"}), 500

        client = LLMClient(api_key=api_key)

        try:
            context = get_chatbot_context(user_message, top_k=5)
            wines = context.get("results", [])
            context_text = context.get("context_text", "").strip()
        except Exception as e:
            logger.error(f"Wine retrieval error: {e}")
            return jsonify({"error": "Failed to retrieve wine matches"}), 500

        if wines:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are the wine assistant for the POURfect app. "
                        "Answer using only the retrieved wines provided to you. "
                        "Do not invent wines, ratings, descriptions, or food pairings not grounded in the provided context. "
                        "Be concise, helpful, and natural. "
                        "If the matches seem weak, say so clearly."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"User question: {user_message}\n\n"
                        f"Retrieved wines:\n\n{context_text}\n\n"
                        "Recommend wines and explain why they fit the user's request."
                    ),
                },
            ]
        else:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are the wine assistant for the POURfect app. "
                        "No wine matches were retrieved. "
                        "Politely explain that no strong matches were found and suggest a simpler food query."
                    ),
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ]

        def generate():
            try:
                for chunk in client.chat(messages, stream=True):
                    if chunk.get("content"):
                        yield f"data: {json.dumps({'content': chunk['content']})}\n\n"

            except Exception as e:
                logger.error(f"Streaming error: {e}")
                yield f"data: {json.dumps({'error': 'Streaming error occurred'})}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )