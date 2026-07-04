# shweta-agent — a portfolio you talk to

Shweta Rani's portfolio website is an AI agent. Visitors chat with it about her
projects, stack and experience; it answers from a markdown knowledge base,
grounded and streaming, powered by a self-hosted LLM (Ollama) on our homelab
Kubernetes cluster.

**Live:** https://shwetarani.com (also https://shweta.codeshare.co.in)

## Architecture

```
visitor ──> FastAPI (this repo, k8s pod)
              ├── /            static chat UI (vanilla JS, SSE streaming)
              ├── /api/chat    SSE relay -> Ollama /api/chat (streaming)
              ├── /api/config  model + warm/idle/offline status
              └── /health      liveness/readiness
                      │
                      └──> OLLAMA_API_BASE (Ollama on the homelab, e.g. llama3.1:8b)
```

The agent is stateless — the browser sends the visible conversation history
with each turn. Knowledge lives in `knowledge_base/*.md` and is baked into the
image; edit those files and push to update what the agent knows.

## Configuration (env)

| Var | Default | Meaning |
|---|---|---|
| `OLLAMA_API_BASE` | `http://192.168.1.8:11434` | Ollama endpoint |
| `MODEL` | `llama3.1:8b` | model tag to chat with |
| `KEEP_ALIVE` | `30m` | how long Ollama keeps the model warm |
| `KNOWLEDGE_DIR` | `knowledge_base` | where the agent's facts live |
| `MAX_HISTORY` | `12` | conversation turns sent to the model |
| `PORT` | `8000` | listen port |

## Run locally

```bash
pip install -r app/requirements.txt
cd /path/to/repo && uvicorn main:app --app-dir app --reload --port 8000
# open http://localhost:8000
```

Deployed via ArgoCD GitOps from `vishal-pandey/argocd-apps` (`components/shweta`).
Image built and published to GHCR by GitHub Actions on every push to `main`.
