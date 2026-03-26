import { LinearClient } from './linearClient';
import { FeedbackPayload, FeedbackProcessor } from '../../../types';

export class LinearService implements FeedbackProcessor {
    private client: LinearClient;
    private apiKey: string;
    private defaultTeamId: string;

    constructor(apiKey: string, teamId: string) {
        this.apiKey = apiKey;
        this.defaultTeamId = teamId;
        this.client = new LinearClient(apiKey, teamId);
    }

    async process(feedback: FeedbackPayload, options?: any): Promise<any> {
        if (!this.apiKey) {
            throw new Error("Linear API Key is missing. Please check your .env file (LINEAR_API_KEY).");
        }

        const teamId = options?.teamId || this.defaultTeamId;
        if (!teamId) {
            throw new Error("Linear Team ID is missing. Please check your .env file (LINEAR_TEAM_ID).");
        }

        console.log(`[LinearService] Processing feedback into Linear issue...`);
        
        let description = `## User Feedback\n\n${feedback.text || 'No text provided.'}\n\n`;
        
        if (options?.prompt) {
            description += `## Agent Prompt\n\n${options.prompt}\n\n`;
        }

        if (feedback.screenshot) {
            try {
                const assetUrl = await this.client.uploadScreenshot(feedback.screenshot);
                description += `## Screenshot\n\n![feedback.png](${assetUrl})\n`;
            } catch (error) {
                console.error("[LinearService] Failed to upload screenshot to Linear:", error);
                description += `\n*Note: Screenshot upload failed.*\n`;
            }
        }

        const title = options?.title || `Feedback: ${feedback.text?.substring(0, 50) || 'New Submission'}`;

        return this.client.createIssue(title, description, teamId);
    }
}
