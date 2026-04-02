import json
import os
import re
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
try:
    from backend.rag_pipeline import (
        analyze_text,
        answer_question,
        build_general_prompt,
        call_nexus,
        generate_flashcards,
        generate_mindmap_svg,
        generate_quiz,
        image_to_text,
        load_vectorstore,
        load_pdf_to_vectorstore,
        role_chat,
        save_vectorstore,
        summarize_context,
        transcribe_audio,
    )
except ModuleNotFoundError:
    # Support runtimes that start from inside `backend` (e.g., `cd backend && gunicorn main:app`).
    from rag_pipeline import (
        analyze_text,
        answer_question,
        build_general_prompt,
        call_nexus,
        generate_flashcards,
        generate_mindmap_svg,
        generate_quiz,
        image_to_text,
        load_vectorstore,
        load_pdf_to_vectorstore,
        role_chat,
        save_vectorstore,
        summarize_context,
        transcribe_audio,
    )

app = FastAPI(title="RAG Assistant")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
# Load .env from backend directory explicitly.
load_dotenv(BASE_DIR / ".env")

# Use /tmp on Render (ephemeral), local paths for development
IS_RENDER = os.getenv("RENDER", "").lower() in ("true", "1", "yes")
if IS_RENDER:
    UPLOAD_DIR = Path("/tmp/nexus_uploads")
    STORE_DIR = Path("/tmp/nexus_stores")
    METADATA_PATH = Path("/tmp/nexus_documents.json")
else:
    UPLOAD_DIR = BASE_DIR / "uploads"
    STORE_DIR = BASE_DIR / "stores"
    METADATA_PATH = BASE_DIR / "documents.json"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
STORE_DIR.mkdir(parents=True, exist_ok=True)

# Simple in-memory store for the current document index and a cache for faster switching
vectorstore = None
vectorstore_cache: Dict[str, object] = {}
current_doc_id: Optional[str] = None
current_filename: Optional[str] = None


def _load_documents_metadata() -> List[Dict]:
    if METADATA_PATH.exists():
        with METADATA_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _save_documents_metadata(data: List[Dict]) -> None:
    with METADATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


documents = _load_documents_metadata()


def _slugify(name: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(name).stem).strip("-").lower()
    return base or "doc"


def _ensure_unique_id(base: str) -> str:
    candidate = base
    suffix = 1
    existing_ids = {doc["id"] for doc in documents}
    while candidate in existing_ids:
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate


class AskRequest(BaseModel):
    question: str


class GeneralRequest(BaseModel):
    question: str


class SummaryRequest(BaseModel):
    mode: str = "summary"  # summary | revision
    k: int = 3


class RoleChatRequest(BaseModel):
    role: str
    question: str


class FlashcardRequest(BaseModel):
    topic: str
    use_context: bool = True
    count: int = 8


class QuizRequest(BaseModel):
    topic: str
    use_context: bool = True
    count: int = 5


class MindMapVisualRequest(BaseModel):
    topic: str



def _persist_vectorstore(doc_id: str, store) -> Path:
    store_path = STORE_DIR / doc_id
    save_vectorstore(store, str(store_path))
    return store_path


def _find_doc(doc_id: str) -> Optional[Dict]:
    return next((doc for doc in documents if doc["id"] == doc_id), None)


def _set_active(doc: Dict, store) -> None:
    global vectorstore, current_doc_id, current_filename
    vectorstore = store
    current_doc_id = doc["id"]
    current_filename = doc["file_name"]
    vectorstore_cache[current_doc_id] = store


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/documents")
async def list_documents():
    return {"documents": documents, "active_id": current_doc_id}


@app.post("/documents/{doc_id}/activate")
async def activate_document(doc_id: str):
    doc = _find_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    store_path = doc.get("store_path")
    if not store_path or not Path(store_path).exists():
        raise HTTPException(status_code=400, detail="Stored index missing; re-upload the PDF.")

    # Use cache if available for faster switching.
    cached = vectorstore_cache.get(doc_id)
    if cached is not None:
        _set_active(doc, cached)
        return {"message": "Document activated.", "file_name": current_filename, "doc_id": current_doc_id, "cached": True}

    try:
        store = load_vectorstore(str(store_path))
        _set_active(doc, store)
    except Exception as exc:  # noqa: BLE001
        # Runtime may not support the original index format (e.g., faiss unavailable).
        pdf_path = doc.get("pdf_path")
        if pdf_path and Path(pdf_path).exists():
            try:
                rebuilt = load_pdf_to_vectorstore(str(pdf_path))
                save_vectorstore(rebuilt, str(store_path))
                _set_active(doc, rebuilt)
                return {
                    "message": "Document activated.",
                    "file_name": current_filename,
                    "doc_id": current_doc_id,
                    "cached": False,
                    "rebuilt": True,
                }
            except Exception as rebuild_exc:  # noqa: BLE001
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to load stored index ({exc}) and failed to rebuild index: {rebuild_exc}",
                ) from rebuild_exc

        raise HTTPException(status_code=500, detail=f"Failed to load stored index: {exc}") from exc

    return {"message": "Document activated.", "file_name": current_filename, "doc_id": current_doc_id, "cached": False}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global vectorstore, current_filename, current_doc_id

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as f:
        contents = await file.read()
        f.write(contents)

    try:
        vectorstore = load_pdf_to_vectorstore(str(file_path))
    except ValueError as exc:
        try:
            file_path.unlink()
        except OSError:
            pass
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        try:
            file_path.unlink()
        except OSError:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {exc}") from exc

    slug = _slugify(file.filename)
    doc_id = _ensure_unique_id(slug)
    store_path = _persist_vectorstore(doc_id, vectorstore)

    current_filename = file.filename
    current_doc_id = doc_id

    doc_record = {
        "id": doc_id,
        "file_name": current_filename,
        "pdf_path": str(file_path),
        "store_path": str(store_path),
    }

    documents.append(doc_record)
    vectorstore_cache[doc_id] = vectorstore
    _save_documents_metadata(documents)

    return {
        "message": "File processed and indexed successfully.",
        "file_name": current_filename,
        "doc_id": current_doc_id,
    }


@app.post("/ask")
async def ask_question(payload: AskRequest):
    if vectorstore is None:
        raise HTTPException(status_code=400, detail="No document is active. Upload or activate a document.")
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer, source_chunks = answer_question(payload.question, vectorstore)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG pipeline failed: {exc}") from exc

    return {
        "answer": answer,
        "file_name": current_filename,
        "doc_id": current_doc_id,
        "source_chunks": source_chunks,
    }


def _top_context(question: str, k: int = 3) -> str:
    docs = vectorstore.similarity_search(question, k=k)
    return "\n\n".join(doc.page_content for doc in docs)


@app.post("/summarize")
async def summarize(payload: SummaryRequest):
    if vectorstore is None:
        raise HTTPException(status_code=400, detail="No document is active. Upload or activate a document.")

    k = max(1, min(payload.k, 8))
    context = _top_context("summary", k=k)
    if not context.strip():
        return {"answer": "Not mentioned in the document. No external sources used."}

    try:
        answer = summarize_context(context, mode=payload.mode)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {exc}") from exc

    return {"answer": answer, "file_name": current_filename, "doc_id": current_doc_id}


@app.post("/transcribe-audio")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Only audio files are supported.")

    temp_path = UPLOAD_DIR / f"audio-{file.filename}"
    with temp_path.open("wb") as f:
        contents = await file.read()
        f.write(contents)

    try:
        transcript = transcribe_audio(str(temp_path))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    finally:
        try:
            temp_path.unlink()
        except OSError:
            pass

    return {"transcript": transcript}


@app.post("/image-to-text")
async def image_to_text_endpoint(file: UploadFile = File(...), analyze: bool = True):
    if file.content_type not in {"image/png", "image/jpeg", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only PNG or JPEG images are supported.")

    temp_path = UPLOAD_DIR / f"image-{file.filename}"
    with temp_path.open("wb") as f:
        contents = await file.read()
        f.write(contents)

    try:
        extracted = image_to_text(str(temp_path))
        analysis = analyze_text(extracted, task="clean and summarize") if analyze else None
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {exc}") from exc
    finally:
        try:
            temp_path.unlink()
        except OSError:
            pass

    return {"text": extracted, "analysis": analysis}


@app.post("/chat/general")
async def general_chat(payload: GeneralRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        prompt = build_general_prompt(payload.question)
        answer = call_nexus(prompt)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"General chat failed: {exc}") from exc

    return {"answer": answer}


@app.post("/chat/role")
async def role_chat_endpoint(payload: RoleChatRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    role = payload.role.lower().strip()
    if role not in {"tutor", "researcher", "summarizer"}:
        raise HTTPException(status_code=400, detail="Role must be one of: tutor, researcher, summarizer.")

    try:
        answer = role_chat(role, payload.question)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Role chat failed: {exc}") from exc

    return {"answer": answer, "role": role}


@app.post("/flashcards")
async def flashcards(payload: FlashcardRequest):
    if not payload.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    count = max(2, min(payload.count, 20))
    context = ""
    if payload.use_context:
        if vectorstore is None:
            raise HTTPException(status_code=400, detail="No document is active. Upload or activate a document.")
        context = _top_context("flashcards key concepts", k=min(8, max(3, count)))

    try:
        cards = generate_flashcards(payload.topic, context=context, count=count)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {exc}") from exc

    if isinstance(cards, list):
        return {"cards": cards, "doc_id": current_doc_id, "file_name": current_filename}

    return {"raw": str(cards), "doc_id": current_doc_id, "file_name": current_filename}


@app.post("/quiz")
async def quiz(payload: QuizRequest):
    if not payload.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    count = max(3, min(payload.count, 15))
    context = ""
    if payload.use_context:
        if vectorstore is None:
            raise HTTPException(status_code=400, detail="No document is active. Upload or activate a document.")
        context = _top_context("quiz questions", k=min(8, max(3, count)))

    try:
        questions = generate_quiz(payload.topic, context=context, count=count)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {exc}") from exc

    if isinstance(questions, list):
        return {"questions": questions, "doc_id": current_doc_id, "file_name": current_filename}
    return {"raw": str(questions), "doc_id": current_doc_id, "file_name": current_filename}



@app.post("/mind-map/visual")
async def mind_map_visual(payload: MindMapVisualRequest):
    if not payload.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    try:
        svg = generate_mindmap_svg(payload.topic)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Mind map generation failed: {exc}") from exc

    return {"svg": svg}

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    global vectorstore, current_doc_id, current_filename

    doc = _find_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove files on disk.
    pdf_path = doc.get("pdf_path")
    store_path = doc.get("store_path")
    if pdf_path and Path(pdf_path).exists():
        try:
            Path(pdf_path).unlink()
        except OSError:
            pass
    if store_path and Path(store_path).exists():
        try:
            shutil.rmtree(store_path)
        except OSError:
            pass

    # Remove metadata and cache.
    documents[:] = [d for d in documents if d["id"] != doc_id]
    vectorstore_cache.pop(doc_id, None)
    _save_documents_metadata(documents)

    # Clear active state if this doc was active.
    if current_doc_id == doc_id:
        vectorstore = None
        current_doc_id = None
        current_filename = None

    return {"message": "Document deleted.", "doc_id": doc_id, "active_cleared": current_doc_id is None}
