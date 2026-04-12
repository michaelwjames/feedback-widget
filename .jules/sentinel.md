
## 2026-04-12 - [Path Traversal bypass using startsWith]
**Vulnerability:** Path traversal vulnerability in downloadFeedback due to improper path validation.
**Learning:** Using `startsWith()` to check if a path is inside a directory is insecure because it doesn't enforce directory boundaries. For example, `/app/feedback-hack` starts with `/app/feedback`.
**Prevention:** Always use `path.relative(root, target)` and verify the resulting relative path does not start with `..` and is not absolute.
