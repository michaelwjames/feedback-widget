## 2025-02-14 - Express Route Registration Order Vulnerability
**Vulnerability:** The backend route `/api/vision/analyze` was registered before the authentication middleware in `backend/src/routes.ts`, resulting in an unauthenticated endpoint bypass.
**Learning:** In Express, route registration order is critical. Routes registered before authentication middleware (e.g., `router.use('/api', ...)` or `AuthController.middleware`) will bypass authentication.
**Prevention:** Always group protected routes after the authentication middleware is applied, and verify route ordering during code review.
