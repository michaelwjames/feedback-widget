## 2025-03-05 - Fix Path Traversal in Feedback Download
**Vulnerability:** The feedback download endpoint used `startsWith()` for path validation, which allows directory traversal (e.g. `/app/feedback-hacked` bypasses `/app/feedback` check).
**Learning:** Using `startsWith()` is insufficient for directory boundary checks in Node.js because it acts on strings, not path segments.
**Prevention:** Always use `path.relative(root, target)` and verify the relative path does not traverse upwards (`..`) or use an absolute path.
