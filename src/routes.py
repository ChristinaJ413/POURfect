"""
Routes: React app serving and episode search API.

To enable AI chat, set USE_LLM = True below. See llm_routes.py for AI code.
"""
import json
import os
from flask import send_from_directory, request, jsonify
from src.models import Episode, db, Review
from backend.search_wines import search_wines as backend_search_wines
from backend.rag import run_query_with_suggestions, SAMPLE_DESCRIPTIONS

# ── AI toggle ────────────────────────────────────────────────────────────────
#USE_LLM = False
USE_LLM = True
# ─────────────────────────────────────────────────────────────────────────────


def json_search(query):
    if not query or not query.strip():
        query = "Kardashian"
    results = db.session.query(Episode, Review).join(
        Review, Episode.id == Review.id
    ).filter(
        Episode.title.ilike(f'%{query}%')
    ).all()
    matches = []
    for episode, review in results:
        matches.append({
            'title': episode.title,
            'descr': episode.descr,
            'imdb_rating': review.imdb_rating
        })
    return matches


def register_routes(app):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    @app.route("/api/config")
    def config():
        return jsonify({"use_llm": USE_LLM})

    @app.route("/api/episodes")
    def episodes_search():
        text = request.args.get("title", "")
        return jsonify(json_search(text))

    @app.route("/api/search")
    def wine_search():
        query = request.args.get("query", "")
        if not query or not query.strip():
            return jsonify({
                "results": [],
                "latent_dimensions": []
            })
        
        #data = backend_search_wines(query, top_k=5, top_dims=10)
        data = run_query_with_suggestions(query, SAMPLE_DESCRIPTIONS)
        return jsonify(data)

    if USE_LLM:
        from src.llm_routes import register_chat_route
        register_chat_route(app, json_search)
