import { AiMockServer } from './mock-server/aiMockServer';

export default async () => {
    const mockServer: AiMockServer = (global as any).__AI_MOCK_SERVER__;
    if (mockServer) {
        await mockServer.stop();
    }
};
