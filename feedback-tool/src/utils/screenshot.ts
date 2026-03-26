import { RectParams } from '../ui/Overlay';

declare global {
  const htmlToImage: any;
}

export class ScreenshotUtil {
  constructor() {
    // Dynamically load html-to-image from cdnjs
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  async captureSelection(rect: RectParams): Promise<string> {
    if (typeof htmlToImage === 'undefined') {
      throw new Error('html-to-image is still loading or failed to load. Please try again in a moment.');
    }

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
          if (node.id === 'fw-toolbar') return false; // Exclude floating toolbar
          if (node.id === 'fw-overlay') return false; // Exclude selection overlay
          if (node.classList && node.classList.contains('fw-comment-input')) return false; // Exclude text inputs

          // But KEEP the comment markers themselves (they have class 'fw-comment-marker')
          if (node.id && node.id.startsWith('fw-') && !node.id.startsWith('fw-comment-marker-')) return false;

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
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;

          ctx.drawImage(img, 0, 0);

          const rx = rect.x + window.scrollX;
          const ry = rect.y + window.scrollY;
          const rw = rect.width;
          const rh = rect.height;

          // Draw dark overlay on unselected areas
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, 0, canvas.width, ry); // Top
          ctx.fillRect(0, ry + rh, canvas.width, canvas.height - (ry + rh)); // Bottom
          ctx.fillRect(0, ry, rx, rh); // Left
          ctx.fillRect(rx + rw, ry, canvas.width - (rx + rw), rh); // Right

          // Draw red border around selected area
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(rx, ry, rw, rh);

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
