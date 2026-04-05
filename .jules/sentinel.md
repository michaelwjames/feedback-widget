## 2024-05-24 - Path Traversal in Feedback Download
**Vulnerability:** The `downloadFeedback` method in `/app/backend/src/controllers/feedbackController.ts` uses `startsWith()` to verify if a requested file path is within the allowed `config.feedbackDir`. This allows path traversal because `startsWith()` does not respect directory boundaries (e.g., `/data/feedback_secrets` starts with `/data/feedback`).
**Learning:** Checking string prefixes for path validation is insufficient and inherently insecure for preventing directory traversal.
**Prevention:** Always use `path.relative(root, target)` and verify that the resulting path does not start with `..` and is not absolute to enforce strict directory boundaries.
