# RAG Assistant Tech Stack

This document summarizes the technologies used across the RAG Assistant project.

## Core Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, PostCSS, Axios |
| Backend API | Python 3.11, FastAPI, Uvicorn, Gunicorn |
| RAG Pipeline | LangChain, FAISS (with in-memory fallback), OpenAI-compatible embeddings/chat via Nexus base URL |
| Document Processing | PyPDFLoader (pypdf), RecursiveCharacterTextSplitter |
| Media Intelligence | Whisper transcription API, vision-based OCR through chat completions |
| Deployment | Render (Python web service), render.yaml |

## Frontend Technologies

- React 18 for UI rendering and component architecture.
- Vite 5 for fast development server and frontend build output.
- Tailwind CSS 3 for utility-first styling.
- PostCSS + Autoprefixer for CSS processing and browser compatibility.
- Axios for HTTP communication with the FastAPI backend.

## Backend Technologies

- Python 3.11 runtime.
- FastAPI for REST endpoints and request validation.
- Pydantic models for request schemas.
- Uvicorn for ASGI serving in development.
- Gunicorn + Uvicorn worker class for production process management.
- python-dotenv for local environment variable loading.

## RAG and AI Stack

- LangChain ecosystem packages:
  - langchain
  - langchain-community
  - langchain-text-splitters
  - langchain-openai
- Embeddings: text-embedding-3-small through an OpenAI-compatible API endpoint.
- Vector storage: FAISS primary index persistence with InMemoryVectorStore fallback when FAISS is unavailable.
- Retrieval strategy: similarity search over chunked PDF content.
- LLM interactions: chat completions for Q&A, summaries, roles, flashcards, quiz, and mind map SVG generation.

## Data and Storage

- PDF source files stored under backend/uploads (or /tmp paths on Render).
- Document metadata persisted in documents.json.
- Vector indexes stored per document under backend/stores (or /tmp paths on Render).
- In-memory cache used for fast document activation switching.

## Environment and Configuration

- Required secret: NEXUS_API_KEY.
- Optional deployment flag: RENDER=true for Render-specific temp storage paths.
- Declared cloud Python version in deployment config: 3.11.9.

## Build and Runtime Tooling

- Frontend scripts: dev, build, preview (npm).
- Backend dependency management: pip with backend/requirements.txt.
- Render build/start pipeline:
  - Build: pip install -r backend/requirements.txt
  - Start: gunicorn backend.main:app -w 2 -k uvicorn.workers.UvicornWorker
