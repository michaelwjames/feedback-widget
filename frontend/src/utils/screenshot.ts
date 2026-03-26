import { RectParams } from '../ui/Overlay';
import { FeedbackComment } from '../types';

declare global {
  const htmlToImage: any;
}

export class ScreenshotUtil {
  private static loadPromise: Promise<void> | null = null;

  constructor() {
    this.ensureLoaded().catch(err => {
      console.error("[FEEDBACK-WIDGET] Initial script load failed:", err);
    });
  }

  private ensureLoaded(): Promise<void> {
    if (ScreenshotUtil.loadPromise) {
      return ScreenshotUtil.loadPromise;
    }

    // Check if it's already there (e.g. from an earlier load or outside source)
    if (typeof (window as any).htmlToImage !== 'undefined') {
      ScreenshotUtil.loadPromise = Promise.resolve();
      return ScreenshotUtil.loadPromise;
    }

    ScreenshotUtil.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
      script.async = true;
      script.onload = () => {
        console.log("[FEEDBACK-WIDGET] html-to-image loaded successfully.");
        resolve();
      };
      script.onerror = () => {
        ScreenshotUtil.loadPromise = null; // Allow retry on failure
        reject(new Error("Failed to load html-to-image script from CDN."));
      };
      document.head.appendChild(script);
    });

    return ScreenshotUtil.loadPromise;
  }

  async captureSelection(rects: RectParams[], comments: FeedbackComment[], fullPage: boolean = true): Promise<string> {
    // Wait for the library to be ready before starting capture
    await this.ensureLoaded();

    console.log("[FEEDBACK-WIDGET] Starting screenshot capture with html-to-image...");

    // Add a visual indicator that capturing is in progress
    const capturingToast = document.createElement('div');
    capturingToast.id = "fw-capturing-toast";
    capturingToast.innerText = "Capturing...";
    capturingToast.style.cssText = "position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:20px;z-index:9999999;";
    document.body.appendChild(capturingToast);

    try {
      // Capture using toPng with extra safety filters
      const dataUrl = await htmlToImage.toPng(document.body, {
        backgroundColor: '#ffffff',
        pixelRatio: 1,
        cacheBust: true,
        filter: (node: HTMLElement) => {
          // Exclude scripts and our own widget elements to prevent capture errors/recursion
          if (node.tagName === 'SCRIPT') return false;
          
          // Exclude ALL elements with 'fw-' prefix or widget-specific classes
          if (node.id && node.id.startsWith('fw-')) return false;
          if (node.classList && (
            node.classList.contains('fw-comment-input') || 
            node.classList.contains('fw-comment-marker')
          )) return false;

          return true;
        }
      });

      console.log("[FEEDBACK-WIDGET] Capture success. dataUrl length:", dataUrl.length);

      // Safety check for common failure modes where text/html is returned
      if (!dataUrl || !dataUrl.startsWith("data:image/")) {
        console.error("[FEEDBACK-WIDGET] Captured invalid dataUrl type:", dataUrl.substring(0, 100));
        throw new Error("Captured data is not an image. It might be an error page or blocked resource.");
      }

      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log("[FEEDBACK-WIDGET] Rendering selection overlay...");

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          if (fullPage) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          } else {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.drawImage(img, -window.scrollX, -window.scrollY);
          }

          if (rects.length > 0) {
            const darkCanvas = document.createElement('canvas');
            darkCanvas.width = canvas.width;
            darkCanvas.height = canvas.height;
            const darkCtx = darkCanvas.getContext('2d')!;
            
            darkCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            darkCtx.fillRect(0, 0, darkCanvas.width, darkCanvas.height);
            
            darkCtx.globalCompositeOperation = 'destination-out';
            darkCtx.fillStyle = '#000';
            rects.forEach(rect => {
              // If viewport only, rect.x/y are already viewport-relative.
              // If full page, we need to add scroll.
              const rx = rect.x + (fullPage ? window.scrollX : 0);
              const ry = rect.y + (fullPage ? window.scrollY : 0);
              const rw = rect.width;
              const rh = rect.height;
              darkCtx.fillRect(rx, ry, rw, rh);
            });
            
            ctx.drawImage(darkCanvas, 0, 0);

            rects.forEach(rect => {
              const rx = rect.x + (fullPage ? window.scrollX : 0);
              const ry = rect.y + (fullPage ? window.scrollY : 0);
              const rw = rect.width;
              const rh = rect.height;
              ctx.strokeStyle = '#ff0000';
              ctx.lineWidth = 2;
              ctx.strokeRect(rx, ry, rw, rh);
            });
          }

          // Draw comment markers manually for maximum clarity
          comments.forEach(comment => {
            const cx = comment.x + (fullPage ? window.scrollX : 0);
            const cy = comment.y + (fullPage ? window.scrollY : 0);
            const radius = 18; // (36px width / 2)

            // Circle background
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // Border
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#e53e3e';
            ctx.stroke();

            // Text
            ctx.fillStyle = '#e53e3e';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(comment.number.toString(), cx, cy);
          });

          // Update final preview
          const finalDataUrl = canvas.toDataURL('image/png');

          if (document.body.contains(capturingToast)) {
            document.body.removeChild(capturingToast);
          }
          resolve(finalDataUrl);
        };
        img.onerror = (e) => {
          console.error("[FEEDBACK-WIDGET] Image object loading error.", e);
          if (document.body.contains(capturingToast)) {
            document.body.removeChild(capturingToast);
          }
          reject(new Error("Failed to load captured image into preview element."));
        };
        img.src = dataUrl;
      });

    } catch (err: any) {
      console.error("[FEEDBACK-WIDGET] Capture pipeline failed:", err);
      if (document.body.contains(capturingToast)) {
        document.body.removeChild(capturingToast);
      }
      throw new Error(err.message || "Unknown error");
    }
  }
}
