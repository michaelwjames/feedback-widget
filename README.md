# Feedback Tool & AI Agent Pipeline

An internal, full-stack feedback-to-code pipeline. It combines a frontend feedback widget with a backend orchestration server and specialized AI providers to automatically transform user feedback into code fixes, pull requests, or tickets.

## 🚀 The Workflow

1.  **Capture**: Users use the **Feedback Widget** to select a UI area, snap a screenshot, and add a description.
2.  **Save & Analyze**: The **Backend Server** saves the feedback and triggers a vision analysis.
3.  **Refine**: The **Vision Processor** analyzes the screenshot and context to generate a precise technical prompt.
4.  **Execute**: The **Jules Processor** receives the prompt, executes the necessary code changes in the target repository, and optionally opens a Pull Request. Alternatively, the **Linear Processor** can be triggered to create a bug ticket.

---

## 🏗️ System Architecture

### 1. Frontend Integration (`frontend/`)

The frontend component is a feedback widget built with TypeScript that can be injected into any web application.

- **Build**: Uses `esbuild` to compile TypeScript source files into a distributable `feedback-widget.js` and `feedback-widget.css`.
- **Functionality**:
    - Includes a floating trigger button to initiate feedback.
    - Features a toolbar for selecting a specific UI area or adding comment markers.
    - Uses `html2canvas` for client-side screenshot generation of selected areas.
    - Captures page context (URL, resolution, user agent) and selected elements.
    - Interacts with the backend via `APIClient` to submit payloads and trigger analyses.

#### Setup & Build
```bash
cd frontend
pnpm install
pnpm build
```

#### Integration

Include the CSS and JS files in your target project and configure the backend endpoint.

**1. Include the CSS**
```html
<link rel="stylesheet" href="path/to/feedback-widget.css">
```

**2. Configure the Widget**
```html
<script>
window.FEEDBACK_WIDGET_CONFIG = {
    endpoint: 'http://localhost:12345/api/feedback', // Adjust to your backend endpoint
};
</script>
```

**3. Include the JavaScript**
```html
<script src="path/to/feedback-widget.js"></script>
```

### 2. Backend Orchestration Server (`backend/`)

A Node.js/Express server written in TypeScript that handles API requests, stores feedback data locally, and acts as a router to the various AI and processor services.

- **Routes & Controllers**: Structured explicitly into controllers (`FeedbackController`, `VisionController`, `ProcessorController`, `AuthController`).
- **Endpoints**:
    - `POST /api/feedback`: Saves incoming feedback (text, screenshot, metadata) to the filesystem.
    - `POST /api/vision/analyze`: Triggers the Vision Processor.
    - `POST /api/send-to/:processor`: Dispatches feedback to a designated processor (`jules` or `linear`).
    - `GET /api/:processor/sources` & `/personas`: Configuration fetching for specific processors.
- **Storage**: Saves raw data sequentially under `backend/feedbacks/[timestamp]/`.

#### Setup & Start
```bash
cd backend
pnpm install
pnpm start
```

### 3. Feedback Processors (`backend/src/services/feedback_processors/`)

A plugin-like factory architecture handles sending processed data to downstream agents and ticketing tools.

- **Vision Processor (`groqProvider.ts`)**: Uses Groq SDK with Llama 4 Scout. It reads the local markdown and screenshots saved by the server and outputs a structured agent prompt for developers or downstream AI agents.
- **Jules Processor (`JulesService`, `JulesClient`)**: A dedicated service for triggering the Google Jules API. It initiates automated coding sessions, passes the vision-refined prompt, selects the repository and branch context, and executes code changes, often ending in a Pull Request.
- **Linear Processor (`LinearService`)**: Translates feedback into bug tickets and uploads screenshot assets directly via the Linear API.

---

## 🔑 Environment Configuration

Create a `.env` file in the `backend/` directory based on `.env.example`. Ensure the following environment variables are appropriately set:

- `GROQ_API_KEY`: Required for the Vision Processor.
- `JULES_API_KEY`: Required for the Jules Processor.
- `LINEAR_API_KEY`: Required for the Linear Processor.
- `LINEAR_TEAM_ID`: Required for the Linear Processor to know which project to target.
- `PORT`: (Optional) The port for the backend server to listen on.
- `FEEDBACK_DIR`: (Optional) Where feedback artifacts are saved.
- `AUTH_PASSWORD`: (Optional) Required if the widget requires users to login before giving feedback.

---

## ✨ Features
- **Visual Selection & Markers**: Users can draw a rectangle to select specific UI elements or drop numerical comment markers directly onto the UI.
- **Context Preservation**: The frontend automatically pairs generated screenshots with environmental metadata and DOM state context.
- **Multi-Processor Orchestration**: Backend factory handles dispatching feedback to coding agents (Jules) or ticketing systems (Linear) with extensible plugin architecture.
- **End-to-End Automation**: Capable of going straight from user visual feedback to a codebase Pull Request with no human developer intermediation.
