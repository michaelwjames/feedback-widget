import request from 'supertest';
import fs from 'fs';
import app from '../src/server';
import { FeedbackService } from '../src/services/feedbackService';

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
            if (path.includes('jules_prompt.json')) {
                return JSON.stringify({ prompt_for_jules: 'Mocked Jules Prompt' });
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
                getJulesSources: jest.fn().mockResolvedValue({ sources: [{ name: 'test' }] }),
                saveFeedbackAndRunGroq: jest.fn().mockResolvedValue({
                    prompt: 'Mocked Jules Prompt',
                    feedbackDir: '/tmp/test'
                }),
                triggerJules: jest.fn().mockResolvedValue({ message: 'Session creation triggered with Jules.' })
            };
        })
    };
});

describe('Feedback Tool API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/jules/sources should return a list of sources from cache or service', async () => {
        const response = await request(app).get('/api/jules/sources');
        expect(response.status).toBe(200);
        expect(response.body.sources).toBeDefined();
    });

    it('POST /api/feedback should save feedback and analyze with Groq', async () => {
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
        const response = await request(app).post('/api/send-to-jules').send({
            feedbackDir: '/tmp/test',
            sourceId: 'test',
            branch: 'dev'
        });
        expect(response.status).toBe(200);
    });
});
