import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { config } from '../config';
import { FeedbackPayload } from '../types';
import { FeedbackProcessorFactory } from './feedback_processors/processorFactory';

export class FeedbackService {
    constructor() { }

    async getSources(provider: string, forceRefresh: boolean = false): Promise<any> {
        try {
            const processor = FeedbackProcessorFactory.getProcessor(provider);

            if (typeof processor.listSources !== 'function') {
                return { sources: [] };
            }

            const data = await processor.listSources(50);
            return data;
        } catch (error) {
            console.error(`Error fetching ${provider} sources:`, error);
            throw new Error(`Failed to fetch ${provider} sources.`);
        }
    }

    async saveFeedback(text: string, screenshot: string | undefined, metadata: any): Promise<{ feedbackDir: string, mdPath: string, imagePaths: string[] }> {
        const timestamp = Date.now();
        const currentFeedbackDir = path.join(config.feedbackDir, timestamp.toString());

        fs.mkdirSync(currentFeedbackDir, { recursive: true });

        const enrichedMetadata = { ...(metadata || {}), text };
        fs.writeFileSync(path.join(currentFeedbackDir, 'metadata.json'), JSON.stringify(enrichedMetadata, null, 2), 'utf8');

        let markdownContent = `# Feedback ${new Date(timestamp).toLocaleString()}\n\n`;
        markdownContent += `## Message\n\n${text || 'No text provided.'}\n\n`;

        if (metadata) {
            markdownContent += `## Page Metadata\n\n`;
            markdownContent += `- **URL:** ${metadata.url || 'N/A'}\n`;
            markdownContent += `- **Hostname:** ${metadata.hostname || 'N/A'}\n`;
            markdownContent += `- **Pathname:** ${metadata.pathname || 'N/A'}\n`;
            markdownContent += `- **Page Title:** ${metadata.pageTitle || 'N/A'}\n`;
            markdownContent += `- **User Agent:** \`${metadata.userAgent || 'N/A'}\`\n`;
            markdownContent += `- **Resolution:** ${metadata.screenResolution || 'N/A'} (Window: ${metadata.windowSize || 'N/A'})\n`;
            markdownContent += `- **Timestamp:** ${metadata.timestamp || 'N/A'}\n\n`;

            if (metadata.comments && metadata.comments.length > 0) {
                markdownContent += `## Comments\n\n`;
                metadata.comments.forEach((comment: any) => {
                    markdownContent += `${comment.number}. **${comment.text}** (x: ${comment.x}, y: ${comment.y})\n`;
                });
                markdownContent += `\n`;
            }
        }

        let imagePaths: string[] = [];
        let screenshotPath: string = "";

        if (screenshot) {
            const base64Data = screenshot.replace(/^data:image\/png;base64,/, "");
            screenshotPath = path.join(currentFeedbackDir, 'screenshot.png');
            fs.writeFileSync(screenshotPath, base64Data, 'base64');
            imagePaths.push(screenshotPath);
            markdownContent += `## Screenshot\n\n![Screenshot](./screenshot.png)\n`;
        }

        const mdPath = path.join(currentFeedbackDir, 'feedback.md');
        fs.writeFileSync(mdPath, markdownContent, 'utf8');

        console.log(`Saved feedback files to ${currentFeedbackDir}.`);

        return {
            feedbackDir: currentFeedbackDir,
            mdPath,
            imagePaths
        };
    }

    async triggerProcessor(provider: string, feedbackDir: string, options: any): Promise<any> {
        console.log(`[AGENT WORKFLOW] Triggering ${provider} for ${feedbackDir}`);

        const metadataPath = path.join(feedbackDir, 'metadata.json');
        const promptFilePath = path.join(feedbackDir, 'agent_prompt.json');
        const screenshotPath = path.join(feedbackDir, 'screenshot.png');

        let metadata = {};
        let promptFromAnalysis = "";
        let screenshotBase64 = "";

        try {
            const [metadataRaw, promptRaw, screenshotRaw] = await Promise.all([
                fs.promises.readFile(metadataPath, 'utf8').catch(err => err.code === 'ENOENT' ? null : Promise.reject(err)),
                fs.promises.readFile(promptFilePath, 'utf8').catch(err => err.code === 'ENOENT' ? null : Promise.reject(err)),
                fs.promises.readFile(screenshotPath).catch(err => err.code === 'ENOENT' ? null : Promise.reject(err))
            ]);

            if (metadataRaw) {
                metadata = JSON.parse(metadataRaw);
            }
            if (promptRaw) {
                const promptData = JSON.parse(promptRaw);
                promptFromAnalysis = promptData.agent_prompt;
            }
            if (screenshotRaw) {
                screenshotBase64 = `data:image/png;base64,${screenshotRaw.toString('base64')}`;
            }
        } catch (err) {
            console.error("Failed to read feedback files:", err);
            throw new Error(`Cannot trigger ${provider} without valid feedback files.`);
        }

        const feedbackPayload: FeedbackPayload = {
            text: (metadata as any).text || "No text provided",
            screenshot: screenshotBase64,
            metadata: metadata as any
        };

        const processor = FeedbackProcessorFactory.getProcessor(provider);

        const mergedOptions = {
            prompt: options.prompt || promptFromAnalysis,
            ...options
        };

        return processor.process(feedbackPayload, mergedOptions);
    }

    async getFeedbackZipStream(dirPath: string): Promise<any> {
        if (!fs.existsSync(dirPath)) {
            throw new Error('Feedback directory not found.');
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.directory(dirPath, false);
        archive.finalize();

        return archive;
    }
}
