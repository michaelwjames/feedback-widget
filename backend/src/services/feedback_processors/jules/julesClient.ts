import axios, { AxiosInstance } from 'axios';

export class JulesClient {
    private apiKey: string;
    private baseUrl: string = "https://jules.googleapis.com/v1alpha";
    private client: AxiosInstance;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error("Jules API Key is required.");
        }
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                "x-goog-api-key": this.apiKey,
                "Content-Type": "application/json"
            }
        });
    }

    private buildPath(collection: string, nameOrId: string, action?: string): string {
        const prefix = `${collection}/`;
        const cleanId = nameOrId.replace(/^\/+/, '');
        let path = cleanId.startsWith(prefix) ? `/${cleanId}` : `/${prefix}${cleanId}`;
        if (action) {
            path += `:${action}`;
        }
        return path;
    }

    async listSources(pageSize: number = 30, pageToken?: string, filterExpr?: string): Promise<any> {
        const params: any = { pageSize };
        if (pageToken) params.pageToken = pageToken;
        if (filterExpr) params.filter = filterExpr;

        try {
            const response = await this.client.get('/sources', { params });
            return response.data;
        } catch (error: any) {
            this.handleError("Error listing sources", error);
        }
    }

    async getSource(sourceId: string): Promise<any> {
        try {
            const path = this.buildPath('sources', sourceId);
            const response = await this.client.get(path);
            return response.data;
        } catch (error: any) {
            this.handleError("Error getting source", error);
        }
    }

    async getSourceId(repoName: string): Promise<string> {
        try {
            const sourcesData = await this.listSources(100);
            const sources = sourcesData.sources || [];

            for (const source of sources) {
                const githubRepo = source.githubRepo || {};
                const owner = githubRepo.owner || "";
                const repo = githubRepo.repo || "";
                const fullName = `${owner}/${repo}`;

                if (fullName === repoName || source.name?.includes(repoName)) {
                    return source.name;
                }
            }
            throw new Error(`Repository '${repoName}' not found in connected sources.`);
        } catch (error: any) {
            this.handleError("Error fetching sources", error);
        }
        return "";
    }

    async createSession(
        prompt: string,
        title?: string,
        sourceId?: string,
        startingBranch: string = "main",
        requirePlanApproval: boolean = false,
        automationMode: string = "AUTOMATION_MODE_UNSPECIFIED"
    ): Promise<any> {
        const payload: any = {
            prompt,
            automationMode
        };

        if (title) payload.title = title;

        if (sourceId) {
            // FIX: Ensure sourceId has 'sources/' prefix as required by the API
            const cleanSourceId = sourceId.replace(/^\/+/, '');
            const fullSourceId = cleanSourceId.startsWith('sources/') ? cleanSourceId : `sources/${cleanSourceId}`;
            
            payload.sourceContext = {
                source: fullSourceId,
                githubRepoContext: {
                    startingBranch: startingBranch || "main"
                }
            };
            if (!title) {
                payload.title = `Task: ${prompt.substring(0, 30)}...`;
            }
        } else {
            if (!title) {
                payload.title = "Repoless Session";
            }
        }

        if (requirePlanApproval) {
            payload.requirePlanApproval = true;
        }

        try {
            const response = await this.client.post('/sessions', payload);
            return response.data;
        } catch (error: any) {
            this.handleError("Error creating session", error);
        }
    }

    async listSessions(pageSize: number = 30, pageToken?: string): Promise<any> {
        const params: any = { pageSize };
        if (pageToken) params.pageToken = pageToken;

        try {
            const response = await this.client.get('/sessions', { params });
            return response.data;
        } catch (error: any) {
            this.handleError("Error listing sessions", error);
        }
    }

    async getSession(sessionId: string): Promise<any> {
        try {
            const path = this.buildPath('sessions', sessionId);
            const response = await this.client.get(path);
            return response.data;
        } catch (error: any) {
            this.handleError("Error getting session", error);
        }
    }

    async deleteSession(sessionId: string): Promise<boolean> {
        try {
            const path = this.buildPath('sessions', sessionId);
            await this.client.delete(path);
            return true;
        } catch (error: any) {
            this.handleError("Error deleting session", error);
            return false;
        }
    }

    async sendMessage(sessionId: string, message: string): Promise<any> {
        try {
            const path = this.buildPath('sessions', sessionId, 'sendMessage');
            const response = await this.client.post(path, { prompt: message });
            return response.data;
        } catch (error: any) {
            this.handleError("Error sending message", error);
        }
    }

    async approvePlan(sessionId: string): Promise<any> {
        try {
            const path = this.buildPath('sessions', sessionId, 'approvePlan');
            const response = await this.client.post(path, {});
            return response.data;
        } catch (error: any) {
            this.handleError("Error approving plan", error);
        }
    }

    async listActivities(sessionId: string, pageSize: number = 50, pageToken?: string, createTime?: string): Promise<any> {
        const params: any = { pageSize };
        if (pageToken) params.pageToken = pageToken;
        if (createTime) params.createTime = createTime;

        try {
            const basePath = this.buildPath('sessions', sessionId);
            const path = `${basePath}/activities`;
            const response = await this.client.get(path, { params });
            return response.data;
        } catch (error: any) {
            this.handleError("Error listing activities", error);
        }
    }

    async getActivity(sessionId: string, activityId: string): Promise<any> {
        try {
            const basePath = this.buildPath('sessions', sessionId);
            const path = `${basePath}/activities/${activityId}`;
            const response = await this.client.get(path);
            return response.data;
        } catch (error: any) {
            this.handleError("Error getting activity", error);
        }
    }

    async pollSession(sessionName: string, streamOutput: boolean = false): Promise<any> {
        const seenActivities = new Set<string>();
        const activitiesLog: any[] = [];

        while (true) {
            let sessionData: any;
            let state: string = "STATE_UNSPECIFIED";
            try {
                const sessResp = await this.client.get(`/${sessionName}`);
                sessionData = sessResp.data;
                state = sessionData.state || "STATE_UNSPECIFIED";
            } catch (e: any) {
                const errorResult = {
                    status: "error",
                    error: e.message,
                    session_name: sessionName
                };
                if (streamOutput) console.log(JSON.stringify(errorResult, null, 2));
                return errorResult;
            }

            try {
                const actResp = await this.client.get(`/${sessionName}/activities`);
                const activities = actResp.data.activities || [];

                activities.sort((a: any, b: any) => {
                    return (a.createTime || "").localeCompare(b.createTime || "");
                });

                for (const activity of activities) {
                    const actId = activity.id || "unknown";
                    if (!seenActivities.has(actId)) {
                        const activityData = {
                            id: actId,
                            description: activity.description || "No description",
                            originator: activity.originator || "SYSTEM",
                            createTime: activity.createTime || ""
                        };

                        if (streamOutput) console.log(JSON.stringify(activityData, null, 2));
                        activitiesLog.push(activityData);
                        seenActivities.add(actId);
                    }
                }
            } catch (e) {
                // Transient network errors shouldn't crash the loop immediately
            }

            if (["COMPLETED", "FAILED", "CANCELLED"].includes(state)) {
                const result: any = {
                    status: "completed",
                    state,
                    session_name: sessionName,
                    activities: activitiesLog,
                    session_data: sessionData
                };

                if (state === "COMPLETED" && sessionData.outputs) {
                    result.outputs = sessionData.outputs;
                }

                if (streamOutput) {
                    const finalStatus = {
                        status: "session_finished",
                        state,
                        session_name: sessionName
                    };
                    console.log(JSON.stringify(finalStatus, null, 2));
                }

                return result;
            }

            if (state === "AWAITING_USER_FEEDBACK") {
                const result = {
                    status: "awaiting_feedback",
                    state,
                    session_name: sessionName,
                    session_url: sessionData.url || "URL not found",
                    activities: activitiesLog
                };

                if (streamOutput) {
                    const feedbackStatus = {
                        status: "awaiting_user_feedback",
                        session_url: sessionData.url || "URL not found"
                    };
                    console.log(JSON.stringify(feedbackStatus, null, 2));
                }

                return result;
            }

            // Sleep for 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    private handleError(message: string, error: any) {
        const errorData: any = {
            error: message,
            details: error.message
        };
        if (error.response && error.response.data) {
            errorData.response = error.response.data;
        }
        console.error(JSON.stringify(errorData, null, 2));
        throw new Error(`${message}: ${error.message}`);
    }
}
