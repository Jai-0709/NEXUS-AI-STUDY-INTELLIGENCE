# NEXUS RAG Assistant — Setup Guide

This guide walks you through setting up and running the project locally. The project consists of a **FastAPI backend** and a **React (Vite) frontend**.

---

## Prerequisites

Make sure the following tools are installed on your system:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/Jai-0709/NEXUS-AI-STUDY-INTELLIGENCE.git
cd NEXUS-AI-STUDY-INTELLIGENCE
```

---

## 2. Backend Setup

### Navigate to the backend directory

```bash
cd backend
```

### Create and activate a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python -m venv .venv
source .venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Configure environment variables

Create a `.env` file inside the `backend/` directory:

```bash
# backend/.env
NEXUS_API_KEY=your_api_key_here
```

> **Note:** Replace `your_api_key_here` with your actual NEXUS API key.

### Run the backend server (development)

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: `http://localhost:8000`

---

## 3. Frontend Setup

Open a **new terminal** and navigate to the frontend directory from the project root:

```bash
cd frontend
```

### Install dependencies

```bash
npm install
```

### Run the frontend dev server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

---

## 4. Running Both Simultaneously

You need **two separate terminal windows** running at the same time:

| Terminal | Command | URL |
|----------|---------|-----|
| Terminal 1 (Backend) | `uvicorn main:app --reload` (inside `backend/`) | `http://localhost:8000` |
| Terminal 2 (Frontend) | `npm run dev` (inside `frontend/`) | `http://localhost:5173` |

---

## 5. Build for Production

### Frontend build

```bash
cd frontend
npm run build
```

The built files will be output to `frontend/dist/`.

### Backend production server (Gunicorn)

```bash
cd backend
gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 6. Run Tests

```bash
cd backend
pytest tests/
```

---

## Project Structure

```
RAG/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── rag_pipeline.py       # RAG logic (LangChain + FAISS)
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables (not committed)
│   ├── uploads/              # Uploaded PDF documents
│   └── stores/               # FAISS vector index storage
├── frontend/
│   ├── src/                  # React source code
│   ├── index.html
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
├── README.md
└── setup.md                  # ← You are here
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `NEXUS_API_KEY` not found | Ensure `.env` is created in `backend/` with the correct key |
| Port 8000 already in use | Change port: `uvicorn main:app --reload --port 8001` |
| Port 5173 already in use | Vite auto-selects the next available port |
| CORS errors in browser | Make sure both backend and frontend are running simultaneously |
| `ModuleNotFoundError` on backend | Ensure your virtual environment is activated before running `uvicorn` |
