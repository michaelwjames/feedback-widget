export interface RectParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Overlay {
  private overlay: HTMLDivElement;
  private selectionRect: HTMLDivElement;
  private isDrawing: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private rectParams: RectParams | null = null;
  private onComplete: (rect: RectParams) => void;

  constructor(onComplete: (rect: RectParams) => void) {
    this.onComplete = onComplete;

    this.overlay = document.createElement('div');
    this.overlay.id = 'fw-overlay';
    document.body.appendChild(this.overlay);

    this.selectionRect = document.createElement('div');
    this.selectionRect.id = 'fw-selection-rect';
    this.overlay.appendChild(this.selectionRect);

    this.attachEvents();
  }

  private attachEvents() {
    this.overlay.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDrawing = true;
      this.startX = e.clientX;
      this.startY = e.clientY;

      this.selectionRect.style.left = `${this.startX}px`;
      this.selectionRect.style.top = `${this.startY}px`;
      this.selectionRect.style.width = '0px';
      this.selectionRect.style.height = '0px';

      this.overlay.classList.add('fw-drawing');
    });

    this.overlay.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDrawing) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);
      const left = Math.min(currentX, this.startX);
      const top = Math.min(currentY, this.startY);

      this.selectionRect.style.left = `${left}px`;
      this.selectionRect.style.top = `${top}px`;
      this.selectionRect.style.width = `${width}px`;
      this.selectionRect.style.height = `${height}px`;

      this.rectParams = { x: left, y: top, width, height };
    });

    this.overlay.addEventListener('mouseup', () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;

      document.body.style.userSelect = '';

      if (this.rectParams && this.rectParams.width > 10 && this.rectParams.height > 10) {
        // Rectangle has been drawn, trigger screenshot
        this.onComplete(this.rectParams);
      } else {
        // Clicked without dragging, cancel
        this.reset();
      }
    });
  }

  show() {
    this.overlay.style.display = 'block';
    document.body.style.userSelect = 'none'; // Prevent text selection
  }

  hide() {
    this.overlay.style.display = 'none';
  }

  reset() {
    this.hide();
    this.overlay.classList.remove('fw-drawing');
    this.selectionRect.style.width = '0px';
    this.selectionRect.style.height = '0px';
    this.rectParams = null;
  }
}
