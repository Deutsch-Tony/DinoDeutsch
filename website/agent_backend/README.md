# DinoDeutsch Agent Backend

FastAPI backend nho gon de website goi agent qua `POST /api/assistant`.

## Kien truc

- Frontend tren Cloudflare Pages goi `POST /api/assistant`
- Pages Function proxy request sang backend Python
- Backend Python doc hoc lieu that trong `../data`
- Backend goi truc tiep OpenAI Chat Completions va stream token ve frontend

## Doc du lieu hoc that

Backend hien doc truc tiep:

- `grammar.json`
- `vocab.json`
- `listening.json`

Muc tieu la de KI Tutor bam sat noi dung dang co tren website, khong tra loi chung chung.

## Cai dat local

```powershell
cd C:\Users\adminn\Desktop\code\website\agent_backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Sau do dien gia tri trong `.env`:

- `AGENT_MODEL_NAME`
- `OPENAI_API_KEY`
- `AGENT_BACKEND_TOKEN`

## Chay service local

```powershell
cd C:\Users\adminn\Desktop\code\website\agent_backend
.\.venv\Scripts\Activate.ps1
$env:AGENT_MODEL_NAME="gpt-4o-mini"
$env:OPENAI_API_KEY="YOUR_KEY"
$env:AGENT_BACKEND_TOKEN="change-me"
uvicorn app:app --host 0.0.0.0 --port 8788
```

Health check:

```powershell
curl http://127.0.0.1:8788/health
```

## Deploy len Render

Repo da co san file:

- [render.yaml](C:\Users\adminn\Desktop\code\render.yaml)

Ban lam nhu sau:

1. Push code moi nhat len GitHub
2. Vao Render
3. Chon `New +` -> `Blueprint`
4. Noi repo GitHub `DinoDeutsch`
5. Render se doc `render.yaml` va tao service `dinodeutsch-agent-backend`

Can dien 2 secret env tren Render:

- `OPENAI_API_KEY`
- `AGENT_BACKEND_TOKEN`

Sau khi deploy xong, ban se co URL dang:

- `https://dinodeutsch-agent-backend.onrender.com`

Test nhanh:

- `https://dinodeutsch-agent-backend.onrender.com/health`

Neu ra JSON `{"ok": true, ...}` la backend song.

## Cloudflare Pages can cau hinh

Sau khi co URL backend production, vao project Pages va set:

- `AGENT_BACKEND_URL`
  - vi du `https://dinodeutsch-agent-backend.onrender.com`
- `AGENT_BACKEND_TOKEN`
  - phai trung voi token da set tren Render

Sau do redeploy Pages.

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
- `POST /chat/stream` stream token truc tiep tu OpenAI ve frontend
