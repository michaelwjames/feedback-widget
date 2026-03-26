import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { config } from '../config';

const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const SYSTEM_PROMPT = (
    "You are an expert web development assistant. You will be provided with a screenshot of a user's web page where they have given feedback, " +
    "along with frontend data and context of the feedback in markdown format. " +
    "Cross reference the text and the screenshot image to understand the issue. " +
    "Create a detailed prompt that will be sent to another AI agent (Jules) to address and fix this feedback. " +
    "Respond with a JSON object containing a 'prompt_for_jules' string field."
);

class OCRScriptError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OCRScriptError';
    }
}

function encodeLocalImage(imagePath: string): string {
    if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
        throw new OCRScriptError(`Image path does not exist or is not a file: ${imagePath}`);
    }

    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';

    const b64 = fs.readFileSync(imagePath).toString('base64');
    return `data:${mimeType};base64,${b64}`;
}

function buildImageContents(imageInputs: string[]): any[] {
    if (!imageInputs || imageInputs.length === 0) {
        throw new OCRScriptError("At least one image must be supplied.");
    }

    const contents: any[] = [];
    for (let raw of imageInputs) {
        raw = raw.trim();
        let url = raw;
        if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
            url = encodeLocalImage(raw);
        }
        contents.push({ type: "image_url", image_url: { url: url } });
    }
    return contents;
}

async function callGroq(
    prompt: string,
    imageContents: any[],
    model: string = DEFAULT_MODEL,
    temperature: number = 0.1
): Promise<string> {
    const apiKey = config.groqApiKey;
    if (!apiKey) {
        throw new OCRScriptError("GROQ_API_KEY environment variable is required.");
    }

    const client = new Groq({ apiKey });

    const messages: any[] = [
        { role: "system", content: SYSTEM_PROMPT },
        {
            role: "user",
            content: [
                { type: "text", text: prompt },
                ...imageContents
            ]
        }
    ];

    const startTime = Date.now();

    const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_completion_tokens: 2048,
        response_format: { type: "json_object" }
    });

    const elapsed = (Date.now() - startTime) / 1000;

    // In JS SDK, usage is attached to completion
    const usage = completion.usage;
    const totalTokens = usage?.total_tokens ?? 'N/A';
    const promptTokens = usage?.prompt_tokens ?? 'N/A';
    const completionTokens = usage?.completion_tokens ?? 'N/A';

    console.error(
        `[INFO] Groq API call completed in ${elapsed.toFixed(2)}s | ` +
        `total_tokens=${totalTokens} prompt_tokens=${promptTokens} completion_tokens=${completionTokens}`
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
        throw new OCRScriptError("Empty response received from the Groq API.");
    }

    return content;
}

function writeJson(outputPath: string, payload: string): void {
    try {
        const data = JSON.parse(payload);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (exc) {
        throw new OCRScriptError("Expected JSON output but failed to parse response.");
    }
}

export async function runGroqAnalysis(mdFilePath: string, imagePaths: string[], outputPath: string): Promise<any> {
    try {
        if (!fs.existsSync(mdFilePath)) {
            throw new OCRScriptError(`Markdown file does not exist: ${mdFilePath}`);
        }

        const mdContent = fs.readFileSync(mdFilePath, 'utf8');
        const prompt = `Feedback context markdown:\n${mdContent}\n`;

        let contents: any[] = [];
        if (imagePaths && imagePaths.length > 0 && imagePaths[0]) {
            contents = buildImageContents(imagePaths);
        }

        const response = await callGroq(prompt, contents);

        writeJson(outputPath, response);

        return JSON.parse(response);
    } catch (exc: any) {
        console.error(`Error in runGroqAnalysis: ${exc.message}`);
        throw exc;
    }
}
