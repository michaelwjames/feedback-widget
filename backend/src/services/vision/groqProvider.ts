import fs from 'fs';
import Groq from 'groq-sdk';
import { config } from '../../config';
import { DEFAULT_MODEL, SYSTEM_PROMPT, VisionAnalysisResult, VisionProvider } from './visionProvider';

export class GroqVisionProvider extends VisionProvider {
    async runAnalysis(mdFilePath: string, imagePaths: string[], outputPath: string): Promise<VisionAnalysisResult> {
        try {
            if (!fs.existsSync(mdFilePath)) {
                throw new Error(`Markdown file does not exist: ${mdFilePath}`);
            }

            const mdContent = fs.readFileSync(mdFilePath, 'utf8');
            const prompt = `Feedback context markdown:\n${mdContent}\n`;

            let contents: any[] = [];
            if (imagePaths && imagePaths.length > 0 && imagePaths[0]) {
                contents = this.buildImageContents(imagePaths);
            }

            const result = await this.callGroq(prompt, contents);
            
            this.writeJson(outputPath, result);

            return result;
        } catch (exc: any) {
            console.error(`Error in GroqVisionProvider: ${exc.message}`);
            throw exc;
        }
    }

    private async callGroq(
        prompt: string,
        imageContents: any[],
        model: string = DEFAULT_MODEL,
        temperature: number = 0.1
    ): Promise<VisionAnalysisResult> {
        const apiKey = config.groqApiKey;
        const baseURL = config.groqBaseUrl;

        if (!apiKey) {
            throw new Error("GROQ_API_KEY environment variable is required.");
        }

        const client = new Groq({
            apiKey,
            baseURL: baseURL === 'https://api.groq.com/openai/v1' ? undefined : baseURL
        });

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

        const usage = completion.usage;
        console.error(
            `[INFO] Groq API call completed in ${elapsed.toFixed(2)}s | ` +
            `total_tokens=${usage?.total_tokens ?? 'N/A'}`
        );

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Empty response received from the Groq API.");
        }

        try {
            return JSON.parse(content);
        } catch (err) {
            throw new Error("Failed to parse Groq response as JSON.");
        }
    }
}
