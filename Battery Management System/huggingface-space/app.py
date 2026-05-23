"""
Upload this folder to your Hugging Face Space (abdulmoeez380/battery-classifier).
Visitors see a button / auto-redirect to your full dashboard.

Set Space secret or variable:
  MAIN_DASHBOARD_URL = http://localhost:5174/dashboard
(for local demo; use your public URL when deployed)
"""
import os

import gradio as gr

MAIN_URL = os.getenv(
    "MAIN_DASHBOARD_URL",
    "http://localhost:5174/dashboard",
)
HF_SPACE = "https://huggingface.co/spaces/abdulmoeez380/battery-classifier"

with gr.Blocks(
    title="Battery Health Classifier",
    theme=gr.themes.Soft(primary_hue="blue"),
) as demo:
    gr.Markdown(
        f"""
# Battery Health Classifier

This Space is the **ML demo**. Your **full dashboard** (map, wallet, live MQTT) runs locally:

**[{MAIN_URL}]({MAIN_URL})**

> For local use: run `npm run dev` in your Battery Management System project, then open the link above.
"""
    )
    gr.Button("Open full dashboard →", link=MAIN_URL, variant="primary")
    gr.Markdown(f"Space: [{HF_SPACE}]({HF_SPACE})")

    gr.HTML(
        f"""
        <script>
          setTimeout(function() {{
            if (confirm("Open the full dashboard at {MAIN_URL}?")) {{
              window.open("{MAIN_URL}", "_blank");
            }}
          }}, 1500);
        </script>
        """
    )

if __name__ == "__main__":
    demo.launch()
