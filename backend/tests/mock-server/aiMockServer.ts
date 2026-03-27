import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

export class AiMockServer {
    private app = express();
    private server: any;
    private port: number;

    constructor(port: number = 3001) {
        this.port = port;
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.setupRoutes();
    }

    private setupRoutes() {
        // Mock Groq API endpoint - Block and wait for Jules (agent) to provide the genuine response
        this.app.post('/openai/v1/chat/completions', async (req: Request, res: Response) => {
            console.log(`[Mock Server] Received Request: ${req.method} ${req.originalUrl} - Blocking for Groq chat completion from Jules...`);

            const fs = require('fs');
            const requestPath = '/tmp/groq_request.json';
            const responsePath = '/tmp/groq_response.json';

            // Delete old response file if it exists to prevent reading a stale one
            if (fs.existsSync(responsePath)) {
                fs.unlinkSync(responsePath);
            }

            // Write the incoming payload (prompt and images) for Jules to read
            fs.writeFileSync(requestPath, JSON.stringify(req.body, null, 2));
            console.log(`[Mock Server] Wrote Groq request to ${requestPath}. Waiting for ${responsePath}...`);

            // Poll for the response file created by Jules
            while (!fs.existsSync(responsePath)) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Read Jules' genuine response
            const julesResponse = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
            console.log(`[Mock Server] Read Groq response from ${responsePath}. Proceeding...`);

            const mockedResponse = {
                id: 'mock-groq-chat-cmpl-123',
                object: 'chat.completion',
                created: Date.now(),
                model: 'mocked-model',
                choices: [
                    {
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: JSON.stringify(julesResponse)
                        },
                        finish_reason: 'stop'
                    }
                ],
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 20,
                    total_tokens: 30
                }
            };

            // Cleanup
            fs.unlinkSync(requestPath);
            fs.unlinkSync(responsePath);

            res.status(200).json(mockedResponse);
        });

        // Mock Jules API endpoints
        this.app.get('/sources', (req: Request, res: Response) => {
            console.log(`[Mock Server] Received Request: ${req.method} ${req.originalUrl} - Serving Jules sources...`);
            res.status(200).json({
                sources: [
                    { name: 'mock-source-1', githubRepo: { owner: 'test', repo: 'test' } },
                    { name: 'mock-source-2', githubRepo: { owner: 'test', repo: 'test2' } }
                ]
            });
        });

        this.app.post('/sessions', async (req: Request, res: Response) => {
            console.log(`[Mock Server] Received Request: ${req.method} ${req.originalUrl} - Blocking for Jules session creation...`);

            const fs = require('fs');
            const requestPath = '/tmp/jules_request.json';
            const responsePath = '/tmp/jules_response.json';

            if (fs.existsSync(responsePath)) {
                fs.unlinkSync(responsePath);
            }

            fs.writeFileSync(requestPath, JSON.stringify(req.body, null, 2));
            console.log(`[Mock Server] Wrote Jules request to ${requestPath}. Waiting for ${responsePath}...`);

            while (!fs.existsSync(responsePath)) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const julesResponse = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
            console.log(`[Mock Server] Read Jules response from ${responsePath}. Proceeding...`);

            const { prompt } = req.body;

            // Clean up
            fs.unlinkSync(requestPath);
            fs.unlinkSync(responsePath);

            res.status(200).json({
                name: 'sessions/mock-session-123',
                state: 'STATE_UNSPECIFIED',
                prompt,
                ...julesResponse
            });
        });

        // Add wildcard catch-all for debugging unexpected calls
        this.app.all('*', async (req: Request, res: Response) => {
            console.log(`[Mock Server] Unhandled Request: ${req.method} ${req.originalUrl}`);

            // if this is a groq request, block and wait for Jules
            if (req.originalUrl.includes('chat/completions')) {
                console.log(`[Mock Server] Received Request via wildcard fallback: ${req.method} ${req.originalUrl} - Blocking for Groq chat completion from Jules...`);

                const fs = require('fs');
                const requestPath = '/tmp/groq_request.json';
                const responsePath = '/tmp/groq_response.json';

                if (fs.existsSync(responsePath)) {
                    fs.unlinkSync(responsePath);
                }

                fs.writeFileSync(requestPath, JSON.stringify(req.body, null, 2));
                console.log(`[Mock Server] Wrote Groq request to ${requestPath}. Waiting for ${responsePath}...`);

                while (!fs.existsSync(responsePath)) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                const julesResponse = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
                console.log(`[Mock Server] Read Groq response from ${responsePath}. Proceeding...`);

                const mockedResponse = {
                    id: 'mock-groq-chat-cmpl-123',
                    object: 'chat.completion',
                    created: Date.now(),
                    model: 'mocked-model',
                    choices: [
                        {
                            index: 0,
                            message: {
                                role: 'assistant',
                                content: JSON.stringify(julesResponse)
                            },
                            finish_reason: 'stop'
                        }
                    ],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 20,
                        total_tokens: 30
                    }
                };

                fs.unlinkSync(requestPath);
                fs.unlinkSync(responsePath);

                res.status(200).json(mockedResponse);
                return;
            }
            res.status(404).json({ error: 'Mock endpoint not found' });
        });
    }

    public start(): Promise<void> {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`[Mock Server] Started on http://localhost:${this.port}`);
                resolve();
            });
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err: any) => {
                    if (err) return reject(err);
                    console.log(`[Mock Server] Stopped.`);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}
