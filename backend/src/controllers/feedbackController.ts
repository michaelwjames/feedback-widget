import { Request, Response } from 'express';
import path from 'path';
import { config } from '../config';
import { FeedbackService } from '../services/feedbackService';

const feedbackService = new FeedbackService();

export class FeedbackController {
    static async saveFeedback(req: Request, res: Response) {
        try {
            const { text, screenshot, metadata } = req.body;

            if (!text && !screenshot) {
                return res.status(400).json({ error: 'Text or screenshot is required.' });
            }

            const result = await feedbackService.saveFeedback(text, screenshot, metadata);

            res.status(200).json({
                message: 'Feedback saved.',
                feedbackDir: result.feedbackDir,
                mdPath: result.mdPath,
                imagePaths: result.imagePaths,
                outputPath: path.join(result.feedbackDir, 'agent_prompt.json')
            });
        } catch (error) {
            console.error('Error during feedback submission:', error);
            res.status(500).json({ error: 'Failed to save feedback.' });
        }
    }

    static async downloadFeedback(req: Request, res: Response) {
        const feedbackPath = req.query.path as string;

        if (!feedbackPath) {
            return res.status(400).json({ error: 'Feedback path is required.' });
        }

        // Security check: ensure path is strictly inside config.feedbackDir
        const absolutePath = path.resolve(feedbackPath);
        const feedbackRoot = path.resolve(config.feedbackDir);
        const relativePath = path.relative(feedbackRoot, absolutePath);

        if (relativePath === '..' || relativePath.startsWith('..' + path.sep) || path.isAbsolute(relativePath)) {
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
