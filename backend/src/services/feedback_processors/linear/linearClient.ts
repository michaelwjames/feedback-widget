import axios from 'axios';

export class LinearClient {
    private apiKey: string;
    private teamId: string;
    private baseUrl: string = "https://api.linear.app/graphql";

    constructor(apiKey: string, teamId: string) {
        this.apiKey = apiKey;
        this.teamId = teamId;
    }

    async uploadScreenshot(base64Image: string): Promise<string> {
        // Prepare file data
        const imageData = base64Image.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(imageData, 'base64');
        const filename = "feedback.png";
        const contentType = "image/png";
        const size = buffer.length;

        // 1. Get signed upload URL
        const uploadTemplateMutation = `
            mutation FileUploadTemplates($input: FileUploadTemplatesInput!) {
                fileUploadTemplates(input: $input) {
                    success
                    templates {
                        uploadUrl
                        assetUrl
                        headers {
                            name
                            value
                        }
                    }
                }
            }
        `;

        const templateResponse = await axios.post(this.baseUrl, {
            query: uploadTemplateMutation,
            variables: {
                input: {
                    contentType,
                    filename,
                    size
                }
            }
        }, {
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!templateResponse.data.data?.fileUploadTemplates?.success) {
            throw new Error("Failed to get Linear upload template");
        }

        const template = templateResponse.data.data.fileUploadTemplates.templates[0];
        const { uploadUrl, assetUrl, headers } = template;

        // 2. Upload to S3
        const uploadHeaders: any = {};
        headers.forEach((h: { name: string, value: string }) => {
            uploadHeaders[h.name] = h.value;
        });
        uploadHeaders['Content-Type'] = contentType;

        await axios.put(uploadUrl, buffer, {
            headers: uploadHeaders
        });

        return assetUrl;
    }

    async createIssue(title: string, description: string, teamId: string): Promise<any> {
        const issueCreateMutation = `
            mutation IssueCreate($input: IssueCreateInput!) {
                issueCreate(input: $input) {
                    success
                    issue {
                        id
                        title
                        url
                    }
                }
            }
        `;

        const response = await axios.post(this.baseUrl, {
            query: issueCreateMutation,
            variables: {
                input: {
                    title,
                    description,
                    teamId
                }
            }
        }, {
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.data?.issueCreate?.success) {
            console.error("[LinearClient] Issue creation failed:", JSON.stringify(response.data, null, 2));
            throw new Error("Failed to create Linear issue");
        }

        return response.data.data.issueCreate.issue;
    }
}
