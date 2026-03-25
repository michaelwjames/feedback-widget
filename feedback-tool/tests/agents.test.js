const { execSync } = require('child_process');
const path = require('path');

describe('Agents Integration', () => {
    const julesScript = path.join(__dirname, '..', '..', 'agents', 'jules-subagent', 'jules_client.py');
    const groqScript = path.join(__dirname, '..', '..', 'agents', 'groq-vision-ocr', 'groq_vision_ocr.py');

    it('Jules agent should be runnable and show help', () => {
        const stdout = execSync(`python3 "${julesScript}" --help`).toString();
        expect(stdout).toContain('usage:');
        expect(stdout).toContain('jules_client.py');
    });

    it('Groq Vision OCR agent should be runnable and show help', () => {
        const stdout = execSync(`python3 "${groqScript}" --help`).toString();
        expect(stdout).toContain('usage:');
        expect(stdout).toContain('groq_vision_ocr.py');
    });

    // Note: To test the actual functionality, we'd need valid API keys 
    // and dummy images. For this Jest test, confirming they are 
    // correctly installed and callable is a valuable first step.
});
