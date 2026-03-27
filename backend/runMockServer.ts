import { AiMockServer } from './tests/mock-server/aiMockServer';

async function runMockServer() {
    const mockServer = new AiMockServer(3001);
    await mockServer.start();
    console.log("Mock server running. Press Ctrl+C to exit.");
}

runMockServer().catch(console.error);
