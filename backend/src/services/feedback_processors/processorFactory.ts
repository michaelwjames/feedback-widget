import { config } from '../../config';
import { JulesService } from './jules/julesService';
import { LinearService } from './linear/linearService';
import { FeedbackProcessor } from '../../types';

export class FeedbackProcessorFactory {
    private static processors: Map<string, FeedbackProcessor> = new Map();

    static getProcessor(provider: string): FeedbackProcessor {
        const key = provider.toLowerCase();

        if (this.processors.has(key)) {
            return this.processors.get(key)!;
        }

        let processor: FeedbackProcessor;

        switch (key) {
            case 'jules':
                processor = new JulesService(config.julesApiKey);
                break;
            case 'linear':
                processor = new LinearService(config.linearApiKey, config.linearTeamId);
                break;
            default:
                throw new Error(`Unsupported feedback processor: ${provider}`);
        }

        this.processors.set(key, processor);
        return processor;
    }
}
