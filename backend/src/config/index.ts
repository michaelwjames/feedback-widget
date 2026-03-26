import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Load .env file if it exists
dotenv.config();

const isVercel = process.env.VERCEL === '1';
const baseFeedbackDir = isVercel ? '/tmp' : process.cwd();

export const config = {
    port: process.env.PORT || 12345,
    groqApiKey: process.env.GROQ_API_KEY || '',
    julesApiKey: process.env.JULES_API_KEY || '',
    widgetPassword: process.env.WIDGET_PASSWORD, // this should fail if not set
    julesDefaultRepo: process.env.JULES_DEFAULT_REPO || '',

    julesDefaultBranch: process.env.JULES_DEFAULT_BRANCH || 'dev',
    // Always resolve relative to /tmp on Vercel to allow writing feedback
    feedbackDir: process.env.FEEDBACK_DIR || path.resolve(baseFeedbackDir, 'feedbacks'),
    julesCacheFile: process.env.JULES_CACHE_FILE || path.resolve(baseFeedbackDir, 'jules_sources.json'),
    defaultsFile: process.env.DEFAULTS_FILE || path.resolve(baseFeedbackDir, 'defaults.json'),
    defaultsExampleFile: process.env.DEFAULTS_EXAMPLE_FILE || path.resolve(process.cwd(), 'defaults.json.example'),
    personasFile: process.env.PERSONAS_FILE || path.resolve(process.cwd(), 'agent_personas.json'),
    staticDir: process.env.STATIC_DIR || (path.basename(process.cwd()) === 'backend' ? path.resolve(process.cwd(), '..') : process.cwd()),
    visionProvider: process.env.VISION_PROVIDER || 'groq',
};


