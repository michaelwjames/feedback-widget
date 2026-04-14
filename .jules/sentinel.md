## 2023-10-27 - Insecure Path Validation using startsWith
**Vulnerability:** Path traversal bypass in directory containment checks using `String.prototype.startsWith()`.
**Learning:** Checking if an absolute path is within a specific directory using `absolutePath.startsWith(allowedDir)` is insecure. It allows bypassing the check if a sibling directory exists with the same prefix (e.g., `/tmp/feedbacks-secret` starts with `/tmp/feedbacks`).
**Prevention:** Always use `path.relative(root, target)` and verify the resulting path does not equal `'..'`, start with `'..' + path.sep`, or is an absolute path.
