import { Router } from 'express';
import express from 'express';
import { config } from './config';
import { FeedbackController } from './controllers/feedbackController';
import { ProcessorController } from './controllers/processorController';
import { VisionController } from './controllers/visionController';
import { AuthController } from './controllers/authController';

const router = Router();

// Open routes
router.post('/api/auth/login', AuthController.login);
router.get('/api/auth/check', AuthController.check);

// Static files (optionally protected, but let's keep them open)
router.use(express.static(config.staticDir));

// Protected API routes
router.use('/api', (req, res, next) => {
    // Skip auth for specified paths
    if (req.path === '/auth/login' || req.path === '/auth/check') {
        return next();
    }
    AuthController.middleware(req, res, next);
});

// Vision Routes
router.post('/api/vision/analyze', VisionController.runAnalysis);

router.get('/api/:processor/defaults', ProcessorController.getDefaults);
router.get('/api/:processor/personas', ProcessorController.getPersonas);
router.get('/api/:processor/sources', ProcessorController.getSources);
router.post('/api/send-to/:processor', ProcessorController.sendToProcessor);


router.post('/api/feedback', FeedbackController.saveFeedback);
router.get('/api/feedback/download', AuthController.middleware, FeedbackController.downloadFeedback);


export default router;
