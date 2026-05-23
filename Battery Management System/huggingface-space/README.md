# Hugging Face Space → main dashboard

Push these files to [battery-classifier](https://huggingface.co/spaces/abdulmoeez380/battery-classifier).

## Space settings

In **Settings → Repository variables**, add:

| Name | Value |
|------|--------|
| `MAIN_DASHBOARD_URL` | `http://localhost:5174/dashboard` |

When you deploy the site publicly, change this to your real URL (e.g. `https://your-app.vercel.app/dashboard`).

## Files

- `app.py` — Gradio UI with link to full dashboard
- `requirements.txt` — `gradio`

After upload, the Space shows a button that opens your main site.
