import request from 'supertest';
import app from '../src/server';
import { visionService } from '../src/services/vision';

jest.mock('../src/controllers/authController', () => ({
    AuthController: {
        middleware: jest.fn((req, res, next) => next()),
        login: jest.fn(),
        check: jest.fn()
    }
}));

jest.mock('fs', () => {
    const originalModule = jest.requireActual('fs');
    return {
        ...originalModule,
        existsSync: jest.fn((path: string) => true),
        mkdirSync: jest.fn(),
        writeFileSync: jest.fn(),
        readFileSync: jest.fn((path: string) => {
            if (path.includes('jules_sources.json')) {
                return JSON.stringify({ sources: [{ name: 'test' }] });
            }
            if (path.includes('agent_prompt.json')) {
                return JSON.stringify({ agent_prompt: 'Mocked Jules Prompt' });
            }
            return '{}';
        }),
        copyFileSync: jest.fn()
    };
});

jest.mock('../src/services/feedbackService', () => {
    return {
        FeedbackService: jest.fn().mockImplementation(() => {
            return {
                ensureDefaults: jest.fn(),
                getSources: jest.fn().mockResolvedValue({ sources: [{ name: 'test' }] }),
                saveFeedback: jest.fn().mockResolvedValue({
                    feedbackDir: '/tmp/test',
                    mdPath: '/tmp/test/feedback.md',
                    imagePaths: ['/tmp/test/screenshot.png']
                }),
                triggerProcessor: jest.fn().mockImplementation((provider) => {
                    if (provider === 'linear') {
                        return Promise.resolve({ id: 'linear-123', title: 'Test Linear Issue' });
                    }
                    return Promise.resolve({ message: 'Session creation triggered.' });
                })
            };
        })
    };
});

describe('Feedback Tool API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/:processor/sources should return a list of sources', async () => {
        const response = await request(app).get('/api/jules/sources');
        expect(response.status).toBe(200);
        expect(response.body.sources).toBeDefined();
    });

    it('POST /api/feedback should save feedback', async () => {
        const payload = {
            text: 'Test feedback',
            screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
        };

        const response = await request(app).post('/api/feedback').send(payload);

        expect(response.status).toBe(200);
        expect(response.body.feedbackDir).toBeDefined();
        expect(response.body.mdPath).toBeDefined();
    });

    it('POST /api/vision/analyze should return AI analysis result', async () => {
        const payload = {
            mdFilePath: '/tmp/test/feedback.md',
            imagePaths: [],
            outputPath: '/tmp/test/agent_prompt.json'
        };

        const response = await request(app).post('/api/vision/analyze').send(payload);

        expect(response.status).toBe(200);
        expect(response.body.agent_prompt).toBeDefined();
        expect(response.body.agent_prompt).toContain('### CONTEXT');
    });

    it('POST /api/send-to/jules should return success', async () => {
        const response = await request(app).post('/api/send-to/jules').send({
            feedbackDir: '/tmp/test',
            sourceId: 'test',
            branch: 'dev'
        });
        expect(response.status).toBe(200);
    });

    it('POST /api/send-to/linear should return success', async () => {
        const response = await request(app).post('/api/send-to/linear').send({
            feedbackDir: '/tmp/test',
            title: 'Test Linear Issue'
        });
        expect(response.status).toBe(200);
    });
});
