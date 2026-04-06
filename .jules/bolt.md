
## 2024-03-29 - [Feedback File Reading Concurrency]
**Learning:** Sequential, synchronous file reads (`fs.readFileSync`) block the Node.js main thread and increase latency unnecessarily when handling optional payload files in this application's feedback processing pipeline. Since optional files like `metadata.json`, `agent_prompt.json`, and `screenshot.png` can be read concurrently using Promise.all, doing so prevents thread blocking and provides a cleaner way to handle potentially missing files (by catching `ENOENT` natively in the asynchronous block).
**Action:** Always favor `fs.promises.readFile` with `Promise.all` over synchronous methods when reading multiple local files for data aggregation.
## 2024-05-28 - Layout Thrashing Prevention in UI Interactions
**Learning:** Synchronous DOM style updates (like updating `left`, `top`, `width`, `height` styles) triggered rapidly by `mousemove` events during drag or draw operations cause severe layout thrashing and stuttering. Even when throttling with `requestAnimationFrame`, if the coordinates (`clientX`, `clientY`) are captured *inside* the rAF callback, the coordinates might not reflect the absolute latest mouse position, leading to subtle stuttering.
**Action:** Always use `window.requestAnimationFrame` to throttle rapid style updates on pointer events. Crucially, capture the event values (e.g., `e.clientX`, `e.clientY`) *outside* the rAF callback immediately in the event handler, and refer to those captured variables inside the rAF callback. This ensures the frame renders using the most up-to-date position.

## 2026-04-06 - [Concurrent I/O for Vision Analysis]
**Learning:** Synchronous file operations like `fs.readFileSync`, `fs.existsSync`, and `fs.writeFileSync` inside `VisionProvider` block the Node.js event loop during heavy payload processing. Furthermore, processing items sequentially unnecessarily increases latency.
**Action:** Always favor `fs.promises` methods, and group multiple asynchronous read tasks (like reading markdown text and encoding base64 images) into a single `Promise.all()` block for maximum concurrency.
