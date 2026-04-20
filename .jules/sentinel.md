
## 2026-04-20 - [Path Traversal in Node.js]
**Vulnerability:** Path traversal vulnerability due to using `startsWith()` for directory boundary validation (`!absolutePath.startsWith(feedbackRoot)`).
**Learning:** `startsWith()` does not respect directory boundaries in paths. An attacker could request a path like `/feedback-hacked` which shares the same prefix as `/feedback` but is outside the intended directory.
**Prevention:** Instead of `startsWith()`, use `path.relative(root, target)` and strictly verify the result: `relativePath === '..' || relativePath.startsWith('..' + path.sep) || path.isAbsolute(relativePath)` should be rejected.
