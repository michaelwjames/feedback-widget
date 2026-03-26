import { Request, Response } from 'express';
import fs from 'fs';
import { config } from '../config';
import { FeedbackService } from '../services/feedbackService';
import { FeedbackProcessorFactory } from '../services/feedback_processors/processorFactory';

const feedbackService = new FeedbackService();

export class ProcessorController {
    static async getDefaults(req: Request, res: Response) {
        const provider = (req.params.processor as string) || 'jules';
        try {
            const processor = FeedbackProcessorFactory.getProcessor(provider);
            if (typeof processor.getDefaults === 'function') {
                const defaults = await processor.getDefaults();
                return res.json(defaults);
            }
        } catch (err) {
            console.error(`Failed to get ${provider} defaults:`, err);
        }

        // Global fallback
        if (fs.existsSync(config.defaultsFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(config.defaultsFile, 'utf8'));
                return res.json(data);
            } catch (err) {
                console.error("Failed to read defaults file:", err);
            }
        }
        res.json({ repos: [], branches: [], personas: [] }); // Fallback
    }

    static async getPersonas(req: Request, res: Response) {
        const provider = (req.params.processor as string) || 'jules';
        try {
            const processor = FeedbackProcessorFactory.getProcessor(provider);
            if (typeof processor.listPersonas === 'function') {
                const personas = await processor.listPersonas();
                return res.json({ personas });
            }
            res.json({ personas: [] });
        } catch (err) {
            console.error(`Failed to get ${provider} personas:`, err);
            res.status(500).json({ error: 'Failed to fetch personas.' });
        }
    }

    static async getSources(req: Request, res: Response) {
        const provider = (req.params.processor as string) || 'jules';
        const forceRefresh = req.query.refresh === 'true';
        try {
            const data = await feedbackService.getSources(provider, forceRefresh);
            res.json(data);
        } catch (error: any) {
            console.error(`Error fetching ${provider} sources:`, error);
            res.status(500).json({ error: error.message });
        }
    }

    static async sendToProcessor(req: Request, res: Response) {
        const provider = (req.params.processor || 'jules') as string;
        try {
            const { feedbackDir, ...options } = req.body;
            const result = await feedbackService.triggerProcessor(provider, feedbackDir, options);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(`Error triggering ${provider}:`, error);
            res.status(500).json({ error: error.message || `Failed to trigger ${provider}.` });
        }
    }
}
