const request = require('supertest');
const fs = require('fs');

// Mock child_process and util.promisify
jest.mock('child_process', () => ({
    exec: jest.fn((cmd, cb) => {
        if (cb) {
            cb(null, 'done', ''); // node-style callback
        }
    }),
    execFile: jest.fn((cmd, args, cb) => {
        if (cb) {
            cb(null, 'done', '');
        }
    })
}));

// We need to mock util.promisify because it's called during server.js initialization
jest.mock('util', () => {
    const actualUtil = jest.requireActual('util');
    return {
        ...actualUtil,
        promisify: (fn) => {
            // If it's internal child_process.exec, return a mock that resolves properly
            // but for simplicity, we'll just mock it to return what server.js expects
            return jest.fn(async () => ({ stdout: 'done', stderr: '' }));
        }
    };
});

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
}));

const app = require('../server');

describe('Feedback Tool API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/jules/sources should return a list of sources from cache', async () => {
        fs.readFileSync.mockImplementation((path) => {
            if (typeof path === 'string' && path.includes('jules_sources.json')) {
                return JSON.stringify({ sources: [{ name: 'test' }] });
            }
            return '{}';
        });

        const response = await request(app).get('/api/jules/sources');
        expect(response.status).toBe(200);
        expect(response.body.sources).toBeDefined();
    });

    it('POST /api/feedback should save feedback and analyze with Groq', async () => {
        fs.readFileSync.mockImplementation((path) => {
            // Return prompt json when requested
            if (typeof path === 'string' && path.includes('jules_prompt.json')) {
                return JSON.stringify({ prompt_for_jules: 'Mocked Jules Prompt' });
            }
            return '{}';
        });
        
        const payload = {
            text: 'Test feedback',
            screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
        };
        
        const response = await request(app).post('/api/feedback').send(payload);
        
        if (response.status !== 200) {
            console.error('Failure Response:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.prompt).toEqual('Mocked Jules Prompt');
    });

    it('POST /api/send-to-jules should return success', async () => {
        const path = require('path');
        const response = await request(app).post('/api/send-to-jules').send({
            feedbackDir: path.join(__dirname, '..', 'feedbacks', 'test'),
            sourceId: 'test',
            branch: 'dev'
        });
        expect(response.status).toBe(200);
    });
});
