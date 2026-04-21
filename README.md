# 🧠 NEXUS — AI Study Intelligence

> An AI-powered RAG (Retrieval-Augmented Generation) assistant that transforms your study documents into an interactive learning experience. Upload PDFs, ask questions, generate flashcards, take quizzes, visualize mind maps, and chat with an AI tutor — all grounded in your own content.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **PDF Upload & Indexing** | Upload PDFs up to 15 MB; automatically chunked and embedded into a vector store |
| 💬 **Document Q&A** | Ask natural-language questions answered using similarity search over your document |
| 📝 **Summarization** | Generate concise summaries or revision bullet points from document context |
| 🃏 **Flashcard Generator** | Auto-generate study flashcards (Q&A pairs) from any topic using document context |
| 🧩 **Quiz Generator** | Create multiple-choice quizzes with explanations grounded in uploaded content |
| 🗺️ **Mind Map Visualizer** | Generate interactive SVG mind maps for any topic |
| 🎙️ **Audio Transcription** | Transcribe audio files (up to 20 MB) using Whisper API |
| 🖼️ **Image-to-Text (OCR)** | Extract and summarize text from PNG/JPEG images via GPT-4 Vision |
| 🤖 **Role-based Chat** | Chat with an AI acting as a Tutor, Researcher, or Summarizer |
| 📚 **Multi-document Management** | Manage and switch between multiple uploaded documents |
| 🔒 **Rate Limiting** | Per-client rate limiting on all endpoints to prevent abuse |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework and component architecture |
| Vite | 5.2 | Dev server and production bundler |
| Tailwind CSS | 3.4 | Utility-first styling |
| PostCSS + Autoprefixer | 8.x / 10.x | CSS processing and cross-browser compatibility |
| Axios | 1.6 | HTTP client for API communication |
| Lenis | 1.3 | Smooth scrolling |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | latest | REST API framework with auto validation |
| Pydantic | v2 | Request/response schema validation |
| Uvicorn | standard | ASGI server for development |
| Gunicorn | latest | Production process manager with Uvicorn workers |
| python-dotenv | latest | Local environment variable loading |

### AI / RAG Pipeline
| Technology | Purpose |
|---|---|
| LangChain | RAG orchestration (loaders, splitters, vectorstores) |
| langchain-openai | OpenAI-compatible embeddings and chat |
| FAISS | Primary vector index (persisted to disk) |
| InMemoryVectorStore | Fallback when FAISS is unavailable |
| OpenAI SDK | Chat completions, Whisper transcription, Vision OCR |
| `text-embedding-3-small` | Document embedding model |
| `gpt-4.1-nano` | LLM for Q&A, summaries, flashcards, quiz, mind maps |
| `whisper-1` | Audio transcription model |
| PyPDFLoader (pypdf) | PDF text extraction |
| RecursiveCharacterTextSplitter | Chunk-based text splitting (900 chars, 80 overlap) |

### Deployment
| Platform | Role |
|---|---|
| Render | Python web service hosting (via `render.yaml`) |
| Vercel | Frontend static hosting |

---

## 📁 Project Structure

```
RAG/
├── backend/
│   ├── main.py              # FastAPI app, all REST endpoints, rate limiting
│   ├── rag_pipeline.py      # RAG logic: PDF loading, embeddings, LLM calls
│   ├── requirements.txt     # Python dependencies
│   ├── documents.json       # Persistent document metadata
│   ├── uploads/             # Uploaded PDF files
│   └── stores/              # Persisted FAISS / InMemory vector indexes
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Root app state and routing logic
│   │   ├── main.jsx                     # React entry point
│   │   ├── index.css                    # Global styles and Tailwind directives
│   │   └── components/
│   │       ├── Sidebar.jsx              # Document manager & feature navigation
│   │       ├── ChatWindow.jsx           # Conversation display
│   │       ├── InputBox.jsx             # Message input with media upload
│   │       ├── MessageBubble.jsx        # Individual chat message component
│   │       ├── IntroScreen.jsx          # Landing/onboarding screen
│   │       ├── FlashcardsTab.jsx        # Flashcard generator UI
│   │       ├── QuizTab.jsx              # Quiz generator UI
│   │       ├── MindMapVisual.jsx        # SVG mind map renderer
│   │       └── StudyInsightsTab.jsx     # Study insights display
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── render.yaml              # Render deployment configuration
├── setup.md                 # Local setup guide
└── README.md                # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- A **NEXUS API Key** (`NEXUS_API_KEY`) from Navigate Labs AI

### 1. Clone the Repository

```bash
git clone https://github.com/Jai-0709/NEXUS-AI-STUDY-INTELLIGENCE.git
cd NEXUS-AI-STUDY-INTELLIGENCE
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create the .env file
echo NEXUS_API_KEY=your_key_here > .env

# Start the dev server
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔌 API Reference

All endpoints are served from the FastAPI backend. Base URL: `http://localhost:8000`

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/documents` | List all uploaded documents and active doc ID |
| `POST` | `/upload` | Upload and index a PDF (multipart/form-data) |
| `POST` | `/documents/{doc_id}/activate` | Switch the active document |
| `DELETE` | `/documents/{doc_id}` | Delete a document and its vector index |

### AI Features

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/ask` | `{ "question": str }` | Q&A grounded in active document |
| `POST` | `/summarize` | `{ "mode": "summary\|revision", "k": int }` | Summarize document context |
| `POST` | `/chat/general` | `{ "question": str }` | General knowledge chat (no document) |
| `POST` | `/chat/role` | `{ "role": "tutor\|researcher\|summarizer", "question": str }` | Role-based AI chat |
| `POST` | `/flashcards` | `{ "topic": str, "use_context": bool, "count": int }` | Generate flashcards |
| `POST` | `/quiz` | `{ "topic": str, "use_context": bool, "count": int }` | Generate a quiz |
| `POST` | `/mind-map/visual` | `{ "topic": str }` | Generate an SVG mind map |

### Media

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/transcribe-audio` | `file` (audio, ≤ 20 MB) | Transcribe audio via Whisper |
| `POST` | `/image-to-text` | `file` (PNG/JPEG, ≤ 20 MB) | OCR + clean/summarize via GPT-4 Vision |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ "status": "ok" }` |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXUS_API_KEY` | ✅ Yes | API key for Navigate Labs AI (Nexus) |
| `RENDER` | ⚠️ Deploy only | Set to `true` on Render to use `/tmp` ephemeral storage |

---

## 🌐 Deployment

### Backend — Render

The `render.yaml` at the project root configures automatic deployment:

```yaml
services:
  - type: web
    name: nexus-ai-backend
    runtime: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: gunicorn backend.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
    envVars:
      - key: NEXUS_API_KEY
      - key: RENDER
        value: "true"
      - key: PYTHON_VERSION
        value: "3.11.9"
```

When `RENDER=true`, file paths switch from `backend/uploads` and `backend/stores` to `/tmp/nexus_uploads` and `/tmp/nexus_stores` (ephemeral storage).

### Frontend — Vercel

```bash
cd frontend
npm run build    # outputs to frontend/dist/
```

Deploy `frontend/dist` to Vercel. Set the environment variable `VITE_API_URL` to point to your Render backend URL.

---

## 🔒 Rate Limits

| Endpoint Bucket | Limit | Window |
|---|---|---|
| `/upload` | 10 requests | 60 seconds |
| `/ask` | 35 requests | 60 seconds |
| `/summarize` | 20 requests | 60 seconds |
| `/chat/general` | 35 requests | 60 seconds |
| `/chat/role` | 35 requests | 60 seconds |
| `/flashcards` | 20 requests | 60 seconds |
| `/quiz` | 20 requests | 60 seconds |
| `/mind-map/visual` | 20 requests | 60 seconds |
| `/transcribe-audio` | 8 requests | 120 seconds |
| `/image-to-text` | 12 requests | 120 seconds |
| `/documents/{id}/activate` | 40 requests | 60 seconds |

Rate limits are enforced per client IP. Exceeding a limit returns HTTP `429 Too Many Requests`.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               React 18 Frontend (Vite)                   │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │ Sidebar  │  │ ChatWin  │  │Flashcards│  │  Quiz  │  │  │
│  │  │(doc mgmt)│  │  (Q&A)   │  │  Tab     │  │  Tab   │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │  │
│  │  │  MindMap     │  │  StudyInsight│  │   InputBox    │  │  │
│  │  │  Visual      │  │  Tab         │  │ (text/audio/  │  │  │
│  │  └──────────────┘  └──────────────┘  │  image input) │  │  │
│  │                                      └───────────────┘  │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │  Axios HTTP (REST)                │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    FastAPI Backend (Python 3.11)                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    main.py (API Layer)                    │  │
│  │                                                          │  │
│  │  Rate Limiter → Input Validation → Endpoint Routing      │  │
│  │                                                          │  │
│  │  /upload   /ask   /summarize   /flashcards   /quiz       │  │
│  │  /chat/general   /chat/role   /mind-map/visual           │  │
│  │  /transcribe-audio   /image-to-text   /documents/*       │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │                rag_pipeline.py (RAG Layer)                │  │
│  │                                                          │  │
│  │  PyPDFLoader → RecursiveCharacterTextSplitter            │  │
│  │       ↓                                                  │  │
│  │  OpenAIEmbeddings (text-embedding-3-small)               │  │
│  │       ↓                                                  │  │
│  │  FAISS VectorStore ←→ InMemoryVectorStore (fallback)     │  │
│  │       ↓                                                  │  │
│  │  similarity_search (k=3) → Prompt Builder                │  │
│  │       ↓                                                  │  │
│  │  call_nexus() → gpt-4.1-nano (Chat Completions)          │  │
│  │                                                          │  │
│  │  transcribe_audio() → whisper-1                          │  │
│  │  image_to_text()    → gpt-4.1-nano (Vision)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐ │
│  │   Local File Storage        │  │   In-Memory Cache        │ │
│  │                             │  │                          │ │
│  │  backend/uploads/  (PDFs)   │  │  vectorstore_cache{}     │ │
│  │  backend/stores/   (FAISS)  │  │  (fast doc switching)    │ │
│  │  backend/documents.json     │  │                          │ │
│  └─────────────────────────────┘  └──────────────────────────┘ │
└───────────────────────────────────────┬─────────────────────────┘
                                        │  OpenAI-compatible API
┌───────────────────────────────────────▼─────────────────────────┐
│              Navigate Labs AI  (Nexus API)                       │
│                                                                 │
│   https://apidev.navigatelabsai.com                             │
│                                                                 │
│   • gpt-4.1-nano  → text generation, vision OCR                │
│   • text-embedding-3-small → document embeddings               │
│   • whisper-1     → audio transcription                        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — Document Q&A

```
User uploads PDF
      │
      ▼
PyPDFLoader extracts text
      │
      ▼
RecursiveCharacterTextSplitter → chunks (900 chars, 80 overlap)
      │
      ▼
OpenAIEmbeddings (text-embedding-3-small) → vector embeddings
      │
      ▼
FAISS.from_documents() → persisted to backend/stores/{doc_id}/
      │
      ▼
User asks question
      │
      ▼
similarity_search(k=3) → top-3 most relevant chunks
      │
      ▼
Prompt: system instructions + context chunks + question
      │
      ▼
call_nexus(gpt-4.1-nano) → grounded answer + source excerpts
      │
      ▼
Response returned to frontend with page references
```

### Data Flow — Media Intelligence

```
Audio File → /transcribe-audio → whisper-1 → transcript text

Image File → /image-to-text → gpt-4.1-nano (Vision)
                            → extracted text
                            → analyze_text() → cleaned summary
```

---

## 📄 License

This project is private. All rights reserved.

---

> Built with ❤️ using LangChain, FastAPI, React, and the Nexus AI API.
