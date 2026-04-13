# Dynamic AI Mocking Server for Testing

## The Idea
The concept is to replace static mocks in the testing suite with a dynamic, dedicated "AI Mocking Server". Instead of hardcoding responses for AI services (like Groq Vision or Jules API) using tools like `jest.mock`, a local mock server is spun up during test execution.

When the application makes an API call to an AI provider during a test, the request is routed to this local mock server. The mock server, overseen by the AI agent running the tests (Jules), can then dynamically generate a genuine, context-aware AI response. This approach allows the testing agent to play two roles:
1. **The Tester:** Orchestrating and running the test suite.
2. **The Mock AI Provider:** Dynamically generating realistic responses to AI calls triggered by the tests.

This ensures the application is tested against genuine, variable AI outputs rather than rigid, static strings, leading to more robust and realistic end-to-end testing.

---

## Implementation Plan

To implement this idea in relation to the current codebase's tests (e.g., `server.test.ts`, `julesService.test.ts`), we can follow these steps:

### 1. Make AI Provider URLs Configurable
Currently, API calls to Groq or Jules likely use hardcoded base URLs from their respective SDKs or direct fetch calls.
- **Action:** Update `backend/src/config/index.ts` to include base URLs for AI providers, allowing them to be overridden via environment variables (e.g., `GROQ_BASE_URL`, `JULES_API_URL`).
- **Action:** Update `visionService` and `JulesClient` to use these configurable base URLs.

### 2. Create the AI Mock Server
- **Action:** Create a new local server script at `backend/tests/mock-server/aiMockServer.ts`.
- **Action:** This server will expose endpoints that mirror the actual provider APIs (e.g., Groq's `/v1/chat/completions` or Jules API endpoints).
- **Action:** Implement dynamic response handlers. Instead of returning a static string, the handler could use a lightweight real AI call (using test credentials), or pause to allow the testing agent to provide an interactive/dynamic response.

### 3. Integrate the Mock Server with the Test Suite (Jest)
- **Action:** Create a global setup/teardown file for Jest (`backend/tests/globalSetup.ts` and `globalTeardown.ts`) to start the `AiMockServer` before tests begin and shut it down once all tests are completed.
- **Action:** Set the `GROQ_BASE_URL` and `JULES_API_URL` environment variables in the test environment to point to `http://localhost:<mock_server_port>`.

### 4. Refactor Existing Tests
- **Action:** In `backend/tests/server.test.ts` and `backend/tests/julesService.test.ts`, remove the static `jest.mock` blocks for `visionService` and `JulesClient`.
- **Action:** Allow the tests to run the actual service code. The services will hit the `AiMockServer` instead of the real providers.
- **Action:** Ensure the tests assert the dynamic output correctly (e.g., checking for structure and expected data rather than exact static strings).
