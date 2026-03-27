## 2024-05-20 - Unauthenticated Access to Vision API
**Vulnerability:** The `/api/vision/analyze` endpoint was registered in the Express router *before* the authentication middleware was applied. This allowed any unauthenticated user to trigger backend calls to the Vision Provider (Groq API).
**Learning:** In Express, route registration order is critical. Middlewares like `router.use(...)` only apply to routes defined *after* the middleware in the file.
**Prevention:** Always register public/open routes first, then register authentication middlewares, and finally register all protected endpoints below the middleware. Write automated tests that explicitly verify 401 Unauthorized responses for protected endpoints to catch regression.
