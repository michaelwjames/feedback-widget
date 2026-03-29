## 2025-03-29 - Missing authentication on sensitive endpoints (Express Route Order)
**Vulnerability:** The `/api/vision/analyze` endpoint was exposed publicly without authentication because its route was defined *before* the authentication middleware `router.use('/api', ...)` in Express.js.
**Learning:** In Express.js, route registration order is critical. Routes registered before middleware (like auth checks) will bypass that middleware completely, leading to an authorization bypass on the API endpoint.
**Prevention:** Always place global or path-specific authentication middleware declarations *before* registering the sensitive routes they are meant to protect. Group unprotected/open routes explicitly at the top and visually separate protected routes below the middleware.
