import fs from 'fs';
import { JulesService } from '../src/services/feedback_processors/jules/julesService';
import { JulesClient } from '../src/services/feedback_processors/jules/julesClient';

jest.mock('fs');
const mockCreateSession = jest.fn().mockResolvedValue({ id: 'session-123' });
const mockListSources = jest.fn().mockResolvedValue({ sources: [] });

jest.mock('../src/services/feedback_processors/jules/julesClient', () => {
    return {
        JulesClient: jest.fn().mockImplementation(() => {
            return {
                createSession: mockCreateSession,
                listSources: mockListSources
            };
        })
    };
});

jest.mock('../src/config', () => ({
    config: {
        personasFile: '/tmp/personas.json',
        defaultsFile: '/tmp/defaults.json',
        defaultsExampleFile: '/tmp/defaults.json.example',
        julesCacheFile: '/tmp/jules_sources.json',
        julesCacheExampleFile: '/tmp/jules_sources.json.example'
    }
}));

describe('JulesService', () => {
    let service: JulesService;

    beforeEach(() => {
        service = new JulesService('test-key');
        jest.clearAllMocks();
        mockCreateSession.mockClear();
        mockListSources.mockClear();
    });

    it('should create session with persona prompt appended', async () => {
        const metadata = { url: '', pathname: '', hostname: '', pageTitle: '', userAgent: '', screenResolution: '', windowSize: '', timestamp: '' };
        const payload = { text: 'test feedback base', screenshot: '', metadata };
        const result = await service.process(payload, { persona: 'auditor' });
        
        expect(result).toEqual({ id: 'session-123' });
        expect(mockCreateSession).toHaveBeenCalledWith(
            'You are the auditor. Read AGENTS.md first. test feedback base',
            undefined, undefined, undefined, undefined, "AUTOMATION_MODE_AUTO_CREATE_PR"
        );
    });

    it('should get defaults and initialize if needed', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ repos: ['test-repo'] }));

        const defaults = await service.getDefaults();
        expect(defaults).toEqual({ repos: ['test-repo'] });
    });
});
