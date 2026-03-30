## 2024-03-30 - [RequestAnimationFrame for Drawing and Dragging]
**Learning:** The frontend's drawing (Overlay.ts) and dragging (Toolbar.ts) functionalities relied on synchronous, unthrottled DOM style updates within `mousemove` event listeners. This caused layout thrashing and unnecessary re-renders.
**Action:** Always wrap frequent, style-modifying DOM updates (like translating coordinates or resizing rects) in a `window.requestAnimationFrame` callback. Ensure final state is correctly updated and flushed on `mouseup` to prevent lost frames.
