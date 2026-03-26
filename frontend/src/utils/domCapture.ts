import { RectParams } from '../ui/Overlay';
import { FeedbackComment } from '../types';

export class DOMCapture {
  /**
   * Captures HTML for elements selected via rectangle or comment marker.
   * Prioritizes rectangles, then comments. Returns empty string if full page is selected.
   */
  public capture(rects: RectParams[], comments: FeedbackComment[], fullPage: boolean): string {
    if (fullPage) {
        return ""; // Too large to capture the whole DOM
    }

    const targetedElements: Set<Element> = new Set();

    // 1. Target elements by comments
    comments.forEach(comment => {
      const el = document.elementFromPoint(comment.x, comment.y);
      if (el) {
          // Go up a level to provide better context, if possible, but not all the way to body
          const target = el.parentElement && el.parentElement !== document.body && el.parentElement !== document.documentElement
            ? el.parentElement
            : el;
          targetedElements.add(target);
      }
    });

    // 2. Target elements by rectangles
    if (rects.length > 0) {
        // Collect all elements on the page
        const allElements = document.querySelectorAll('*');
        rects.forEach(rect => {
            const intersecting: Element[] = [];
            allElements.forEach(el => {
                // Ignore the widget's own overlay elements
                if (el.id.startsWith('fw-') || el.classList.contains('fw-selection-rect') || el.tagName.toLowerCase() === 'svg') {
                    return;
                }

                const bounds = el.getBoundingClientRect();

                // Check for intersection
                const intersects = !(
                    bounds.right < rect.x ||
                    bounds.left > rect.x + rect.width ||
                    bounds.bottom < rect.y ||
                    bounds.top > rect.y + rect.height
                );

                if (intersects && bounds.width > 0 && bounds.height > 0) {
                    intersecting.push(el);
                }
            });

            if (intersecting.length > 0) {
                // Find highest common ancestor, simplified: just grab the largest elements that intersect
                // We'll sort by area descending and take the top one that isn't body/html
                intersecting.sort((a, b) => {
                    const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
                    const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
                    return areaB - areaA;
                });

                for (const el of intersecting) {
                    if (el !== document.body && el !== document.documentElement) {
                        targetedElements.add(el);
                        break; // Just need the highest container
                    }
                }
            }
        });
    }

    let snapshot = "";
    targetedElements.forEach(el => {
        let html = el.outerHTML;
        // Basic sanitization
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // remove scripts
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''); // remove inline styles
        snapshot += html + "\n\n";
    });

    // Strip out widget specific UI
    snapshot = snapshot.replace(/<div[^>]*id="fw-[^>]*>.*?<\/div>/gis, '');
    snapshot = snapshot.replace(/<div[^>]*class="fw-[^>]*>.*?<\/div>/gis, '');

    return snapshot.trim();
  }
}
