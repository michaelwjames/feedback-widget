export interface RectParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Overlay {
  private overlay: HTMLDivElement;
  private isDrawing: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentRectDiv: HTMLDivElement | null = null;
  private currentRectParams: RectParams | null = null;
  private rects: { div: HTMLDivElement, params: RectParams }[] = [];
  private dimmingSvg: SVGSVGElement;
  private dimmingPath: SVGPathElement;
  private isRafPending: boolean = false;
  private latestX: number = 0;
  private latestY: number = 0;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'fw-overlay';
    document.body.appendChild(this.overlay);

    this.dimmingSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.dimmingSvg.id = 'fw-overlay-dimming';
    this.dimmingPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.dimmingPath.setAttribute('fill', 'rgba(0,0,0,0.4)');
    this.dimmingPath.setAttribute('fill-rule', 'evenodd');
    this.dimmingSvg.appendChild(this.dimmingPath);
    this.overlay.appendChild(this.dimmingSvg);

    this.attachEvents();
  }

  getSelections(): RectParams[] {
      return this.rects.map(r => r.params);
  }

  private updateDimming() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let pathData = `M 0 0 H ${w} V ${h} H 0 Z`;

    this.rects.forEach(r => {
      const { x, y, width, height } = r.params;
      pathData += ` M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
    });

    if (this.isDrawing && this.currentRectParams) {
      const { x, y, width, height } = this.currentRectParams;
      pathData += ` M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
    }

    this.dimmingPath.setAttribute('d', pathData);
  }

  private attachEvents() {
    this.overlay.addEventListener('mousedown', (e: MouseEvent) => {
      // Don't start drawing if clicking on a close button
      if ((e.target as HTMLElement).classList.contains('fw-selection-close')) return;

      this.isDrawing = true;
      this.startX = e.clientX;
      this.startY = e.clientY;

      this.currentRectDiv = document.createElement('div');
      this.currentRectDiv.className = 'fw-selection-rect';
      this.currentRectDiv.style.left = `${this.startX}px`;
      this.currentRectDiv.style.top = `${this.startY}px`;
      this.currentRectDiv.style.width = '0px';
      this.currentRectDiv.style.height = '0px';
      this.currentRectDiv.style.display = 'block';
      this.overlay.appendChild(this.currentRectDiv);

      this.overlay.classList.add('fw-drawing');
      this.updateDimming();
    });

    this.overlay.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDrawing || !this.currentRectDiv) return;

      // Always capture the latest coordinates on every move event
      this.latestX = e.clientX;
      this.latestY = e.clientY;

      // ⚡ Bolt: Throttling high-frequency DOM style updates during drawing using requestAnimationFrame
      // 🎯 Why: Prevents severe layout thrashing by ensuring styles are only updated once per render frame
      // 📊 Impact: Significantly smooths drawing performance and reduces CPU load on complex pages
      if (!this.isRafPending) {
        this.isRafPending = true;
        window.requestAnimationFrame(() => {
          if (!this.currentRectDiv) {
            this.isRafPending = false;
            return;
          }
          // Use the most recent coordinates captured from the event loop
          const width = Math.abs(this.latestX - this.startX);
          const height = Math.abs(this.latestY - this.startY);
          const left = Math.min(this.latestX, this.startX);
          const top = Math.min(this.latestY, this.startY);

          this.currentRectDiv.style.left = `${left}px`;
          this.currentRectDiv.style.top = `${top}px`;
          this.currentRectDiv.style.width = `${width}px`;
          this.currentRectDiv.style.height = `${height}px`;

          this.currentRectParams = { x: left, y: top, width, height };
          this.updateDimming();
          this.isRafPending = false;
        });
      }
    });

    this.overlay.addEventListener('mouseup', () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;

      document.body.style.userSelect = '';

      if (this.currentRectParams && this.currentRectParams.width > 20 && this.currentRectParams.height > 20) {
        const div = this.currentRectDiv!;
        const params = this.currentRectParams;
        const selectionObj = { div, params };
        this.rects.push(selectionObj);

        // Add close button
        const closeBtn = document.createElement('div');
        closeBtn.className = 'fw-selection-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.title = 'Remove selection';
        div.appendChild(closeBtn);

        closeBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            div.remove();
            this.rects = this.rects.filter(r => r !== selectionObj);
            this.updateDimming();
        });
      } else {
        if (this.currentRectDiv) this.currentRectDiv.remove();
      }
      this.currentRectParams = null;
      this.currentRectDiv = null;
      this.updateDimming();
    });
  }

  show() {
    this.overlay.style.display = 'block';
    document.body.style.userSelect = 'none'; // Prevent text selection
    this.updateDimming();
  }

  hide() {
    this.overlay.style.display = 'none';
  }

  reset() {
    this.hide();
    this.overlay.classList.remove('fw-drawing');
    Array.from(this.overlay.querySelectorAll('.fw-selection-rect')).forEach(el => el.remove());
    this.rects = [];
    this.currentRectParams = null;
    this.currentRectDiv = null;
    this.updateDimming();
  }
}
