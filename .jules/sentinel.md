# Security Journal

## Vulnerability: Unauthenticated Access to Vision Analysis Endpoint
- **Learning**: In Express.js, routes registered before authentication middleware (like `router.use('/api', ...)` or per-route middleware) are not protected by that middleware. This is a common source of "broken access control" (OWASP A01).
- **Prevention**: Always ensure that sensitive API endpoints are either registered after the global authentication middleware or have explicit middleware protection applied. In this codebase, sensitive routes should follow the pattern `router.post('/path', AuthController.middleware, Controller.method)`.
