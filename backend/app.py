# app.py — Flask server, the "traffic controller" between React and Python

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from parser import parse_syllabus
from google_sync import sync_to_google

load_dotenv()

app = Flask(__name__)
CORS(app)  # allows React (port 5173) to call Flask (port 5000)

# ============================================================
# ROUTES
# ============================================================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Server is running"})


@app.route('/upload', methods=['POST'])
def upload_syllabus():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    # save temporarily so Docling can read it from disk
    temp_path = os.path.join("temp", file.filename)
    file.save(temp_path)

    try:
        result = parse_syllabus(temp_path)
        return jsonify({
            "status": "success",
            "course_name": result['course_name'],
            "items": result['items']
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # always clean up the temp file whether or not parsing succeeded
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.route('/sync', methods=['POST'])
def sync():
    data = request.get_json()
    items = data.get("items", [])
    course_name = data.get("course_name", "My Course")

    if not items:
        return jsonify({"error": "No items provided"}), 400

    try:
        result = sync_to_google(items, course_name)
        return jsonify({
            "success": True,
            "synced": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # debug=True auto-restarts on save — disable in production
    app.run(debug=True, port=5000)