import path from 'path';
import dotenv from 'dotenv';

// Load .env file if it exists
dotenv.config();

export const config = {
    port: process.env.PORT || 12345,
    groqApiKey: process.env.GROQ_API_KEY || '',
    julesApiKey: process.env.JULES_API_KEY || '',
    julesDefaultRepo: process.env.JULES_DEFAULT_REPO || '',
    julesDefaultBranch: process.env.JULES_DEFAULT_BRANCH || 'dev',
    feedbackDir: process.env.FEEDBACK_DIR || path.join(__dirname, '..', '..', 'feedbacks'),
    julesCacheFile: process.env.JULES_CACHE_FILE || path.join(__dirname, '..', '..', 'jules_sources.json'),
    defaultsFile: process.env.DEFAULTS_FILE || path.join(__dirname, '..', '..', 'defaults.json'),
    defaultsExampleFile: process.env.DEFAULTS_EXAMPLE_FILE || path.join(__dirname, '..', '..', 'defaults.json.example'),
    personasFile: process.env.PERSONAS_FILE || path.join(__dirname, '..', '..', 'agent_personas.json'),
    staticDir: path.join(__dirname, '..', '..'), // Serve static files from feedback-tool root
};
