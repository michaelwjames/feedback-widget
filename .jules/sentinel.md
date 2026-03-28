## 2024-03-28 - [Critical] Unauthenticated Vision Analysis API Endpoint

**Vulnerability:** The `/api/vision/analyze` endpoint was registered in the Express router *before* the authentication middleware (`AuthController.middleware`). This meant that the endpoint could be accessed by unauthenticated users, leading to unauthorized calls to the configured Vision API provider (e.g., Groq, OpenAI). This presents a significant risk of abuse, DoS attacks, and potential financial loss due to unauthorized API consumption.

**Learning:** In Express.js, middleware is executed in the order it is defined. Therefore, any route defined before an authentication middleware will not be protected by it. The ordering of routes and middlewares is a critical security boundary.

**Prevention:** Always define authentication middleware *before* defining the routes that require protection. Grouping protected routes together after a common `router.use('/api', authMiddleware)` is a good pattern, but care must be taken to ensure no sensitive routes are accidentally placed above this block. Regularly review route definitions and their relationship to authentication middleware.
