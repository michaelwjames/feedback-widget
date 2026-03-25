"""CLI tool for running Groq Llama 4 Scout to process feedback.

Features:
- Accepts local image paths or remote image URLs (screenshots).
- Accepts a markdown file containing frontend feedback data.
- Converts model output into JSON with a prompt for Jules.
"""

from __future__ import annotations

import argparse
import time
import base64
import json
import mimetypes
import os
import sys
from pathlib import Path
from typing import Iterable, List, Sequence

from groq import Groq

DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
SYSTEM_PROMPT = (
    "You are an expert web development assistant. You will be provided with a screenshot of a user's web page where they have given feedback, "
    "along with frontend data and context of the feedback in markdown format. "
    "Cross reference the text and the screenshot image to understand the issue. "
    "Create a detailed prompt that will be sent to another AI agent (Jules) to address and fix this feedback. "
    "Respond with a JSON object containing a 'prompt_for_jules' string field."
)

class OCRScriptError(Exception):
    """Custom exception for predictable script failures."""

def load_env_from_file() -> None:
    """Populate environment variables from a nearby .env file if needed."""
    if os.getenv("GROQ_API_KEY"):
        return

    candidate_dirs = [
        Path.cwd(),
        Path(__file__).resolve().parent,
        Path(__file__).resolve().parent.parent,
    ]

    for directory in candidate_dirs:
        if directory is None:
            continue
        env_path = directory / ".env"
        if not env_path.exists():
            continue

        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue

            if stripped.lower().startswith("export "):
                stripped = stripped[7:].lstrip()

            key, sep, value = stripped.partition("=")
            if not sep:
                continue

            key = key.strip()
            value = value.strip()
            if key and not os.getenv(key):
                os.environ[key] = value
        break

def encode_local_image(path: Path) -> str:
    """Return a data URL for a local image file."""
    if not path.is_file():
        raise OCRScriptError(f"Image path does not exist or is not a file: {path}")

    mime_type, _ = mimetypes.guess_type(path.name)
    if mime_type is None:
        raise OCRScriptError(
            f"Could not determine MIME type for {path.name}. "
            "Add an appropriate file extension."
        )

    with path.open("rb") as image_file:
        b64 = base64.b64encode(image_file.read()).decode("utf-8")
    return f"data:{mime_type};base64,{b64}"

def build_image_contents(image_inputs: Sequence[str]) -> List[dict]:
    """Convert image paths/URLs into Groq message content entries."""
    if not image_inputs:
        raise OCRScriptError("At least one image must be supplied.")

    contents: List[dict] = []
    for raw in image_inputs:
        raw = raw.strip()
        if raw.startswith("http://") or raw.startswith("https://"):
            url = raw
        else:
            url = encode_local_image(Path(raw))

        contents.append({"type": "image_url", "image_url": {"url": url}})

    return contents

def call_groq(
    prompt: str,
    image_contents: Sequence[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.1,
) -> str:
    load_env_from_file()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise OCRScriptError("GROQ_API_KEY environment variable is required.")

    client = Groq(api_key=api_key)

    start_time = time.time()

    messages: List[dict] = []
    messages.append({"role": "system", "content": SYSTEM_PROMPT})

    messages.append(
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                *image_contents,
            ],
        }
    )

    kwargs: dict = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_completion_tokens": 2048,
        "response_format": {"type": "json_object"}
    }

    completion = client.chat.completions.create(**kwargs)
    elapsed = time.time() - start_time

    usage_info = getattr(completion, "usage", None)
    if usage_info:
        total_tokens = getattr(usage_info, "total_tokens", "N/A")
        prompt_tokens = getattr(usage_info, "prompt_tokens", "N/A")
        completion_tokens = getattr(usage_info, "completion_tokens", "N/A")
    else:
        total_tokens = prompt_tokens = completion_tokens = "N/A"

    print(
        f"[INFO] Groq API call completed in {elapsed:.2f}s | "
        f"total_tokens={total_tokens} prompt_tokens={prompt_tokens} completion_tokens={completion_tokens}",
        file=sys.stderr,
    )

    choice = completion.choices[0].message
    content = choice.content
    if content is None:
        raise OCRScriptError("Empty response received from the Groq API.")
    return content

def write_json(output_path: Path, payload: str) -> None:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise OCRScriptError(
            "Expected JSON output but failed to parse response."
        ) from exc

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as jsonfile:
        json.dump(data, jsonfile, indent=2)

def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Groq Feedback to Jules Prompt Analyzer")
    parser.add_argument(
        "--images",
        nargs="+",
        required=True,
        help="Image paths or URLs to process (e.g., screenshot of the feedback)."
    )
    parser.add_argument(
        "--md-file",
        required=True,
        help="Path to the markdown file containing frontend feedback context."
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Groq vision model to use (default: {DEFAULT_MODEL})."
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.1,
        help="Sampling temperature for the model (default: 0.1)."
    )
    parser.add_argument(
        "--output",
        help="Optional output file path. Defaults to 'jules_prompt.json'."
    )
    return parser.parse_args(list(argv))

def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    try:
        if not Path(args.md_file).is_file():
             raise OCRScriptError(f"Markdown file does not exist: {args.md_file}")
             
        md_content = Path(args.md_file).read_text(encoding="utf-8")
        prompt = f"Feedback context markdown:\n{md_content}\n"

        contents = build_image_contents(args.images)
        response = call_groq(
            prompt=prompt,
            image_contents=contents,
            model=args.model,
            temperature=args.temperature,
        )

        first_image = Path(args.images[0])
        if first_image.exists():
            output_dir = first_image.parent
        else:
            output_dir = Path.cwd()
        
        default_name = "jules_prompt.json"
        output_file = Path(args.output) if args.output else Path(default_name)
        output_path = output_dir / output_file

        write_json(output_path, response)

    except OCRScriptError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 1

    print(json.dumps({"status": "success", "output_file": str(output_path)}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
