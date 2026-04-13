import { Request, Response } from 'express';
import path from 'path';
import { config } from '../config';
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

            const feedbackRoot = path.resolve(config.feedbackDir);

            const pathsToValidate = [mdFilePath, outputPath, ...imagePaths.filter((p: string) => !p.startsWith('http://') && !p.startsWith('https://'))];
            for (const p of pathsToValidate) {
                const absolutePath = path.resolve(p);
                const relativePath = path.relative(feedbackRoot, absolutePath);
                if (relativePath === '..' || relativePath.startsWith('..' + path.sep) || path.isAbsolute(relativePath)) {
                    return res.status(403).json({ error: 'Unauthorized path.' });
                }
            }

            const result = await visionService.runAnalysis(mdFilePath, imagePaths, outputPath);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('VisionProvider interaction error:', error);
            res.status(500).json({ error: error.message || 'Failed to interact with vision provider.' });
        }
    }
}
