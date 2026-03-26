import { Request, Response } from 'express';
import { visionService } from '../services/vision';

/**
 * Controller specifically for raw vision provider interactions.
 * Acting as a request/response interface for the underlying vision services.
 */
export class VisionController {
    static async runAnalysis(req: Request, res: Response) {
        try {
            const { mdFilePath, imagePaths, outputPath } = req.body;

            if (!mdFilePath || !imagePaths || !outputPath) {
                return res.status(400).json({ error: 'mdFilePath, imagePaths, and outputPath are required.' });
            }

            const result = await visionService.runAnalysis(mdFilePath, imagePaths, outputPath);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('VisionProvider interaction error:', error);
            res.status(500).json({ error: error.message || 'Failed to interact with vision provider.' });
        }
    }
}
