import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { FeedbackService } from '../services/feedbackService';

const feedbackService = new FeedbackService();

export class FeedbackController {
    static async getDefaults(req: Request, res: Response) {
        feedbackService.ensureDefaults();
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
        if (fs.existsSync(config.personasFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(config.personasFile, 'utf8'));
                return res.json({ personas: data });
            } catch (err) {
                console.error("Failed to read personas file:", err);
                return res.status(500).json({ error: 'Failed to read personas.' });
            }
        }
        res.json({ personas: ["orchestrator", "auditor", "director"] }); // Fallback
    }

    static async getSources(req: Request, res: Response) {
        const forceRefresh = req.query.refresh === 'true';

        try {
            const data = await feedbackService.getJulesSources(forceRefresh);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch Jules sources.' });
        }
    }

    static async saveFeedback(req: Request, res: Response) {
        try {
            const { text, screenshot, metadata } = req.body;

            if (!text && !screenshot) {
                return res.status(400).json({ error: 'Text or screenshot is required.' });
            }

            const result = await feedbackService.saveFeedbackAndRunGroq(text, screenshot, metadata);

            res.status(200).json({
                message: 'Feedback saved and analyzed.',
                prompt: result.prompt,
                feedbackDir: result.feedbackDir
            });
        } catch (error) {
            console.error('Error during feedback analysis:', error);
            res.status(500).json({ error: 'Failed to analyze feedback with vision provider.' });
        }
    }

    static async sendToJules(req: Request, res: Response) {
        const { feedbackDir, sourceId, branch, persona, prompt: customPrompt } = req.body;

        if (!feedbackDir) {
            return res.status(400).json({ error: 'Feedback directory path is required.' });
        }

        try {
            const result = await feedbackService.triggerJules(feedbackDir, sourceId, branch, persona, customPrompt);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error triggering Jules:', error);
            res.status(500).json({ error: 'Failed to trigger Jules.' });
        }
    }

    static async downloadFeedback(req: Request, res: Response) {
        const feedbackPath = req.query.path as string;

        if (!feedbackPath) {
            return res.status(400).json({ error: 'Feedback path is required.' });
        }

        // Security check: ensure path is inside config.feedbackDir
        const absolutePath = path.resolve(feedbackPath);
        const feedbackRoot = path.resolve(config.feedbackDir);

        if (!absolutePath.startsWith(feedbackRoot)) {
            return res.status(403).json({ error: 'Unauthorized path.' });
        }

        try {
            const zipStream = await feedbackService.getFeedbackZipStream(absolutePath);
            const folderName = path.basename(absolutePath);

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=feedback-${folderName}.zip`);

            zipStream.pipe(res);
        } catch (error: any) {
            console.error('Error downloading feedback zip:', error);
            res.status(500).json({ error: error.message || 'Failed to download feedback.' });
        }
    }
}
