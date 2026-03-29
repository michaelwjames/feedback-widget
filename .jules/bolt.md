
## 2024-03-29 - [Feedback File Reading Concurrency]
**Learning:** Sequential, synchronous file reads (`fs.readFileSync`) block the Node.js main thread and increase latency unnecessarily when handling optional payload files in this application's feedback processing pipeline. Since optional files like `metadata.json`, `agent_prompt.json`, and `screenshot.png` can be read concurrently using Promise.all, doing so prevents thread blocking and provides a cleaner way to handle potentially missing files (by catching `ENOENT` natively in the asynchronous block).
**Action:** Always favor `fs.promises.readFile` with `Promise.all` over synchronous methods when reading multiple local files for data aggregation.
