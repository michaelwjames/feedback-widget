import fs from 'fs';
import path from 'path';

export const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * Shared system prompt used by all vision providers.
 *
 * Input format the model will receive:
 *  - A screenshot of a web page, annotated with numbered red pins or rectangular boxes by the user.
 *  - A markdown document (`feedback.md`) that contains:
 *      - `## Message`   — a free-text description of the overall issue.
 *      - `## Comments`  — numbered items that correspond 1-to-1 with the red pins or boxes drawn
 *                         on the screenshot. Each item has pixel coordinates (x, y) that
 *                         indicate exactly which element on the page was annotated.
 *      - `## Page Metadata` — URL, page title, resolution, user-agent, timestamp.
 *
 * The model must cross-reference the numbered comments with what it sees in the
 * screenshot to precisely identify which element each pin or box targets.
 */
export const SYSTEM_PROMPT = [
    "You are an expert front-end developer providing technical prompts for a downstream agent from UI feedback.",
    "CRITICAL REQUIREMENT: The downstream coding agent DOES NOT have access to the screenshot.",
    "Your 'agent_prompt' must NEVER reference 'the screenshot', 'the image', or phrases like 'as seen in the image'.",
    "Instead, describe everything in technical, text-based visual descriptors (e.g. 'the blue button labeled Submit in the top right header').",
    "",
    "INPUTS:",
    "1. Screenshot of a web page with 'Numbered Pins' (small red circles) or 'Rectangles' (red border boxes).",
    "2. Markdown with '## Message' (user's request) and '## Comments' (detailed description of the issue for each pin).",
    "",
    "MAPPING RULES:",
    "- Numbered Pin 'N' correlates 1-to-1 with item 'N.' in '## Comments'.",
    "- 'Rectangles' highlight areas but have no entry in '## Comments'. The '## Message' content will describe what the user wants to change about the highlighted area.",
    "- Be precise: refer to 'Pin N' for circles and 'Rectangle' for boxes.",
    "",
    "OUTPUT RULES — MANDATORY JSON:",
    "- Format: { \"agent_prompt\": { \"CONTEXT\": \"...\", \"INSTRUCTIONS\": \"...\" } }",
    "- No keyless strings or text outside these keys. 'CONTEXT' and 'INSTRUCTIONS' must be plain strings.",
    "",
    "CONTENT TEMPLATE:",
    "### CONTEXT",
    "- Page: <URL> | Title: <page title> | Viewport: <resolution>",
    "- Technical description of highlighted elements. Map Pins to their matching '## Comments' list items.",
    "- If no pins or boxes are present, describe the elements mentioned in the user's message by cross-referencing them with the screenshot.",
    "### INSTRUCTIONS",
    "- Numbered technical steps.",
    "- Be precise enough that the agent can apply the change based purely on your text description.",
].join("\n");

export interface VisionAnalysisResult {
    agent_prompt: string;
    error?: string;
    [key: string]: any;
}

export abstract class VisionProvider {
    abstract runAnalysis(mdFilePath: string, imagePaths: string[], outputPath: string): Promise<VisionAnalysisResult>;

    protected encodeLocalImage(imagePath: string): string {
        if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
            throw new Error(`Image path does not exist or is not a file: ${imagePath}`);
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

    protected buildImageContents(imageInputs: string[]): any[] {
        if (!imageInputs || imageInputs.length === 0) {
            throw new Error("At least one image must be supplied.");
        }

        const contents: any[] = [];
        for (let raw of imageInputs) {
            raw = raw.trim();
            let url = raw;
            if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
                url = this.encodeLocalImage(raw);
            }
            contents.push({ type: "image_url", image_url: { url: url } });
        }
        return contents;
    }

    protected writeJson(outputPath: string, data: any): void {
        try {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (exc) {
            throw new Error(`Failed to write JSON output to ${outputPath}`);
        }
    }
}
