import json
import os
import re
from typing import List, Tuple, Union

import openai
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS

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


def get_embeddings() -> SentenceTransformerEmbeddings:
    global _EMBEDDINGS
    if _EMBEDDINGS is None:
        _EMBEDDINGS = SentenceTransformerEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _EMBEDDINGS


def load_pdf_to_faiss(file_path: str) -> FAISS:
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=80)
    chunks = splitter.split_documents(documents)

    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(chunks, embeddings)
    return vectorstore


def load_faiss_store(store_path: str) -> FAISS:
    embeddings = get_embeddings()
    return FAISS.load_local(store_path, embeddings, allow_dangerous_deserialization=True)


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


def build_slide_explainer_prompt(text: str) -> str:
    return (
        "You are a slide explainer. Given raw OCR text, produce structured study outputs.\n"
        "Return JSON ONLY with shape: {\"notes\": str, \"flashcards\": [{front,back}], \"quiz\": [{question,options,answer,explanation}]}.\n"
        "Notes should be a concise markdown summary (<=8 bullets).\n"
        "Flashcards: 4-6 cards max; Quiz: 3-5 MCQs.\n\n"
        f"OCR Text:\n{text}\n"
    )


def build_bundle_prompt(topic: str, context: str = "") -> str:
    return (
        "You are creating a collaboration bundle for students.\n"
        "Return JSON ONLY with shape: {\"summary\": str, \"flashcards\": [{front,back}], \"quiz\": [{question,options,answer,explanation}], \"mindmap_svg\": str}.\n"
        "Summary: 5-7 tight bullets. Flashcards: 6-8. Quiz: 5 MCQs. mindmap_svg: inline <svg> with width=900 height=600 (no scripts).\n"
        "Use provided context if available; otherwise general knowledge.\n\n"
        f"Topic: {topic}\n"
        f"Context (optional):\n{context}\n"
    )


def call_nexus(prompt: str) -> str:
    client = openai.OpenAI(
        api_key=os.getenv("NEXUS_API_KEY"),
        base_url="https://apidev.navigatelabsai.com",
    )

    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content


def answer_question(question: str, vectorstore: FAISS) -> Tuple[str, List[str]]:
    docs: List[Document] = vectorstore.similarity_search(question, k=3)
    context = "\n\n".join(doc.page_content for doc in docs)

    if context.strip():
        prompt = build_prompt(context, question)
        answer = call_nexus(prompt)
        source_chunks = [doc.page_content for doc in docs]
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


def generate_slide_package(text: str):
    prompt = build_slide_explainer_prompt(text)
    raw = call_nexus(prompt)
    parsed = _extract_json(raw)
    if isinstance(parsed, dict) and all(key in parsed for key in ["notes", "flashcards", "quiz"]):
        return parsed
    return {"notes": raw, "flashcards": [], "quiz": []}


def generate_bundle(topic: str, context: str = ""):
    prompt = build_bundle_prompt(topic, context)
    raw = call_nexus(prompt)
    parsed = _extract_json(raw)
    if isinstance(parsed, dict):
        return {
            "summary": parsed.get("summary", ""),
            "flashcards": parsed.get("flashcards", []),
            "quiz": parsed.get("quiz", []),
            "mindmap_svg": parsed.get("mindmap_svg", ""),
        }
    return {"summary": raw, "flashcards": [], "quiz": [], "mindmap_svg": ""}


def transcribe_audio(file_path: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required for transcription.")

    client = openai.OpenAI(api_key=api_key)
    with open(file_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
        )

    return response.text.strip()


def image_to_text(file_path: str) -> str:
    try:
        import pytesseract
        from PIL import Image
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("Image OCR requires pillow and pytesseract to be installed.") from exc

    with Image.open(file_path) as img:
        text = pytesseract.image_to_string(img)
    return text.strip()


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
