---
name: groq-vision-ocr
description: Analyze user feedback through screenshots and markdown content to generate a prompt for Jules using Groq's Llama 4 Scout vision model.
metadata:
  provider: groq
  model: meta-llama/llama-4-scout-17b-16e-instruct
---

# Overview
Use this skill when you need to process user feedback (an image screenshot + a markdown file containing frontend context). The bundled `groq_vision_ocr.py` script wraps Groq's multimodal `chat.completions` API with the **Llama 4 Scout** vision model to cross-reference the UI screenshot with the data in the markdown file. It generates a detailed prompt specifically tailored for a secondary AI agent (Jules) to address and fix the feedback. Needs a .env with the `GROQ_API_KEY` - assume this is already in place.

# Usage requirements

The AI agent **must** interact with this skill by executing the bundled CLI. Do **not** craft custom HTTP requests or alternate scripts.

1. Prepare one or more image paths (screenshots) and the path to the markdown file containing feedback data.
2. Run the script:

   ```bash
   python groq_vision_ocr.py \
     --images <image_or_url> [additional_images_or_urls] \
     --md-file <path_to_markdown_file> \
     [--output <desired_output_path.json>] \
     [--model <groq_model>] \
     [--temperature <float>]
   ```

   E.g. `python groq_vision_ocr.py --images Screenshot.png --md-file feedback_context.md --output jules_prompt.json`

4. Wait for the script to finish and read the JSON response containing the `"prompt_for_jules"` field from the generated file.

## Argument notes

- `--images` accepts a mix of local filesystem paths and remote `http(s)` URLs. Local files are automatically encoded to base64.
- `--md-file` must be a valid path to a markdown file with frontend feedback text/context.
- `--output` specifies the path where the resulting JSON file should be saved. Defaults to `jules_prompt.json`.
- `--model` defaults to `meta-llama/llama-4-scout-17b-16e-instruct`; supply another Groq vision model if needed.
- `--temperature` defaults to 0.1 for deterministic prompt generation.

## Output handling

- The output will be a JSON file containing a `"prompt_for_jules"` string field.
- The CLI will print a success JSON message with the output file path upon completion.

# Error handling & limits
- The Groq API enforces request and token limits—check the [rate limits dashboard](https://console.groq.com/limits).
- Handle `401` responses by confirming the API key is present and active.
