from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ask_requires_active_document():
    response = client.post("/ask", json={"question": "What is this document about?"})
    assert response.status_code == 400
    assert "No document is active" in response.json()["detail"]


def test_upload_rejects_non_pdf_file():
    files = {"file": ("notes.txt", b"hello", "text/plain")}
    response = client.post("/upload", files=files)
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()["detail"]


def test_general_chat_rejects_overlong_question():
    response = client.post("/chat/general", json={"question": "x" * 2001})
    assert response.status_code == 400
    assert "too long" in response.json()["detail"]
