import fs from 'fs';
import path from 'path';
import { FeedbackService } from '../src/services/feedbackService';
import { FeedbackProcessorFactory } from '../src/services/feedback_processors/processorFactory';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
    }
}));
jest.mock('../src/services/feedback_processors/processorFactory', () => ({
    FeedbackProcessorFactory: {
        getProcessor: jest.fn()
    }
}));
jest.mock('../src/services/vision', () => ({
    visionService: {
        runAnalysis: jest.fn().mockResolvedValue({ agent_prompt: 'Analysis complete.' })
    }
}));
jest.mock('../src/config', () => ({
    config: {
        feedbackDir: '/tmp/feedbacks',
    }
}));

describe('FeedbackService', () => {
    let feedbackService: FeedbackService;

    beforeEach(() => {
        feedbackService = new FeedbackService();
        jest.clearAllMocks();
    });

    it('should trigger processor successfully for valid feedback', async () => {
        const mockProcess = jest.fn().mockResolvedValue({ status: 'success' });
        (FeedbackProcessorFactory.getProcessor as jest.Mock).mockReturnValue({
            process: mockProcess
        });

        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockImplementation((filepath) => {
            if (filepath.includes('metadata.json')) return JSON.stringify({ text: 'mock text' });
            if (filepath.includes('agent_prompt.json')) return JSON.stringify({ agent_prompt: 'mock prompt' });
            if (filepath.includes('screenshot.png')) return 'mockbase64';
            return '';
        });
        (fs.promises.readFile as jest.Mock).mockImplementation((filepath) => {
            if (filepath.includes('metadata.json')) return Promise.resolve(JSON.stringify({ text: 'mock text' }));
            if (filepath.includes('agent_prompt.json')) return Promise.resolve(JSON.stringify({ agent_prompt: 'mock prompt' }));
            if (filepath.includes('screenshot.png')) return Promise.resolve('mockbase64');
            return Promise.reject(new Error('ENOENT'));
        });

        const result = await feedbackService.triggerProcessor('jules', '/tmp/mock-dir', { option1: 'test' });
        
        expect(FeedbackProcessorFactory.getProcessor).toHaveBeenCalledWith('jules');
        expect(mockProcess).toHaveBeenCalledWith(
            {
                text: 'mock text',
                screenshot: 'data:image/png;base64,mockbase64',
                metadata: { text: 'mock text' }
            },
            { prompt: 'mock prompt', option1: 'test' }
        );
        expect(result).toEqual({ status: 'success' });
    });

    it('should throw error if attempting to trigger with invalid feedback files', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockImplementation((filepath) => {
            if (filepath.includes('/tmp/missing')) {
                throw new Error('ENOENT');
            }
            return '';
        });
        (fs.promises.readFile as jest.Mock).mockImplementation((filepath) => {
             return Promise.reject(new Error('ENOENT'));
        });

        await expect(feedbackService.triggerProcessor('jules', '/tmp/missing', {}))
            .rejects.toThrow('Cannot trigger jules without valid feedback files.');
    });
});
