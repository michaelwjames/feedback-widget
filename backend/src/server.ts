import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { config } from './config';
import { FeedbackController } from './controllers/feedbackController';
import { AuthController } from './controllers/authController';

const app = express();

if (!fs.existsSync(config.feedbackDir)) {
    fs.mkdirSync(config.feedbackDir, { recursive: true });
}

// Update CORS to allow credentials for cookie-based auth
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins that have it set (crucial for local dev and arbitrary hostnames)
        callback(null, origin || true);
    },
    credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Open routes
app.post('/api/auth/login', AuthController.login);
app.get('/api/auth/check', AuthController.check);

// Static files (optionally protected, but let's keep them open)
app.use(express.static(config.staticDir));

// Protected API routes
app.use('/api', (req, res, next) => {
    // Skip auth for specified paths
    if (req.path === '/auth/login' || req.path === '/auth/check') {
        return next();
    }
    AuthController.middleware(req, res, next);
});

app.get('/api/jules/defaults', FeedbackController.getDefaults);
app.get('/api/jules/personas', FeedbackController.getPersonas);
app.get('/api/jules/sources', FeedbackController.getSources);
app.post('/api/feedback', FeedbackController.saveFeedback);
app.post('/api/send-to-jules', FeedbackController.sendToJules);

export default app;


if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`Feedback server listening at http://localhost:${config.port}`);
        console.log(`Serving static files from: ${config.staticDir}`);
    });
}
