## 2024-05-18 - Fix Path Traversal Vulnerability
**Vulnerability:** The application was vulnerable to directory traversal in the feedback download endpoint because it used `startsWith()` to validate paths (e.g., `/app/feedback_hacked` starts with `/app/feedback`).
**Learning:** `startsWith()` does not respect directory boundaries and should never be used for path validation.
**Prevention:** Always use `path.relative()` and strictly check that the relative path does not equal `..`, start with `..` followed by `path.sep`, or is an absolute path.
