
## 2024-05-18 - [Fix path traversal in file download]
**Vulnerability:** The `downloadFeedback` endpoint in `/app/backend/src/controllers/feedbackController.ts` validated file paths using `!absolutePath.startsWith(feedbackRoot)`. This is vulnerable to directory traversal because a directory named `/tmp/feedbacks-secret` starts with the string `/tmp/feedbacks`, thereby bypassing the security check.
**Learning:** Using string manipulation (like `startsWith`) for path validation is unsafe because it doesn't respect directory boundaries.
**Prevention:** Always use `path.relative(root, target)` and check if the result is `..` or starts with `..${path.sep}` or is an absolute path.
