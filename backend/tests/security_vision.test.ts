import request from 'supertest';
import app from '../src/server';

// Mocking visionService to avoid actual execution
jest.mock('../src/services/vision', () => ({
    visionService: {
        runAnalysis: jest.fn().mockResolvedValue({ agent_prompt: 'Mocked Analysis' })
    }
}));

describe('Security: Vision Analysis Endpoint', () => {
    it('POST /api/vision/analyze should NOT be accessible without authentication', async () => {
        const payload = {
            mdFilePath: '/tmp/test.md',
            imagePaths: ['/tmp/img.png'],
            outputPath: '/tmp/out.json'
        };

        // Note: No authentication cookie is provided
        const response = await request(app)
            .post('/api/vision/analyze')
            .send(payload);

        // It is now expected to return 401 Unauthorized
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized');
    });
});
