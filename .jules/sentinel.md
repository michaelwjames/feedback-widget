
## 2024-05-18 - Fix Path Traversal in File Download
**Vulnerability:** The application was using `startsWith` to validate if a requested download path was inside the configured feedback directory (`absolutePath.startsWith(feedbackRoot)`). This is vulnerable because `startsWith` does not respect directory boundaries (e.g., `/app/data-secret` starts with `/app/data`).
**Learning:** In Node.js, checking path boundaries with string matching (`startsWith`, `includes`) is insecure and can lead to path traversal vulnerabilities.
**Prevention:** Always use `path.relative(root, target)` and verify the path is strictly inside the directory by ensuring the relative path does not equal `'..'`, start with `'..' + path.sep`, or is not an absolute path (`path.isAbsolute`).
