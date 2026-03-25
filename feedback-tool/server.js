const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 12345;
const FEEDBACK_DIR = path.join(__dirname, 'feedbacks');
const JULES_CACHE_FILE = path.join(__dirname, 'jules_sources.json');

// Ensure feedback directory exists
if (!fs.existsSync(FEEDBACK_DIR)) {
    fs.mkdirSync(FEEDBACK_DIR);
}

// Middleware
app.use(cors());
// Serve static files (frontend)
app.use(express.static(__dirname));

// Increase limits for base64 image payload
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// GET endpoint to fetch defaults
app.get('/api/jules/defaults', async (req, res) => {
    const DEFAULTS_FILE = path.join(__dirname, 'defaults.json');
    if (fs.existsSync(DEFAULTS_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
            return res.json(data);
        } catch (err) {
            console.error("Failed to read defaults file:", err);
        }
    }
    res.json({ repos: [], branches: [], personas: [] }); // Fallback
});

// GET endpoint to fetch agent personas
app.get('/api/jules/personas', async (req, res) => {
    const PERSONAS_FILE = path.join(__dirname, 'agent_personas.json');
    if (fs.existsSync(PERSONAS_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(PERSONAS_FILE, 'utf8'));
            return res.json({ personas: data });
        } catch (err) {
            console.error("Failed to read personas file:", err);
            return res.status(500).json({ error: 'Failed to read personas.' });
        }
    }
    res.json({ personas: ["orchestrator", "auditor", "director"] }); // Fallback
});

// GET endpoint to fetch jules sources (with caching)
app.get('/api/jules/sources', async (req, res) => {
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && fs.existsSync(JULES_CACHE_FILE)) {
        try {
            const cacheData = JSON.parse(fs.readFileSync(JULES_CACHE_FILE, 'utf8'));
            return res.json(cacheData);
        } catch (err) {
            console.error("Cache read failed, re-fetching:", err);
        }
    }

    try {
        const julesScript = path.join(__dirname, '..', 'agents', 'jules-subagent', 'jules_client.py');
        const julesCmd = `python3 "${julesScript}" list-sources --page-size 50`;

        console.log(`[AGENT WORKFLOW] Fetching fresh Jules sources...`);
        const { stdout } = await execPromise(julesCmd);
        const data = JSON.parse(stdout);

        fs.writeFileSync(JULES_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
        res.json(data);
    } catch (error) {
        console.error('Error fetching Jules sources:', error);
        res.status(500).json({ error: 'Failed to fetch Jules sources.' });
    }
});

// Step 1: POST endpoint to save feedback and RUN GROQ
app.post('/api/feedback', async (req, res) => {
    try {
        const { text, screenshot, metadata } = req.body;

        if (!text && !screenshot) {
            return res.status(400).json({ error: 'Text or screenshot is required.' });
        }

        const timestamp = Date.now();
        const currentFeedbackDir = path.join(FEEDBACK_DIR, timestamp.toString());

        // Create directory for this specific feedback instance
        fs.mkdirSync(currentFeedbackDir);

        // Save metadata to file
        if (metadata) {
            fs.writeFileSync(path.join(currentFeedbackDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
        }

        let markdownContent = `# Feedback ${new Date(timestamp).toLocaleString()}\n\n`;
        markdownContent += `## Message\n\n${text || 'No text provided.'}\n\n`;

        if (metadata) {
            markdownContent += `## Page Metadata\n\n`;
            markdownContent += `- **URL:** ${metadata.url || 'N/A'}\n`;
            markdownContent += `- **Hostname:** ${metadata.hostname || 'N/A'}\n`;
            markdownContent += `- **Pathname:** ${metadata.pathname || 'N/A'}\n`;
            markdownContent += `- **Page Title:** ${metadata.pageTitle || 'N/A'}\n`;
            markdownContent += `- **User Agent:** \`${metadata.userAgent || 'N/A'}\`\n`;
            markdownContent += `- **Resolution:** ${metadata.screenResolution || 'N/A'} (Window: ${metadata.windowSize || 'N/A'})\n`;
            markdownContent += `- **Timestamp:** ${metadata.timestamp || 'N/A'}\n\n`;
        }

        let imagePath = null;
        // Handle screenshot
        if (screenshot) {
            // Remove the data URL prefix to get raw base64 data
            const base64Data = screenshot.replace(/^data:image\/png;base64,/, "");
            imagePath = path.join(currentFeedbackDir, 'screenshot.png');

            fs.writeFileSync(imagePath, base64Data, 'base64');
            markdownContent += `## Screenshot\n\n![Screenshot](./screenshot.png)\n`;
        }

        // Save markdown file
        const mdPath = path.join(currentFeedbackDir, 'feedback.md');
        fs.writeFileSync(mdPath, markdownContent, 'utf8');

        console.log(`Saved feedback files to ${currentFeedbackDir}. Starting Groq analysis...`);

        // Run Groq Analysis and WAIT for it
        const promptData = await runGroqAnalysis(currentFeedbackDir, imagePath, mdPath);

        res.status(200).json({
            message: 'Feedback saved and analyzed.',
            prompt: promptData.prompt_for_jules,
            feedbackDir: currentFeedbackDir
        });
    } catch (error) {
        console.error('Error during feedback analysis:', error);
        res.status(500).json({ error: 'Failed to analyze feedback with Groq.' });
    }
});

// Step 2: POST endpoint to trigger JULES
app.post('/api/send-to-jules', async (req, res) => {
    const { feedbackDir, sourceId, branch, persona, prompt: customPrompt } = req.body;

    if (!feedbackDir) {
        return res.status(400).json({ error: 'Feedback directory path is required.' });
    }

    try {
        const julesScript = path.join(__dirname, '..', 'agents', 'jules-subagent', 'jules_client.py');
        const promptFilePath = path.join(feedbackDir, 'jules_prompt.json');

        // If custom prompt is provided, use it verbatim
        if (customPrompt) {
            try {
                const promptData = { prompt_for_jules: customPrompt };
                fs.writeFileSync(promptFilePath, JSON.stringify(promptData, null, 2), 'utf8');
                console.log(`[AGENT WORKFLOW] Used custom prompt provided by user.`);
            } catch (err) {
                console.error("Failed to save custom prompt:", err);
            }
        }
        // Otherwise use the persona prefixing logic
        else if (persona) {
            try {
                const promptData = JSON.parse(fs.readFileSync(promptFilePath, 'utf8'));
                if (promptData.prompt_for_jules) {
                    promptData.prompt_for_jules = `You are the ${persona}. ${promptData.prompt_for_jules}`;
                    fs.writeFileSync(promptFilePath, JSON.stringify(promptData, null, 2), 'utf8');
                    console.log(`[AGENT WORKFLOW] Prepended persona '${persona}' to Jules prompt.`);
                }
            } catch (err) {
                console.error("Failed to update prompt with persona:", err);
            }
        }

        console.log(`[AGENT WORKFLOW] Triggering Jules for ${feedbackDir} on ${sourceId || 'default repo'} branch ${branch || 'default branch'}`);

        // Build command with custom repo/branch
        let julesCmd = `python3 "${julesScript}" create --prompt-file "${promptFilePath}" --auto-pr --no-poll`;
        if (sourceId) {
            julesCmd += ` --repo "${sourceId}"`;
        }
        if (branch) {
            julesCmd += ` --branch "${branch}"`;
        }

        exec(julesCmd, (jError, jStdout, jStderr) => {
            if (jError) {
                console.error(`[AGENT WORKFLOW] Jules Error: ${jError.message}`);
                return;
            }
            console.log(`[AGENT WORKFLOW] Jules Session Created: ${jStdout.trim()}`);
        });

        res.status(200).json({ message: 'Session creation triggered with Jules.' });
    } catch (error) {
        console.error('Error triggering Jules:', error);
        res.status(500).json({ error: 'Failed to trigger Jules.' });
    }
});

async function runGroqAnalysis(feedbackDir, imagePath, mdPath) {
    const groqScript = path.join(__dirname, '..', 'agents', 'groq-vision-ocr', 'groq_vision_ocr.py');
    const promptFilePath = path.join(feedbackDir, 'jules_prompt.json');

    console.log(`[AGENT WORKFLOW] Running Groq analysis for ${feedbackDir}...`);

    // Step 1: Groq Vision OCR Analysis
    const groqCmd = `python3 "${groqScript}" --images "${imagePath}" --md-file "${mdPath}" --output "${promptFilePath}"`;

    try {
        const { stdout } = await execPromise(groqCmd);
        console.log(`[AGENT WORKFLOW] Groq OCR Completed: ${stdout.trim()}`);

        // Read the resulting JSON file
        const resultJson = JSON.parse(fs.readFileSync(promptFilePath, 'utf8'));
        return resultJson;
    } catch (error) {
        throw new Error(`Groq analysis failed: ${error.message}`);
    }
}

// Export for testing
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Feedback server listening at http://localhost:${PORT}`);
    });
}