import { config } from '../../config';
import { VisionProvider } from './interface';
import { GroqVisionProvider } from './groqProvider';

export * from './interface';

export function getVisionProvider(): VisionProvider {
    const provider = process.env.VISION_PROVIDER || 'groq';

    switch (provider.toLowerCase()) {
        case 'groq':
            return new GroqVisionProvider();
        // Future providers can be added here
        // case 'openai':
        //     return new OpenAIVisionProvider();
        default:
            console.warn(`Unknown vision provider: ${provider}. Defaulting to Groq.`);
            return new GroqVisionProvider();
    }
}

export const visionService = getVisionProvider();
