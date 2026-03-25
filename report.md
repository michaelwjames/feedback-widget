# Vercel Deployment & Features Report for Feedback Tool

This report details the architectural changes and features required to migrate the Feedback Tool to Vercel, implementing a serverless storage model using `/tmp`, adding ZIP download functionality for feedback tickets, and integrating the Linear API for issue tracking.

## 1. Vercel Migration & Serverless Storage

The current Express server (`server.js`) relies on persistent local storage within a `./feedbacks` directory. When deploying to Vercel's serverless environment, local file storage is ephemeral and reset between function invocations. To address this, the application must utilize the `/tmp` directory, which allows up to 500MB of temporary storage during a single function's execution lifecycle.

### Strategy

*   **Update Storage Path:** Modify the `FEEDBACK_DIR` constant in `server.js` from `path.join(__dirname, 'feedbacks')` to `/tmp/feedbacks` or a platform-agnostic approach using `os.tmpdir()`.
    ```javascript
    const os = require('os');
    const FEEDBACK_DIR = path.join(os.tmpdir(), 'feedbacks');
    ```
*   **Vercel Functions Config:** Ensure `server.js` exports the Express app instead of immediately starting the listener (which it currently handles properly via `if (require.main === module)`).
*   **Dependencies in Serverless:** The current workflow triggers local Python scripts (`groq_vision_ocr.py`, `jules_client.py`) using `child_process.exec`. Vercel serverless functions do not natively support executing Python scripts alongside Node.js seamlessly without specific runtimes or build steps.
    *   *Recommendation:* Extract the logic of `groq_vision_ocr.py` into a new serverless function or call the Groq/Jules APIs directly from the Node.js serverless function using `fetch` or HTTP clients, eliminating the need for `child_process` and Python within the Vercel Node.js runtime.

## 2. ZIP Download Implementation

The user needs the ability to download a ZIP file containing the feedback artifacts (`feedback.md`, `screenshot.png`, `jules_prompt.json`) directly from the widget UI after the Groq analysis is complete.

### Backend Changes (`server.js`)

*   **Install Library:** Add a dependency like `archiver` to handle ZIP creation dynamically.
*   **New Endpoint (`GET /api/download-feedback/:timestamp`):**
    *   This endpoint receives the timestamp/folder identifier of the specific feedback.
    *   It locates the files in `/tmp/feedbacks/[timestamp]`.
    *   It streams the files into a ZIP archive and sets the response headers to trigger a file download (`Content-Type: application/zip`, `Content-Disposition: attachment; filename="feedback-[timestamp].zip"`).

### Frontend Changes (`feedback-widget.js`)

*   **Update UI:** In the `fw-result-area`, add a new "Download ZIP" button alongside or near the prompt preview.
*   **Action Logic:** When the user clicks the "Download ZIP" button, trigger a download by navigating to or fetching the new `/api/download-feedback/:timestamp` endpoint using the `currentFeedbackDir` context.

## 3. Linear API Integration

Integrating Linear allows the feedback tool to automatically generate an actionable issue ticket in a project management system alongside the codebase PR generation.

### Architecture

1.  **Authentication:** Configure a `LINEAR_API_KEY` as an environment variable in Vercel.
2.  **SDK/HTTP Client:** Use the `@linear/sdk` or standard `fetch` to interact with the Linear GraphQL API.
3.  **New Endpoint or Middleware:**
    *   Option A (Automated): Trigger the Linear ticket creation at the end of the `POST /api/feedback` route (or concurrently with Jules).
    *   Option B (Manual Trigger): Add a "Create Linear Ticket" button in the widget that calls a new `/api/create-linear-ticket` endpoint.
4.  **Data Mapping:**
    *   **Title:** Extract a short summary from the user's `text` or generate a concise title using the existing Groq payload.
    *   **Description:** Populate the description with the user's textual feedback, metadata (URL, User Agent, Resolution), and append the technical `prompt_for_jules` analysis for developer context.
    *   **Attachments (Optional):** Upload the `screenshot.png` to Linear using an external hosting solution or attach it directly if the API permits binary uploads for issues.
    *   **Team/Project ID:** Hardcode or configure a default `teamId` where these bugs will reside.

### Implementation Example

```javascript
// Using @linear/sdk
const { LinearClient } = require('@linear/sdk');
const linearClient = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

async function createLinearTicket(feedbackText, julesPrompt, metadata) {
    const issueDescription = `${feedbackText}\n\n**Technical Analysis:**\n${julesPrompt}\n\n**Metadata:**\nURL: ${metadata.url}\nBrowser: ${metadata.userAgent}`;

    const issue = await linearClient.createIssue({
        teamId: 'YOUR_TEAM_ID', // Requires configuration
        title: `User Feedback: ${feedbackText.substring(0, 40)}...`,
        description: issueDescription,
    });
    return issue;
}
```

By following these strategies, the Feedback Tool can be reliably transitioned to Vercel while preserving its functionality, adding useful data extraction capabilities via ZIP, and integrating with professional workflow tools like Linear.
