import { FeedbackProcessorFactory } from '../src/services/feedback_processors/processorFactory';
import { JulesService } from '../src/services/feedback_processors/jules/julesService';
import { LinearService } from '../src/services/feedback_processors/linear/linearService';
import { config } from '../src/config';

jest.mock('../src/config', () => ({
    config: {
        julesApiKey: 'test-jules-key',
        linearApiKey: 'test-linear-key',
        linearTeamId: 'test-linear-team',
    }
}));

describe('FeedbackProcessorFactory', () => {
    it('should return a JulesService instance when provider is jules', () => {
        const processor = FeedbackProcessorFactory.getProcessor('jules');
        expect(processor).toBeInstanceOf(JulesService);
    });

    it('should return a LinearService instance when provider is linear', () => {
        const processor = FeedbackProcessorFactory.getProcessor('linear');
        expect(processor).toBeInstanceOf(LinearService);
    });

    it('should throw an error for unsupported provider', () => {
        expect(() => FeedbackProcessorFactory.getProcessor('unknown')).toThrow('Unsupported feedback processor: unknown');
    });

    it('should return the same cached instance on subsequent calls', () => {
        const processor1 = FeedbackProcessorFactory.getProcessor('jules');
        const processor2 = FeedbackProcessorFactory.getProcessor('jules');
        expect(processor1).toBe(processor2);
    });
});
