## 2024-03-30 - Fix Path Traversal via `startsWith` Check
**Vulnerability:** The backend `downloadFeedback` endpoint validated if a requested path was within the feedback directory using `absolutePath.startsWith(feedbackRoot)`. This is vulnerable to directory traversal if an attacker requests a directory with the same prefix (e.g., if `feedbackRoot` is `/tmp/feedbacks`, an attacker could access `/tmp/feedbacks-malicious`).
**Learning:** Using `startsWith` on string paths for security boundaries is dangerous because it doesn't respect directory boundaries.
**Prevention:** Always use `path.relative(root, target)` and check that the resulting relative path does not start with `..` and is not absolute to ensure strict boundary enforcement.
