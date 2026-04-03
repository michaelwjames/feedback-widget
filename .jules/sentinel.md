## 2024-05-24 - [Path Traversal in Feedback Download]
**Vulnerability:** Path traversal in `backend/src/controllers/feedbackController.ts` allowed downloading arbitrary files. The validation logic used `startsWith` on absolute paths, which doesn't respect directory boundaries (e.g., `/tmp/feedback-dir-attack` starts with `/tmp/feedback-dir`).
**Learning:** Never use string methods like `startsWith` for path validation. It can be easily bypassed.
**Prevention:** Use `path.relative(root, target)` and verify the resulting path does not equal `..`, start with `..` + `path.sep`, and is not an absolute path.
