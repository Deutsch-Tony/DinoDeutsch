import json
import os
import asyncio
from functools import lru_cache
from typing import Literal, Optional

import agentscope
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agentscope.agents import DialogAgent
from agentscope.message import Msg


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


def env_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def build_model_config() -> dict:
    model_type = os.getenv("AGENT_MODEL_TYPE", "openai_chat").strip()
    model_name = os.getenv("AGENT_MODEL_NAME", "").strip()
    config_name = os.getenv("AGENT_CONFIG_NAME", "website_assistant").strip()

    if not model_name:
        raise RuntimeError(
            "Missing required environment variable: AGENT_MODEL_NAME",
        )

    config = {
        "model_type": model_type,
        "config_name": config_name,
        "model_name": model_name,
        "generate_args": {
            "temperature": float(os.getenv("AGENT_TEMPERATURE", "0.35")),
        },
    }

    if model_type.startswith("openai"):
        config["api_key"] = env_required("OPENAI_API_KEY")
    elif model_type.startswith("dashscope"):
        config["api_key"] = env_required("DASHSCOPE_API_KEY")
    elif model_type.startswith("anthropic"):
        config["api_key"] = env_required("ANTHROPIC_API_KEY")

    return config


def build_system_prompt() -> str:
    return (
        "You are DinoDeutsch KI Tutor, a compact and friendly German-learning "
        "assistant. Help learners study German with short, accurate, structured "
        "explanations. Default response language is Vietnamese unless the user "
        "clearly asks for German or English. When explaining German, keep "
        "examples simple and level-appropriate. If the request is tied to a "
        "learning area such as grammar, vocab, listening, reading, or tests, "
        "adapt the answer to that area. Prefer practical teaching: explain, "
        "give one or two examples, then suggest a next step."
    )


@lru_cache(maxsize=1)
def get_agent() -> DialogAgent:
    agentscope.init(
        model_configs=[build_model_config()],
        project="DinoDeutsch Agent Backend",
        save_api_invoke=False,
        save_code=False,
        save_log=False,
        disable_saving=True,
    )

    return DialogAgent(
        name="DinoDeutsch KI Tutor",
        sys_prompt=build_system_prompt(),
        model_config_name=os.getenv(
            "AGENT_CONFIG_NAME",
            "website_assistant",
        ).strip(),
    )


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

    return (
        "Website tutor context:\n"
        + "\n".join(profile_bits)
        + "\n\nRecent conversation:\n"
        + history_block
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


def build_chat_response(payload: ChatRequest) -> ChatResponse:
    agent = get_agent()
    msg = Msg(
        name="user",
        role="user",
        content=build_user_message(payload),
    )
    response = agent(msg)
    if isinstance(response.content, str):
        reply = response.content
    else:
        reply = response.get_text_content() or ""

    return ChatResponse(
        reply=reply.strip(),
        model=os.getenv("AGENT_MODEL_NAME", ""),
        route=payload.route,
        suggestions=build_suggestions(payload.route),
    )


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
