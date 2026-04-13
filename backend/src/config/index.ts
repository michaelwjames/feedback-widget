import path from 'path';
import dotenv from 'dotenv';

// Load .env file if it exists
dotenv.config();

const isVercel = process.env.VERCEL === '1';
const baseFeedbackDir = isVercel ? '/tmp' : process.cwd();

export const config = {
    port: process.env.PORT || 12345,
    widgetPassword: process.env.WIDGET_PASSWORD, // this should fail if not set
    visionProvider: process.env.VISION_PROVIDER || 'groq',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    julesApiKey: process.env.JULES_API_KEY || '',
    julesApiUrl: process.env.JULES_API_URL || 'https://jules.googleapis.com/v1alpha',
    linearApiKey: process.env.LINEAR_API_KEY || '',
    linearTeamId: process.env.LINEAR_TEAM_ID || '',
    // Always resolve relative to /tmp on Vercel to allow writing feedback
    feedbackDir: process.env.FEEDBACK_DIR || path.resolve(baseFeedbackDir, 'feedbacks'),
    julesCacheFile: process.env.JULES_CACHE_FILE || path.resolve(baseFeedbackDir, 'jules_sources.json'),
    julesCacheExampleFile: process.env.JULES_CACHE_EXAMPLE_FILE || path.resolve(process.cwd(), 'jules_sources.json.example'),
    defaultsFile: process.env.DEFAULTS_FILE || path.resolve(baseFeedbackDir, 'defaults.json'),
    defaultsExampleFile: process.env.DEFAULTS_EXAMPLE_FILE || path.resolve(process.cwd(), 'defaults.json.example'),
    personasFile: process.env.PERSONAS_FILE || path.resolve(process.cwd(), 'agent_personas.json'),
    staticDir: process.env.STATIC_DIR || (path.basename(process.cwd()) === 'backend' ? path.resolve(process.cwd(), '..') : process.cwd()),
};


