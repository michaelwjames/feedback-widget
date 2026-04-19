import { Request, Response } from 'express';
import path from 'path';
import { FeedbackController } from '../src/controllers/feedbackController';
import { config } from '../src/config';

jest.mock('../src/config', () => ({
    config: {
        feedbackDir: '/tmp/feedbacks',
    }
}));

jest.mock('../src/services/feedbackService', () => {
    return {
        FeedbackService: jest.fn().mockImplementation(() => {
            return {
                getFeedbackZipStream: jest.fn().mockResolvedValue({
                    pipe: jest.fn()
                })
            };
        })
    };
});

describe('FeedbackController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockReq = {
            query: {}
        };
        mockRes = {
            status: mockStatus,
            setHeader: jest.fn()
        };
    });

    it('should reject unauthorized paths', async () => {
        mockReq.query = { path: '/etc/passwd' };
        await FeedbackController.downloadFeedback(mockReq as Request, mockRes as Response);
        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized path.' });
    });

    it('should reject directory traversal paths', async () => {
        mockReq.query = { path: path.join(config.feedbackDir, '../other_dir') };
        await FeedbackController.downloadFeedback(mockReq as Request, mockRes as Response);
        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized path.' });
    });

    it('should accept authorized paths inside feedbackDir', async () => {
        mockReq.query = { path: path.join(config.feedbackDir, 'valid_feedback') };
        await FeedbackController.downloadFeedback(mockReq as Request, mockRes as Response);
        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
    });
});
