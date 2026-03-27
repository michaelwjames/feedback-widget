import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import router from '../src/routes';

const app = express();
app.use(bodyParser.json());
app.use(router);

describe('VisionController Security', () => {
    it('should block unauthenticated requests to /api/vision/analyze', async () => {
        const response = await request(app)
            .post('/api/vision/analyze')
            .send({ mdFilePath: 'test', imagePaths: ['test'], outputPath: 'test' });

        expect(response.status).toBe(401);
    });
});
