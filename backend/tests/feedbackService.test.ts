import fs from 'fs';
import path from 'path';
import { FeedbackService } from '../src/services/feedbackService';
import { FeedbackProcessorFactory } from '../src/services/feedback_processors/processorFactory';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    promises: {
        readFile: jest.fn()
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

        (fs.promises.readFile as jest.Mock).mockImplementation(async (filepath) => {
            if (filepath.includes('metadata.json')) return JSON.stringify({ text: 'mock text' });
            if (filepath.includes('agent_prompt.json')) return JSON.stringify({ agent_prompt: 'mock prompt' });
            if (filepath.includes('screenshot.png')) return 'mockbase64';
            return '';
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
        (fs.promises.readFile as jest.Mock).mockImplementation(async (filepath) => {
            if (filepath.includes('/tmp/missing')) {
                throw new Error('Some read error');
            }
            return '';
        });

        await expect(feedbackService.triggerProcessor('jules', '/tmp/missing', {}))
            .rejects.toThrow('Cannot trigger jules without valid feedback files.');
    });
});
