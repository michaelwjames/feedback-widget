import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { config } from './config';
import router from './routes';

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

// Use the main router for all routes
app.use(router);

export default app;

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`Feedback server listening at http://localhost:${config.port}`);
        console.log(`Serving static files from: ${config.staticDir}`);
    });
}
