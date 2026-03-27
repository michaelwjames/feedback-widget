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
        // Mock Groq API endpoint
        this.app.post('/openai/v1/chat/completions', (req: Request, res: Response) => {
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
                            content: JSON.stringify({
                                agent_prompt: "### CONTEXT\nMocked Context.\n\n### INSTRUCTIONS\nMocked instructions from dynamic server."
                            })
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
            res.status(200).json(mockedResponse);
        });

        // Mock Jules API endpoints
        this.app.get('/sources', (req: Request, res: Response) => {
            res.status(200).json({
                sources: [
                    { name: 'mock-source-1', githubRepo: { owner: 'test', repo: 'test' } },
                    { name: 'mock-source-2', githubRepo: { owner: 'test', repo: 'test2' } }
                ]
            });
        });

        this.app.post('/sessions', (req: Request, res: Response) => {
            const { prompt } = req.body;
            res.status(200).json({
                name: 'sessions/mock-session-123',
                state: 'STATE_UNSPECIFIED',
                prompt
            });
        });

        // Add wildcard catch-all for debugging unexpected calls
        this.app.all('*', (req: Request, res: Response) => {
            console.log(`[Mock Server] Unhandled Request: ${req.method} ${req.originalUrl}`);
            // if this is a groq request, just return the chat completion so it doesn't fail tests
            if (req.originalUrl.includes('chat/completions')) {
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
                                content: JSON.stringify({
                                    agent_prompt: "### CONTEXT\nMocked Context.\n\n### INSTRUCTIONS\nMocked instructions from dynamic server."
                                })
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
