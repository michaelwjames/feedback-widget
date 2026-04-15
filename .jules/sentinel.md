## 2026-04-15 - Fix Path Traversal Vulnerability
**Vulnerability:** Path traversal risk found in `downloadFeedback` via `startsWith()`.
**Learning:** `startsWith()` is insufficient for path boundary validation because a path like `/tmp/feedback-test` starts with `/tmp/feedback` but is a completely different directory.
**Prevention:** Use `path.relative(root, target)` and ensure the result doesn't start with `..` or is absolute.
