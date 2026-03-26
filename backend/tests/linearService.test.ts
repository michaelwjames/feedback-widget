import { LinearService } from '../src/services/feedback_processors/linear/linearService';
import { LinearClient } from '../src/services/feedback_processors/linear/linearClient';

const mockUploadScreenshot = jest.fn().mockResolvedValue('https://asset.url');
const mockCreateIssue = jest.fn().mockResolvedValue({ id: 'LIN-123', title: 'Test Issue' });

jest.mock('../src/services/feedback_processors/linear/linearClient', () => {
    return {
        LinearClient: jest.fn().mockImplementation(() => {
            return {
                uploadScreenshot: mockUploadScreenshot,
                createIssue: mockCreateIssue
            };
        })
    };
});

describe('LinearService', () => {
    let service: LinearService;

    beforeEach(() => {
        service = new LinearService('test-key', 'test-team');
        jest.clearAllMocks();
        mockUploadScreenshot.mockClear();
        mockCreateIssue.mockClear();
    });

    it('should create issue and format description without screenshot', async () => {
    const metadata = { url: '', pathname: '', hostname: '', pageTitle: '', userAgent: '', screenResolution: '', windowSize: '', timestamp: '' };
        const payload = { text: 'basic feedback', screenshot: '', metadata };
        const result = await service.process(payload);

        expect(result).toEqual({ id: 'LIN-123', title: 'Test Issue' });
        expect(mockCreateIssue).toHaveBeenCalledWith(
            'Feedback: basic feedback',
            '## User Feedback\n\nbasic feedback\n\n',
            undefined
        );
    });

    it('should create issue, upload screenshot, and include in description if provided', async () => {
        const metadata = { url: '', pathname: '', hostname: '', pageTitle: '', userAgent: '', screenResolution: '', windowSize: '', timestamp: '' };
        const payload = { text: 'basic feedback', screenshot: 'data:image/png;base64,mock', metadata };
        const result = await service.process(payload, { prompt: 'my prompt text', title: 'Custom Title', teamId: 'custom-team' });

        expect(mockUploadScreenshot).toHaveBeenCalledWith('data:image/png;base64,mock');
        expect(mockCreateIssue).toHaveBeenCalledWith(
            'Custom Title',
            '## User Feedback\n\nbasic feedback\n\n## Agent Prompt\n\nmy prompt text\n\n## Screenshot\n\n![feedback.png](https://asset.url)\n',
            'custom-team'
        );
    });
});
