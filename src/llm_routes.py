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
    @app.route("/api/chat", methods=["POST"])
    def chat():
        data = request.get_json() or {}
        user_message = (data.get("message") or "").strip()

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        api_key = os.getenv("SPARK_API_KEY")
        if not api_key:
            return jsonify({"error": "SPARK_API_KEY not set"}), 500

        client = LLMClient(api_key=api_key)

        try:
            context = get_chatbot_context(user_message, top_k=5)
            context_text = context.get("context_text", "").strip()
        except Exception:
            context_text = ""

        system_prompt = """
You are the POURfect wine assistant, an expert on wine pairing, wine styles,
grapes, regions, tasting terms, and food-and-wine matching.

You have two sources of knowledge:
1. Retrieved wines from the POURfect dataset
2. Your general wine expertise

Rules:
- If the user is asking for recommendations, comparisons, or explanations about wines
  from the dataset, use the retrieved wines directly.
- If the dataset does not contain enough information, you may use general wine knowledge
  to explain concepts, pairing logic, grape/style expectations, and likely characteristics.
- Never invent a wine that is not in the retrieved dataset when naming specific recommendations.
- Never make up dataset-specific facts that were not provided.
- If something is unknown from the dataset, say so clearly, then provide the best general explanation.
- Be helpful, natural, and concise.
- When listing recommendations, use bullets and bold the wine names.

Important rules:
- If a retrieved wine is provided in the context, treat it as being in the dataset.
- Do not say a wine is 'not in the dataset' unless the backend context explicitly says no direct match was found.
- If the user names a specific wine and it appears in the retrieved context, discuss that wine directly.
- Never contradict the provided context.
- You may use general wine knowledge to explain style and pairing, but not to deny the existence of a wine already present in context.
"""

        user_prompt = f"""
User question:
{user_message}

Retrieved wines from the dataset:
{context_text if context_text else "No strong retrieved wines were found."}

Answer the user's question as a wine expert.
If relevant, use the dataset wines above.
If needed, supplement with general wine knowledge.
Clearly distinguish between dataset-based statements and general wine knowledge.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        def generate():
            try:
                for chunk in client.chat(messages, stream=True):
                    if chunk.get("content"):
                        yield f"data: {json.dumps({'content': chunk['content']})}\n\n"
            except Exception:
                yield f"data: {json.dumps({'error': 'Streaming error occurred'})}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )