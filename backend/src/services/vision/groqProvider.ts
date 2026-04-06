import fs from 'fs';
import Groq from 'groq-sdk';
import { config } from '../../config';
import { DEFAULT_MODEL, SYSTEM_PROMPT, VisionAnalysisResult, VisionProvider } from './visionProvider';

export class GroqVisionProvider extends VisionProvider {
    async runAnalysis(mdFilePath: string, imagePaths: string[], outputPath: string): Promise<VisionAnalysisResult> {
        try {
            // ⚡ Bolt: Fetch markdown and images concurrently, replacing synchronous I/O
            const [mdContent, contents] = await Promise.all([
                fs.promises.readFile(mdFilePath, 'utf8').catch(() => {
                    throw new Error(`Markdown file does not exist: ${mdFilePath}`);
                }),
                (async () => {
                    if (imagePaths && imagePaths.length > 0 && imagePaths[0]) {
                        return this.buildImageContents(imagePaths);
                    }
                    return [];
                })()
            ]);

            const prompt = `Feedback context markdown:\n${mdContent}\n`;

            const result = await this.callGroq(prompt, contents);
            
            // ⚡ Bolt: Write output asynchronously to avoid blocking main thread
            await this.writeJson(outputPath, result);

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
        if (!apiKey) {
            throw new Error("GROQ_API_KEY environment variable is required.");
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
