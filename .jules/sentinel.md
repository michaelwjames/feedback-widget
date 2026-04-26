
## 2024-04-26 - [CRITICAL] Fix Path Traversal in FeedbackController
**Vulnerability:** The `FeedbackController.downloadFeedback` endpoint validated file paths using an insecure `absolutePath.startsWith(feedbackRoot)` check. This allowed an attacker to request paths like `/tmp/feedbacks-secret` if `feedbackRoot` was `/tmp/feedbacks`, effectively bypassing the directory restriction.
**Learning:** Using `String.prototype.startsWith()` on file paths is inherently unsafe because it does not understand directory boundaries or separators, allowing path traversal when directory names share a common prefix.
**Prevention:** Always use `path.relative()` to resolve paths and verify that the resulting relative path does not start with `..`, is not strictly `..`, and is not an absolute path to securely confine access within a designated directory.
