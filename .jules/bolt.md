
## 2025-03-26 - Array forEach to for...of iteration refactor
**Learning:** `forEach` executes a callback function for each array element. Replacing it with a native `for...of` loop avoids the overhead of function calls. Replacing `forEach` to `for...of` could throw TypeError when iterating over potentially non-iterable array elements. It's safe to use a fallback to empty array `|| []` to handle un-initialized elements or missing keys.
**Action:** Default potentially undefined lists and arrays to empty arrays when using `for...of` loop iterations in `feedback-widget.js`.
