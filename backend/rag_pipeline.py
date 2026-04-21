import base64
import json
import os
import pickle
import re
from pathlib import Path
from typing import Dict, List, Tuple, Union

import openai
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

_EMBEDDINGS = None


def _extract_json(payload: str) -> Union[dict, list, None]:
    """Best-effort JSON extraction from a model response."""
    try:
        return json.loads(payload)
    except Exception:
        pass

    # Try to grab the first JSON-like block.
    block = re.search(r"\{[\s\S]*\}" , payload)
    if block:
        try:
            return json.loads(block.group(0))
        except Exception:
            pass

    block = re.search(r"\[[\s\S]*\]", payload)
    if block:
        try:
            return json.loads(block.group(0))
        except Exception:
            pass

    return None


def _nexus_base_url() -> str:
    return "https://apidev.navigatelabsai.com"


def _nexus_api_key() -> str:
    return os.getenv("NEXUS_API_KEY", "")


def get_embeddings() -> OpenAIEmbeddings:
    global _EMBEDDINGS
    if _EMBEDDINGS is None:
        _EMBEDDINGS = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=_nexus_api_key(),
            openai_api_base=_nexus_base_url(),
        )
    return _EMBEDDINGS


def load_pdf_to_vectorstore(file_path: str):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    if not documents:
        raise ValueError("The PDF appears to be empty or unreadable.")

    splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=80)
    chunks = splitter.split_documents(documents)
    chunks = [chunk for chunk in chunks if chunk.page_content and chunk.page_content.strip()]
    if not chunks:
        raise ValueError(
            "No extractable text found in the PDF. If this is a scanned document, run OCR first and upload a text-searchable PDF."
        )

    embeddings = get_embeddings()
    try:
        vectorstore = FAISS.from_documents(chunks, embeddings)
    except Exception as exc:  # noqa: BLE001
        if "faiss" not in str(exc).lower():
            raise
        # Fallback for environments where faiss is unavailable (e.g., unsupported Python builds).
        vectorstore = InMemoryVectorStore.from_documents(chunks, embeddings)
    return vectorstore


def save_vectorstore(store, store_path: str) -> None:
    """Persist a vectorstore to disk."""
    path = Path(store_path)
    path.mkdir(parents=True, exist_ok=True)
    if isinstance(store, FAISS):
        store.save_local(str(path))
        return

    if isinstance(store, InMemoryVectorStore):
        store.dump(str(path / "store.json"))
        return

    # Backward fallback for non-FAISS stores.
    with open(path / "store.pkl", "wb") as f:
        pickle.dump(store, f)


def load_vectorstore(store_path: str):
    """Load a previously saved vectorstore from disk."""
    path = Path(store_path)
    faiss_index = path / "index.faiss"
    faiss_store = path / "index.pkl"
    if faiss_index.exists() and faiss_store.exists():
        try:
            return FAISS.load_local(
                str(path),
                get_embeddings(),
                allow_dangerous_deserialization=True,
            )
        except Exception as exc:  # noqa: BLE001
            if "faiss" not in str(exc).lower():
                raise

    inmem = path / "store.json"
    if inmem.exists():
        return InMemoryVectorStore.load(str(inmem), embedding=get_embeddings())

    # Legacy fallback for older in-memory pickled stores.
    pkl = path / "store.pkl"
    if not pkl.exists():
        raise FileNotFoundError(f"No stored vectorstore at {store_path}")
    with open(pkl, "rb") as f:
        return pickle.load(f)


def build_prompt(context: str, question: str) -> str:
    return (
        "You are an intelligent assistant. Answer ONLY using the provided context.\n"
        "Respond concisely; if multiple points are needed, use a short bulleted list.\n"
        "If the answer is not in the context, reply exactly: 'Not mentioned in the document. No external sources used.'\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{question}\n\n"
        "Answer:"
    )


def build_general_prompt(question: str) -> str:
    return (
        "You are an assistant. There is no document context available.\n"
        "Answer the user's question from general knowledge. Be concise and helpful; use a brief bullet list when it improves clarity.\n\n"
        f"Question:\n{question}\n\n"
        "Answer:"
    )


def build_summary_prompt(context: str, mode: str = "summary") -> str:
    if mode == "revision":
        task = "Write concise revision bullets covering key facts, formulas, and definitions. Return a bullet list only (each bullet starts with '- ')."
    else:
        task = "Summarize the content concisely with 4-6 bullet points."
    return (
        "You are a study assistant. Use ONLY the provided context.\n"
        f"Task: {task}\n"
        "If there is insufficient information, say: 'Not mentioned in the document. No external sources used.'\n\n"
        f"Context:\n{context}\n\n"
        "Answer:"
    )


def build_insights_prompt(context: str) -> str:
    return (
        "You are an academic advisor. Analyze the provided study material and generate a structured 'Study Insight' report.\n"
        "Rules:\n"
        "- Include these four exact sections: **Key Concepts**, **Estimated Difficulty Level**, **Recommended Study Strategy**, and **Practice Questions**.\n"
        "- Keep the text concise and use bullet points where appropriate.\n"
        "If the document context is empty, say 'No document provided. Please upload or activate a document for insights.'\n\n"
        f"Context:\n{context}\n\n"
        "Answer:"
    )


def build_role_prompt(role: str, question: str) -> str:
    persona = role.lower()
    if persona == "tutor":
        style = "Explain step-by-step, focus on clarity, include 1-2 examples if useful."
    elif persona == "researcher":
        style = "Be analytical, cite assumptions, propose follow-up questions."
    else:
        style = "Be concise and summarization-focused."
    return (
        f"You are acting as a {role.title()} for a student. {style}\n"
        "Answer directly and keep responses tight.\n\n"
        f"Question:\n{question}\n\n"
        "Answer:"
    )


def build_flashcards_prompt(topic: str, context: str, count: int) -> str:
    return (
        "Create compact study flashcards. Return JSON only with shape: "
        "{\"cards\": [{\"front\": str, \"back\": str}]}.\n"
        f"Make {count} cards. Each front is a question or term; back is the answer.\n"
        f"Topic: {topic}\n"
        f"Context (optional):\n{context}\n"
    )


def build_quiz_prompt(topic: str, context: str, count: int) -> str:
    return (
        "Generate a short quiz in JSON only with shape: "
        "{\"questions\": [{\"question\": str, \"options\": [str,...], \"answer\": str, \"explanation\": str}]}.\n"
        f"Make {count} multiple-choice questions. Keep options concise.\n"
        f"Topic: {topic}\n"
        f"Context (optional):\n{context}\n"
    )


def build_mindmap_svg_prompt(topic: str) -> str:
    return (
        "Design a minimal inline SVG mind map. Respond with ONLY the <svg> element.\n"
        "Use width=900 height=600. Allowed tags: svg, g, line, rect, text. No scripts, no external refs.\n"
        "Layout: central topic node, 3-5 branches, each 2-3 leaves. Keep text readable.\n"
        f"Topic: {topic}\n"
    )


def call_nexus(prompt: str) -> str:
    client = openai.OpenAI(
        api_key=_nexus_api_key(),
        base_url=_nexus_base_url(),
    )

    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content


def answer_question(question: str, vectorstore) -> Tuple[str, List[Dict[str, Union[int, str, None]]]]:
    docs: List[Document] = vectorstore.similarity_search(question, k=3)
    context = "\n\n".join(doc.page_content for doc in docs)

    if context.strip():
        prompt = build_prompt(context, question)
        answer = call_nexus(prompt)
        source_chunks: List[Dict[str, Union[int, str, None]]] = []
        for doc in docs:
            raw_page = doc.metadata.get("page") if isinstance(doc.metadata, dict) else None
            page_num = raw_page + 1 if isinstance(raw_page, int) else None
            snippet = re.sub(r"\s+", " ", (doc.page_content or "").strip())
            source_chunks.append(
                {
                    "page": page_num,
                    "excerpt": snippet[:220],
                }
            )
        return answer, source_chunks

    return "Not mentioned in the document. No external sources used.", []


def summarize_context(context: str, mode: str = "summary") -> str:
    prompt = build_summary_prompt(context, mode=mode)
    return call_nexus(prompt)


def generate_study_insights(context: str) -> str:
    prompt = build_insights_prompt(context)
    return call_nexus(prompt)


def role_chat(role: str, question: str) -> str:
    prompt = build_role_prompt(role, question)
    return call_nexus(prompt)


def generate_flashcards(topic: str, context: str = "", count: int = 8):
    prompt = build_flashcards_prompt(topic, context, count)
    raw = call_nexus(prompt)
    parsed = _extract_json(raw)
    if isinstance(parsed, dict) and "cards" in parsed:
        return parsed["cards"]
    return raw


def generate_quiz(topic: str, context: str = "", count: int = 5):
    prompt = build_quiz_prompt(topic, context, count)
    raw = call_nexus(prompt)
    parsed = _extract_json(raw)
    if isinstance(parsed, dict) and "questions" in parsed:
        return parsed["questions"]
    return raw


def generate_mindmap_svg(topic: str) -> str:
    prompt = build_mindmap_svg_prompt(topic)
    return call_nexus(prompt)


def build_poster_prompt(topic: str, style: str = "modern") -> str:
    style_instructions = {
        "modern": "Use a dark background (#0a0a0f) with white/light text. Add subtle gradient accents. Clean sans-serif typography. Minimalist and premium feel.",
        "academic": "Use a white/cream background with dark text. Classic serif headings (Georgia, serif). Structured with clear hierarchy. Professional academic feel.",
        "creative": "Use a dark gradient background (deep purple to dark blue). Vibrant accent colors (cyan, magenta). Bold display typography. Eye-catching and artistic.",
        "infographic": "Use a dark slate background. Data-driven layout with numbers, percentages, and stats. Use colored boxes/pills for data points. Clean and informative.",
        "neon": "Use a pure black background (#000). Neon glowing text effects using text-shadow with cyan/magenta/lime colors. Futuristic cyberpunk aesthetic.",
    }
    style_desc = style_instructions.get(style, style_instructions["modern"])

    return (
        "You are a professional graphic designer. Create a beautiful, self-contained HTML study poster.\n"
        "Rules:\n"
        "- Return ONLY the HTML code starting with <div> (no <!DOCTYPE>, <html>, <head>, or <body> tags).\n"
        "- Use ONLY inline styles. No <style> blocks, no classes, no external CSS.\n"
        "- The root <div> must have: width:100%; max-width:800px; margin:0 auto; padding, border-radius, and the background.\n"
        "- Include these sections: a bold title, a subtitle/tagline, 4-6 key concepts with short descriptions, and a takeaway/summary box at the bottom.\n"
        "- Use proper heading hierarchy with h2, h3 tags — all styled inline.\n"
        "- Make it visually rich: use gradients, rounded containers, spacing, and visual hierarchy.\n"
        "- Use Google-safe fonts: 'Segoe UI', system-ui, -apple-system, sans-serif for body; inherit for headings.\n"
        "- Keep text concise — this is a poster, not an essay. Short punchy phrases.\n"
        "- Add decorative elements: numbered circles, accent-colored borders, subtle background patterns.\n"
        "- Must be responsive and look great at any width.\n"
        f"- Style direction: {style_desc}\n\n"
        f"Topic: {topic}\n\n"
        "Return the HTML now:"
    )


def generate_poster_html(topic: str, style: str = "modern") -> str:
    prompt = build_poster_prompt(topic, style)
    raw = call_nexus(prompt)

    # Extract HTML from the response (strip markdown fences if present)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Remove opening fence
        first_newline = cleaned.index("\n") if "\n" in cleaned else len(cleaned)
        cleaned = cleaned[first_newline + 1:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    # Ensure it starts with a tag
    if not cleaned.startswith("<"):
        # Try to find the first HTML tag
        tag_start = cleaned.find("<div")
        if tag_start == -1:
            tag_start = cleaned.find("<")
        if tag_start > 0:
            cleaned = cleaned[tag_start:]

    return cleaned

def transcribe_audio(file_path: str) -> str:
    client = openai.OpenAI(
        api_key=_nexus_api_key(),
        base_url=_nexus_base_url(),
    )
    with open(file_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
        )

    return response.text.strip()


def image_to_text(file_path: str) -> str:
    """Use GPT-4o Vision API to extract text from an image (replaces pytesseract)."""
    with open(file_path, "rb") as img_file:
        b64 = base64.b64encode(img_file.read()).decode("utf-8")

    # Detect mime type from extension
    ext = Path(file_path).suffix.lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}.get(ext.lstrip("."), "image/png")

    client = openai.OpenAI(
        api_key=_nexus_api_key(),
        base_url=_nexus_base_url(),
    )

    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract all text from this image. Return only the extracted text, preserving the original structure and formatting as much as possible."},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                ],
            }
        ],
    )

    return response.choices[0].message.content.strip()


def analyze_text(text: str, task: str = "clean") -> str:
    if not text.strip():
        return "No text detected."

    prompt = (
        "Clean and summarize the extracted text.\n"
        f"Task: {task}\n"
        "- Fix obvious OCR artifacts and formatting.\n"
        "- Provide a concise 2-4 bullet summary if content is long; otherwise return the cleaned text.\n\n"
        f"Text:\n{text}\n\n"
        "Answer:"
    )
    return call_nexus(prompt)
