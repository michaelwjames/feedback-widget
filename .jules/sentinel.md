## 2024-04-23 - Prevent Path Traversal in File Download
**Vulnerability:** The backend download endpoint verified path boundaries using string-based `.startsWith()`.
**Learning:** `startsWith()` does not correctly handle directory traversal if the requested path is not within the root but shares the same prefix. E.g., `feedback_secrets` starts with `feedback`, making `.startsWith()` check pass and allowing an attacker to download unauthorized files from a parallel directory.
**Prevention:** Always use `path.relative()` to compute the relative directory from the root to the absolute resolved target path, and verify the resulting relative path is not an absolute path and does not start with `..`.
