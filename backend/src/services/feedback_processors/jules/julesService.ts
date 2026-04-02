import fs from 'fs';
import { JulesClient } from './julesClient';
import { FeedbackPayload, FeedbackProcessor } from '../../../types';
import { config } from '../../../config';

export class JulesService implements FeedbackProcessor {
    private client: JulesClient;

    constructor(apiKey: string) {
        this.client = new JulesClient(apiKey);
    }

    async process(feedback: FeedbackPayload, options?: any): Promise<any> {
        let prompt = options?.prompt || feedback.text;
        
        if (typeof prompt === 'object' && prompt !== null) {
            prompt = `### CONTEXT\n${prompt.CONTEXT || ''}\n\n### INSTRUCTIONS\n${prompt.INSTRUCTIONS || ''}`;
        }

        let finalPrompt: string = prompt;

        if (options?.persona) {
            finalPrompt = `You are the ${options.persona}. Read AGENTS.md first. ${prompt}`;
        }

        return this.client.createSession(
            finalPrompt,
            options?.title,
            options?.sourceId,
            options?.branch,
            options?.requirePlanApproval,
            options?.automationMode || "AUTOMATION_MODE_AUTO_CREATE_PR"
        );
    }

    async listSources(pageSize: number = 50, pageToken?: string): Promise<any> {
        return this.client.listSources(pageSize, pageToken);
    }

    async listPersonas(): Promise<any> {
        if (fs.existsSync(config.personasFile)) {
            try {
                return JSON.parse(fs.readFileSync(config.personasFile, 'utf8'));
            } catch (err) {
                console.error("Failed to read personas file:", err);
            }
        }
        return ["orchestrator", "auditor", "director"];
    }

    async getDefaults(): Promise<any> {
        this.ensureDefaults();
        if (fs.existsSync(config.defaultsFile)) {
            try {
                return JSON.parse(fs.readFileSync(config.defaultsFile, 'utf8'));
            } catch (err) {
                console.error("Failed to read defaults file:", err);
            }
        }
        return { repos: [], branches: [], personas: [] };
    }

    private ensureDefaults(): void {
        if (!fs.existsSync(config.defaultsFile) && fs.existsSync(config.defaultsExampleFile)) {
            try {
                fs.copyFileSync(config.defaultsExampleFile, config.defaultsFile);
                console.log(`[JulesService] Initialized defaults from example.`);
            } catch (err) {
                console.error("Failed to initialize defaults:", err);
            }
        }
        if (!fs.existsSync(config.julesCacheFile) && fs.existsSync(config.julesCacheExampleFile)) {
            try {
                fs.copyFileSync(config.julesCacheExampleFile, config.julesCacheFile);
                console.log(`[JulesService] Initialized Jules cache from example.`);
            } catch (err) {
                console.error("Failed to initialize Jules cache:", err);
            }
        }
    }
}
