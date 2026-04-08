
## 2024-05-18 - [CRITICAL] Fix Path Traversal via startsWith Bypass
**Vulnerability:** Path traversal vulnerability where `absolutePath.startsWith(feedbackRoot)` allowed bypassing directory restrictions (e.g., `/feedback-secret` bypasses `/feedback`).
**Learning:** Using `startsWith` for path verification is insecure because it operates on strings, not directory boundaries.
**Prevention:** Use `path.relative(root, target)` and verify the resulting path does not start with `..` and is not absolute.
