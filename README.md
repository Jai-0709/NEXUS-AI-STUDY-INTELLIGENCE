# RAG Assistant

End-to-end Retrieval-Augmented Generation assistant using FastAPI, FAISS, HuggingFace embeddings, Nexus AI API, and a Vite/React/Tailwind UI.

## Features
- PDF upload → FAISS indexing, list/activate/delete documents (cached loads).
- Document Q&A (RAG) and summaries (summary/revision).
- Role chat (Tutor/Researcher/Summarizer) plus general chat.
- Flashcards generator (topic or active document context) and quiz generator.
- Visual mind map (inline SVG).
- Slide/Image explainer: OCR a slide/image → notes + flashcards + quiz.
- Collaboration bundle: summary + flashcards + quiz + mind map (optionally uses active document context).
- Offline QA: returns top cached chunks without calling a model.
- Media tools: audio transcription (Whisper) and image OCR with optional cleanup/summarization.

## Prerequisites
- Python 3.11+
- Node.js 18+
- Nexus API key (`NEXUS_API_KEY`)

## Backend setup
1. From the repo root, create/activate a virtual environment (one is already configured at `.venv`):
   - Windows PowerShell: `python -m venv .venv; .\.venv\Scripts\Activate.ps1`
2. Install dependencies (already installed if you used the automated setup):
   - `pip install -r backend/requirements.txt`
3. Run the API:
   - `.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`

## Frontend setup
1. `cd frontend`
2. Install deps: `npm install`
3. Start dev server (frontend folder): `npm run dev -- --host --port 5174`

## Usage
1. Open the frontend (default http://localhost:5174 — follow the Vite port printed in the terminal if different).
2. Upload a PDF.
3. Use the sidebar groups: Chat (Document QA, General AI, AI Roles), Study Tools (Summaries, Flashcards, Quiz, Slide Explainer, Mind Map, Collab Bundle, Offline QA), Media (audio transcription, image OCR + summary).
4. Document-aware tools ground answers only in retrieved PDF chunks via Nexus AI. Offline QA returns cached chunks only.

## Notes
- Ensure `NEXUS_API_KEY` is set in your environment before running the backend.
- Vector store is in-memory and resets on server restart; PDFs are stored in `backend/uploads`.
- Retrieval uses top-3 FAISS results with 500/50 chunking via `PyPDFLoader` + `RecursiveCharacterTextSplitter`.
