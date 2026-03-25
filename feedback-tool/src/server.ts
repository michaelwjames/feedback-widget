import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import { config } from './config';
import { FeedbackController } from './controllers/feedbackController';

const app = express();

if (!fs.existsSync(config.feedbackDir)) {
    fs.mkdirSync(config.feedbackDir, { recursive: true });
}

app.use(cors());
app.use(express.static(config.staticDir));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/jules/defaults', FeedbackController.getDefaults);
app.get('/api/jules/personas', FeedbackController.getPersonas);
app.get('/api/jules/sources', FeedbackController.getSources);
app.post('/api/feedback', FeedbackController.saveFeedback);
app.post('/api/send-to-jules', FeedbackController.sendToJules);

export default app;

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`Feedback server listening at http://localhost:${config.port}`);
    });
}
