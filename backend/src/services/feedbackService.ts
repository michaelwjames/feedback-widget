import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { config } from '../config';
import { JulesClient } from '../clients/julesClient';
import { visionService } from './vision';

export class FeedbackService {
    private julesClient: JulesClient;

    constructor() {
        this.julesClient = new JulesClient(config.julesApiKey);
    }

    ensureDefaults(): void {
        if (!fs.existsSync(config.defaultsFile) && fs.existsSync(config.defaultsExampleFile)) {
            try {
                fs.copyFileSync(config.defaultsExampleFile, config.defaultsFile);
                console.log(`[AGENT WORKFLOW] Generated defaults.json from example.`);
            } catch (err) {
                console.error("Failed to generate defaults.json:", err);
            }
        }
    }

    async getJulesSources(forceRefresh: boolean = false): Promise<any> {
        if (!forceRefresh && fs.existsSync(config.julesCacheFile)) {
            try {
                const cacheData = JSON.parse(fs.readFileSync(config.julesCacheFile, 'utf8'));
                return cacheData;
            } catch (err) {
                console.error("Cache read failed, re-fetching:", err);
            }
        }

        try {
            console.log(`[AGENT WORKFLOW] Fetching fresh Jules sources...`);
            const data = await this.julesClient.listSources(50);

            fs.writeFileSync(config.julesCacheFile, JSON.stringify(data, null, 2), 'utf8');
            this.ensureDefaults();
            return data;
        } catch (error) {
            console.error('Error fetching Jules sources:', error);
            throw new Error('Failed to fetch Jules sources.');
        }
    }

    async saveFeedbackAndRunGroq(text: string, screenshot: string | undefined, metadata: any): Promise<{ prompt: string, feedbackDir: string }> {
        const timestamp = Date.now();
        const currentFeedbackDir = path.join(config.feedbackDir, timestamp.toString());

        fs.mkdirSync(currentFeedbackDir, { recursive: true });

        if (metadata) {
            fs.writeFileSync(path.join(currentFeedbackDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
        }

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
        let imagePathForGroq: string = "";

        if (screenshot) {
            const base64Data = screenshot.replace(/^data:image\/png;base64,/, "");
            imagePathForGroq = path.join(currentFeedbackDir, 'screenshot.png');
            fs.writeFileSync(imagePathForGroq, base64Data, 'base64');
            imagePaths.push(imagePathForGroq);
            markdownContent += `## Screenshot\n\n![Screenshot](./screenshot.png)\n`;
        }

        const mdPath = path.join(currentFeedbackDir, 'feedback.md');
        fs.writeFileSync(mdPath, markdownContent, 'utf8');

        console.log(`Saved feedback files to ${currentFeedbackDir}. Starting Groq analysis...`);

        const promptFilePath = path.join(currentFeedbackDir, 'jules_prompt.json');
        const promptData = await visionService.runAnalysis(mdPath, imagePaths, promptFilePath);

        return {
            prompt: promptData.prompt_for_jules,
            feedbackDir: currentFeedbackDir
        };
    }

    async triggerJules(feedbackDir: string, sourceId: string | undefined, branch: string | undefined, persona: string | undefined, customPrompt: string | undefined): Promise<any> {
        const promptFilePath = path.join(feedbackDir, 'jules_prompt.json');

        if (customPrompt) {
            try {
                const promptData = { prompt_for_jules: customPrompt };
                fs.writeFileSync(promptFilePath, JSON.stringify(promptData, null, 2), 'utf8');
                console.log(`[AGENT WORKFLOW] Used custom prompt provided by user.`);
            } catch (err) {
                console.error("Failed to save custom prompt:", err);
            }
        } else if (persona) {
            try {
                const promptData = JSON.parse(fs.readFileSync(promptFilePath, 'utf8'));
                if (promptData.prompt_for_jules) {
                    promptData.prompt_for_jules = `You are the ${persona}. Read AGENTS.md first. ${promptData.prompt_for_jules}`;
                    fs.writeFileSync(promptFilePath, JSON.stringify(promptData, null, 2), 'utf8');
                    console.log(`[AGENT WORKFLOW] Prepended persona '${persona}' to Jules prompt.`);
                }
            } catch (err) {
                console.error("Failed to update prompt with persona:", err);
            }
        }

        console.log(`[AGENT WORKFLOW] Triggering Jules for ${feedbackDir} on ${sourceId || 'default repo'} branch ${branch || 'default branch'}`);

        let promptForJules = "";
        try {
            const promptData = JSON.parse(fs.readFileSync(promptFilePath, 'utf8'));
            promptForJules = promptData.prompt_for_jules;
        } catch (err) {
            console.error("Failed to read prompt file:", err);
            throw new Error("Cannot trigger Jules without a valid prompt.");
        }

        const resolvedBranch = branch || config.julesDefaultBranch || "dev";
        let resolvedSourceId = sourceId;

        if (!resolvedSourceId) {
            throw new Error("No target repository selected. Please select a repository before sending to Jules.");
        }

        this.julesClient.createSession(
            promptForJules,
            undefined, // title
            resolvedSourceId,
            resolvedBranch,
            false, // requirePlanApproval
            "AUTO_CREATE_PR" // automationMode
        ).then((session) => {
            console.log(`[AGENT WORKFLOW] Jules Session Created: ${session?.name || 'unknown'}`);
        }).catch((err) => {
            console.error(`[AGENT WORKFLOW] Jules Error: ${err.message}`);
        });

        return { message: 'Session creation triggered with Jules.' };
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
