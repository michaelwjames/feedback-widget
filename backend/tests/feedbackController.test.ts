import request from 'supertest';
import app from '../src/server';
import path from 'path';
import { config } from '../src/config';

jest.mock('../src/controllers/authController', () => ({
    AuthController: {
        middleware: jest.fn((req, res, next) => next()),
        login: jest.fn(),
        check: jest.fn()
    }
}));

describe('FeedbackController path traversal tests', () => {
    it('should prevent path traversal when feedback path is outside root', async () => {
        const feedbackPath = path.join(config.feedbackDir, '..', 'hacked_folder');
        const response = await request(app).get(`/api/feedback/download?path=${encodeURIComponent(feedbackPath)}`);
        expect(response.status).toBe(403);
    });

    it('should prevent path traversal with relative absolute paths', async () => {
        const feedbackPath = '/etc/passwd';
        const response = await request(app).get(`/api/feedback/download?path=${encodeURIComponent(feedbackPath)}`);
        expect(response.status).toBe(403);
    });

    it('should reject paths that share the same prefix but are not inside the directory', async () => {
        const hackPath = config.feedbackDir + '_hacked';
        const response = await request(app).get(`/api/feedback/download?path=${encodeURIComponent(hackPath)}`);
        expect(response.status).toBe(403);
    });
});
