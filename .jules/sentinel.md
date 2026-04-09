## 2025-04-09 - Path Traversal via startsWith In Node.js
**Vulnerability:** A path traversal vulnerability existed in `/app/backend/src/controllers/feedbackController.ts` because it used `absolutePath.startsWith(feedbackRoot)` to verify directory boundaries. This allows `feedback-secret` to bypass checks if `feedbackRoot` is `feedback`.
**Learning:** `startsWith` is insecure for verifying directory boundaries because it operates on strings, not path segments. A path like `/var/data/feedback-secret` starts with the string `/var/data/feedback`, so it passes the check even though it's outside the target directory.
**Prevention:** Always use `path.relative(root, target)` and verify the resulting relative path is not `..`, doesn't start with `..${path.sep}`, and isn't absolute.
