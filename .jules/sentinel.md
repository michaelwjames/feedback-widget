## 2024-04-11 - [Auth Bypass on /api/vision/analyze]
**Vulnerability:** The route `/api/vision/analyze` was registered before the `AuthController.middleware` in `backend/src/routes.ts`, making it an unauthenticated endpoint. This could potentially allow unauthorized access or SSRF via the `runAnalysis` controller.
**Learning:** In Express, route registration order is critical. Routes registered before an authentication middleware will bypass that middleware completely.
**Prevention:** Always group protected routes together and ensure they are registered after the authentication middleware is applied.
