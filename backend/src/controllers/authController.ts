import { Request, Response } from 'express';
import { config } from '../config';

export class AuthController {
    static async login(req: Request, res: Response) {
        const { password } = req.body;

        if (password === config.widgetPassword) {
            // Set a cookie (SameSite=None and Secure for cross-origin usage)
            res.cookie('feedback_auth', 'session_active', {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                httpOnly: true,
                secure: true,
                sameSite: 'none',
            });
            return res.status(200).json({ status: 'ok' });
        }

        return res.status(401).json({ error: 'Invalid password' });
    }

    static async check(req: Request, res: Response) {
        if (req.cookies?.feedback_auth === 'session_active') {
            return res.status(200).json({ authenticated: true });
        }
        return res.status(401).json({ authenticated: false });
    }

    static middleware(req: Request, res: Response, next: any) {
        if (req.cookies?.feedback_auth === 'session_active') {
            return next();
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
