# DinoDeutsch Agent Backend

Nho gon FastAPI service de website goi agent qua `POST /chat`.

## Kien truc

- Website frontend goi `POST /api/assistant`
- Cloudflare Pages Function proxy request sang backend Python
- Backend Python dung AgentScope de tao cau tra loi
- Neu `AGENT_MODEL_TYPE=openai_chat`, endpoint stream se dung OpenAI native streaming

## Cai dat local

```powershell
cd C:\Users\adminn\Desktop\code\website\agent_backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -e C:\Users\adminn\Desktop\code\AI-agent
Copy-Item .env.example .env
```

Sau do dien gia tri trong `.env`:

- `AGENT_MODEL_TYPE`
- `AGENT_MODEL_NAME`
- api key tuong ung, vi du `OPENAI_API_KEY`
- `AGENT_BACKEND_TOKEN`

## Chay service

```powershell
cd C:\Users\adminn\Desktop\code\website\agent_backend
.\.venv\Scripts\Activate.ps1
$env:AGENT_MODEL_TYPE="openai_chat"
$env:AGENT_MODEL_NAME="gpt-4o-mini"
$env:OPENAI_API_KEY="YOUR_KEY"
$env:AGENT_BACKEND_TOKEN="change-me"
uvicorn app:app --host 0.0.0.0 --port 8788
```

Health check:

```powershell
curl http://127.0.0.1:8788/health
```

Chat test:

```powershell
curl -X POST http://127.0.0.1:8788/chat `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer change-me" `
  -d "{\"message\":\"Giai thich cho toi Akkusativ de hieu\",\"route\":\"grammar\",\"locale\":\"vi-VN\",\"conversation\":[]}"
```

Stream test:

```powershell
curl -N -X POST http://127.0.0.1:8788/chat/stream `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer change-me" `
  -d "{\"message\":\"Tao 1 mini quiz A1 ve chao hoi tieng Duc\",\"route\":\"test\",\"locale\":\"vi-VN\",\"conversation\":[]}"
```

## Cloudflare Pages Function can cau hinh

Set 2 environment variables cho project Pages:

- `AGENT_BACKEND_URL`
  vi du `http://127.0.0.1:8788` khi dev local, hoac URL production cua Python service
- `AGENT_BACKEND_TOKEN`
  phai trung voi token trong backend Python

## Contract response

Backend tra ve JSON dang:

```json
{
  "reply": "Noi dung tra loi cua tutor",
  "model": "gpt-4o-mini",
  "route": "grammar",
  "suggestions": [
    "Giai thich ngan mot quy tac ngu phap kem 2 vi du.",
    "Tao 3 cau luyen tap dien cho trong."
  ]
}
```

Streaming endpoint `POST /chat/stream` tra ve SSE voi cac event:

- `meta`
- `token`
- `final`

Ghi chu:

- `POST /chat` se tra JSON thuong
- `POST /chat/stream` se uu tien OpenAI native streaming khi `AGENT_MODEL_TYPE` la OpenAI
