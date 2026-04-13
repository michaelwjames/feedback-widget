import { AiMockServer } from './mock-server/aiMockServer';

let mockServer: AiMockServer;

export default async () => {
    // Start the mock server on port 3001
    mockServer = new AiMockServer(3001);
    await mockServer.start();

    // Store server instance so teardown can access it
    (global as any).__AI_MOCK_SERVER__ = mockServer;

    // Point the AI providers to the local mock server
    process.env.GROQ_BASE_URL = 'http://localhost:3001/openai/v1';
    process.env.JULES_API_URL = 'http://localhost:3001';

    // Provide dummy API keys so SDKs don't complain
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.JULES_API_KEY = 'test-jules-key';
};
