import json
import os
import asyncio
from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel, Field


class ConversationTurn(BaseModel):
    role: Literal["system", "user", "assistant"] = "user"
    content: str = Field(min_length=1, max_length=4000)


class UserContext(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    route: str = "home"
    locale: str = "vi-VN"
    level: Optional[str] = None
    user: Optional[UserContext] = None
    conversation: list[ConversationTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    model: str
    route: str
    suggestions: list[str] = Field(default_factory=list)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def env_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def build_system_prompt() -> str:
    return (
        "You are DinoDeutsch KI Tutor, a compact and friendly German-learning "
        "assistant. Help learners study German with short, accurate, structured "
        "explanations. Default response language is Vietnamese unless the user "
        "clearly asks for German or English. When explaining German, keep "
        "examples simple and level-appropriate. If the request is tied to a "
        "learning area such as grammar, vocab, listening, reading, or tests, "
        "adapt the answer to that area. Prefer practical teaching: explain, "
        "give one or two examples, then suggest a next step. When study context "
        "from the website is provided, prioritize it over generic textbook knowledge "
        "and stay aligned with the level and material already shown in the UI."
    )


@lru_cache(maxsize=1)
def load_learning_data() -> dict:
    def read_json(file_name: str) -> dict:
        with (DATA_DIR / file_name).open("r", encoding="utf-8") as handle:
            return json.load(handle)

    return {
        "grammar": read_json("grammar.json"),
        "vocab": read_json("vocab.json"),
        "listening": read_json("listening.json"),
    }


def normalize_keyword_tokens(text: str) -> list[str]:
    lowered = text.lower()
    cleaned = []
    for char in lowered:
        cleaned.append(char if char.isalnum() or char in {" ", "-", "_"} else " ")
    return [token for token in "".join(cleaned).split() if len(token) >= 2][:10]


def filter_by_level(items: list[dict], level: Optional[str]) -> list[dict]:
    if not level:
        return items
    return [item for item in items if item.get("level") == level]


def build_vocab_context(vocab_data: dict, payload: ChatRequest, tokens: list[str]) -> str:
    matches: list[dict] = []
    for level, topics in vocab_data.items():
        if payload.level and payload.level not in {level, "A1-A2", "B1-B2"} and level != payload.level:
            continue
        for topic, items in topics.items():
            for item in items:
                haystack = " ".join(
                    [
                        level,
                        topic,
                        item.get("word", ""),
                        item.get("vi", ""),
                        item.get("en", ""),
                        item.get("example", ""),
                    ]
                ).lower()
                if not tokens or any(token in haystack for token in tokens):
                    matches.append(
                        {
                            "level": level,
                            "topic": topic,
                            "word": item.get("word", ""),
                            "vi": item.get("vi", ""),
                            "en": item.get("en", ""),
                            "example": item.get("example", ""),
                        }
                    )
                if len(matches) >= 10:
                    break
            if len(matches) >= 10:
                break
        if len(matches) >= 10:
            break

    if not matches:
        return "No matching vocab entries found."

    lines = []
    for item in matches:
        lines.append(
            f"- [{item['level']} | {item['topic']}] {item['word']} = {item['vi']} / {item['en']} | Example: {item['example']}"
        )
    return "\n".join(lines)


def build_grammar_context(grammar_data: dict, payload: ChatRequest, tokens: list[str]) -> str:
    matches: list[dict] = []
    for level in grammar_data.get("levels", []):
        if payload.level and payload.level not in {level.get("level"), "A1-A2", "B1-B2"}:
            continue
        for section in level.get("sections", []):
            for lesson in section.get("lessons", []):
                haystack = " ".join(
                    [
                        level.get("level", ""),
                        section.get("group", ""),
                        lesson.get("title", ""),
                        lesson.get("summary", ""),
                        lesson.get("pattern", ""),
                        *lesson.get("examples", []),
                        *lesson.get("mistakes", []),
                    ]
                ).lower()
                if not tokens or any(token in haystack for token in tokens):
                    matches.append(
                        {
                            "level": level.get("level", ""),
                            "group": section.get("group", ""),
                            "title": lesson.get("title", ""),
                            "summary": lesson.get("summary", ""),
                            "pattern": lesson.get("pattern", ""),
                            "examples": lesson.get("examples", [])[:2],
                        }
                    )
                if len(matches) >= 8:
                    break
            if len(matches) >= 8:
                break
        if len(matches) >= 8:
            break

    if not matches:
        return "No matching grammar lessons found."

    lines = []
    for item in matches:
        example_text = " | ".join(item["examples"])
        lines.append(
            f"- [{item['level']} | {item['group']}] {item['title']}: {item['summary']} | Pattern: {item['pattern']} | Examples: {example_text}"
        )
    return "\n".join(lines)


def build_listening_context(listening_data: dict, payload: ChatRequest, tokens: list[str]) -> str:
    matches: list[dict] = []
    for level in listening_data.get("levels", []):
        if payload.level and payload.level not in {level.get("level"), "A1-A2", "B1-B2"}:
            continue
        for track in level.get("tracks", []):
            for lesson in track.get("lessons", []):
                haystack = " ".join(
                    [
                        level.get("level", ""),
                        track.get("group", ""),
                        lesson.get("title", ""),
                        lesson.get("scenario", ""),
                        lesson.get("goal", ""),
                        *lesson.get("transcript", []),
                        *lesson.get("listenFor", []),
                    ]
                ).lower()
                if not tokens or any(token in haystack for token in tokens):
                    matches.append(
                        {
                            "level": level.get("level", ""),
                            "group": track.get("group", ""),
                            "title": lesson.get("title", ""),
                            "scenario": lesson.get("scenario", ""),
                            "goal": lesson.get("goal", ""),
                            "transcript": lesson.get("transcript", [])[:2],
                            "listen_for": lesson.get("listenFor", [])[:3],
                        }
                    )
                if len(matches) >= 6:
                    break
            if len(matches) >= 6:
                break
        if len(matches) >= 6:
            break

    if not matches:
        return "No matching listening lessons found."

    lines = []
    for item in matches:
        transcript_text = " / ".join(item["transcript"])
        focus_text = ", ".join(item["listen_for"])
        lines.append(
            f"- [{item['level']} | {item['group']}] {item['title']}: {item['scenario']} | Goal: {item['goal']} | Focus: {focus_text} | Transcript sample: {transcript_text}"
        )
    return "\n".join(lines)


def build_study_context(payload: ChatRequest) -> str:
    learning_data = load_learning_data()
    tokens = normalize_keyword_tokens(payload.message)
    route = payload.route

    sections: list[str] = []

    if route in {"grammar", "home", "assistant"}:
        sections.append("Grammar context:\n" + build_grammar_context(learning_data["grammar"], payload, tokens))
    if route in {"vocab", "home", "assistant"}:
        sections.append("Vocab context:\n" + build_vocab_context(learning_data["vocab"], payload, tokens))
    if route in {"listening", "home", "assistant"}:
        sections.append("Listening context:\n" + build_listening_context(learning_data["listening"], payload, tokens))

    if route == "reading":
        sections.append("Reading route is active. Prefer reading-comprehension style explanations and short checks.")
    if route == "test":
        sections.append("Test route is active. Prefer quiz-like, checkpoint-like, or correction-first responses.")

    return "\n\n".join(sections)


@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    return OpenAI(api_key=env_required("OPENAI_API_KEY"))


def build_user_message(payload: ChatRequest) -> str:
    profile_bits = [
        f"Current route: {payload.route}",
        f"Preferred locale: {payload.locale}",
        f"Learner level: {payload.level or 'unknown'}",
    ]

    if payload.user and payload.user.name:
        profile_bits.append(f"Learner name: {payload.user.name}")

    history = []
    for turn in payload.conversation[-8:]:
        history.append(f"{turn.role.upper()}: {turn.content}")

    history_block = "\n".join(history) if history else "No prior conversation."
    study_context = build_study_context(payload)

    return (
        "Website tutor context:\n"
        + "\n".join(profile_bits)
        + "\n\nRecent conversation:\n"
        + history_block
        + "\n\nRelevant study material from the website:\n"
        + study_context
        + "\n\nLatest user message:\n"
        + payload.message
    )


def build_suggestions(route: str) -> list[str]:
    mapping = {
        "grammar": [
            "Giai thich ngan mot quy tac ngu phap kem 2 vi du.",
            "Tao 3 cau luyen tap dien cho trong.",
        ],
        "vocab": [
            "Cho toi 10 tu cung chu de kem vi du ngan.",
            "Kiem tra nhanh tu vung bang 5 cau mini quiz.",
        ],
        "listening": [
            "Goi y cach nghe hieu qua cho bai nay.",
            "Tao checklist nghe lai trong 5 phut.",
        ],
        "reading": [
            "Tom tat bai doc theo tieng Viet de hieu.",
            "Hoi toi 3 cau kiem tra doc hieu.",
        ],
        "test": [
            "Tao mini test theo trinh do hien tai.",
            "Phan tich loi sai thuong gap.",
        ],
    }
    return mapping.get(
        route,
        [
            "Giai thich chu diem nay cho nguoi moi bat dau.",
            "Cho toi mot bai tap ngan de luyen ngay.",
        ],
    )


def use_native_openai() -> bool:
    return True


def build_openai_messages(payload: ChatRequest) -> list[dict]:
    messages = [{"role": "system", "content": build_system_prompt()}]

    for turn in payload.conversation[-8:]:
        messages.append(
            {
                "role": turn.role,
                "content": turn.content,
            },
        )

    messages.append(
        {
            "role": "user",
            "content": build_user_message(payload),
        },
    )
    return messages


def build_openai_chat_response(payload: ChatRequest) -> ChatResponse:
    client = get_openai_client()
    model_name = os.getenv("AGENT_MODEL_NAME", "").strip()
    temperature = float(os.getenv("AGENT_TEMPERATURE", "0.35"))

    completion = client.chat.completions.create(
        model=model_name,
        messages=build_openai_messages(payload),
        temperature=temperature,
        stream=False,
    )

    reply = completion.choices[0].message.content or ""
    return ChatResponse(
        reply=reply.strip(),
        model=model_name,
        route=payload.route,
        suggestions=build_suggestions(payload.route),
    )


def build_chat_response(payload: ChatRequest) -> ChatResponse:
    return build_openai_chat_response(payload)


def ensure_authorized(authorization: Optional[str]) -> None:
    expected_token = os.getenv("AGENT_BACKEND_TOKEN", "").strip()
    if expected_token and authorization != f"Bearer {expected_token}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def iter_reply_chunks(text: str, chunk_size: int = 24) -> list[str]:
    if not text:
        return []
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


def sse_frame(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=True)}\n\n"


app = FastAPI(title="DinoDeutsch Agent Backend")


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "agent-backend"}


@app.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    authorization: Optional[str] = Header(default=None),
) -> ChatResponse:
    ensure_authorized(authorization)

    try:
        return build_chat_response(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    authorization: Optional[str] = Header(default=None),
) -> StreamingResponse:
    ensure_authorized(authorization)

    if use_native_openai():

        async def openai_event_generator():
            try:
                model_name = os.getenv("AGENT_MODEL_NAME", "").strip()
                temperature = float(os.getenv("AGENT_TEMPERATURE", "0.35"))
                suggestions = build_suggestions(payload.route)

                yield sse_frame(
                    "meta",
                    {
                        "model": model_name,
                        "route": payload.route,
                        "suggestions": suggestions,
                    },
                )

                stream = get_openai_client().chat.completions.create(
                    model=model_name,
                    messages=build_openai_messages(payload),
                    temperature=temperature,
                    stream=True,
                )

                full_reply = ""
                for chunk in stream:
                    delta = ""
                    if chunk.choices and chunk.choices[0].delta:
                        delta = chunk.choices[0].delta.content or ""
                    if not delta:
                        continue

                    full_reply += delta
                    yield sse_frame("token", {"delta": delta})

                yield sse_frame(
                    "final",
                    {
                        "reply": full_reply.strip(),
                        "model": model_name,
                        "route": payload.route,
                        "suggestions": suggestions,
                    },
                )
            except Exception as exc:
                yield sse_frame("error", {"error": str(exc)})

        return StreamingResponse(
            openai_event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        result = build_chat_response(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    async def event_generator():
        yield sse_frame(
            "meta",
            {
                "model": result.model,
                "route": result.route,
                "suggestions": result.suggestions,
            },
        )
        for chunk in iter_reply_chunks(result.reply):
            yield sse_frame("token", {"delta": chunk})
            await asyncio.sleep(0.02)

        yield sse_frame(
            "final",
            {
                "reply": result.reply,
                "model": result.model,
                "route": result.route,
                "suggestions": result.suggestions,
            },
        )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
