## 2025-02-28 - Fix path traversal in file download
**Vulnerability:** The `downloadFeedback` controller used `absolutePath.startsWith(feedbackRoot)` to verify if the requested path was within the allowed directory.
**Learning:** Using `startsWith` for path boundary validation is insecure because it doesn't respect directory boundaries. For instance, `/feedback_backup` starts with `/feedback`, thus bypassing the check if `feedbackRoot` is `/feedback`.
**Prevention:** Use `path.relative(root, target)` instead. Check if the resulting relative path is `..`, starts with `..${path.sep}`, or is an absolute path. If any of these are true, the target path is outside the allowed root directory.
