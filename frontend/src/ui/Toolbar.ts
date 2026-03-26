export type ToolbarMode = 'select' | 'comment';

export interface ToolbarCallbacks {
  onModeChanged: (mode: ToolbarMode) => void;
  onCancel: () => void;
}

export class Toolbar {
  private container: HTMLDivElement;
  private selectBtn: HTMLButtonElement;
  private commentBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;

  private isDragging = false;
  private currentX = 0;
  private currentY = 0;
  private initialX = 0;
  private initialY = 0;
  private xOffset = 0;
  private yOffset = 0;

  constructor(private callbacks: ToolbarCallbacks) {
    this.container = document.createElement('div');
    this.container.id = 'fw-toolbar';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: none;
      align-items: center;
      padding: 5px;
      z-index: 100000;
      gap: 5px;
      cursor: grab;
    `;

    // Add drag handle icon
    const dragHandle = document.createElement('div');
    dragHandle.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
    dragHandle.style.cssText = `
      padding: 5px;
      color: #718096;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    this.container.appendChild(dragHandle);

    const btnStyle = `
      background: transparent;
      border: none;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4a5568;
      transition: all 0.2s;
    `;

    this.selectBtn = document.createElement('button');
    this.selectBtn.title = 'Select Area';
    this.selectBtn.style.cssText = btnStyle;
    this.selectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';

    this.commentBtn = document.createElement('button');
    this.commentBtn.title = 'Add Comment';
    this.commentBtn.style.cssText = btnStyle;
    this.commentBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    const divider = document.createElement('div');
    divider.style.cssText = 'width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px;';

    this.cancelBtn = document.createElement('button');
    this.cancelBtn.title = 'Cancel Feedback';
    this.cancelBtn.style.cssText = btnStyle + 'color: #e53e3e;';
    this.cancelBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    this.container.appendChild(this.selectBtn);
    this.container.appendChild(this.commentBtn);
    this.container.appendChild(divider);
    this.container.appendChild(this.cancelBtn);

    document.body.appendChild(this.container);

    // Hover styles
    this.attachHover(this.selectBtn);
    this.attachHover(this.commentBtn);
    this.attachHover(this.cancelBtn, '#fed7d7');

    // Events
    this.selectBtn.addEventListener('click', () => {
      this.setActiveBtn(this.selectBtn);
      this.callbacks.onModeChanged('select');
    });

    this.commentBtn.addEventListener('click', () => {
      this.setActiveBtn(this.commentBtn);
      this.callbacks.onModeChanged('comment');
    });

    this.cancelBtn.addEventListener('click', () => {
      this.callbacks.onCancel();
      this.resetActiveBtn();
    });

    this.setupDragging();
  }

  private attachHover(btn: HTMLButtonElement, bg = '#edf2f7') {
    btn.addEventListener('mouseenter', () => {
      if (btn.style.backgroundColor !== '#e2e8f0') {
        btn.style.backgroundColor = bg;
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.style.backgroundColor !== '#e2e8f0') {
        btn.style.backgroundColor = 'transparent';
      }
    });
  }

  private setActiveBtn(activeBtn: HTMLButtonElement) {
    this.resetActiveBtn();
    activeBtn.style.backgroundColor = '#e2e8f0';
    activeBtn.style.color = '#2b6cb0';
  }

  resetActiveBtn() {
    this.selectBtn.style.backgroundColor = 'transparent';
    this.selectBtn.style.color = '#4a5568';
    this.commentBtn.style.backgroundColor = 'transparent';
    this.commentBtn.style.color = '#4a5568';
  }

  show() {
    this.container.style.display = 'flex';
  }

  hide() {
    this.container.style.display = 'none';
    this.resetActiveBtn();
  }

  // Dragging logic
  private setupDragging() {
    this.container.addEventListener('mousedown', this.dragStart.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.dragEnd.bind(this));
  }

  private dragStart(e: MouseEvent) {
    // Only drag if clicking the container or drag handle, not buttons
    if ((e.target as HTMLElement).closest('button')) return;

    this.initialX = e.clientX - this.xOffset;
    this.initialY = e.clientY - this.yOffset;
    this.isDragging = true;
    this.container.style.cursor = 'grabbing';
  }

  private drag(e: MouseEvent) {
    if (!this.isDragging) return;

    e.preventDefault();
    this.currentX = e.clientX - this.initialX;
    this.currentY = e.clientY - this.initialY;

    this.xOffset = this.currentX;
    this.yOffset = this.currentY;

    this.setTranslate(this.currentX, this.currentY, this.container);
  }

  private setTranslate(xPos: number, yPos: number, el: HTMLElement) {
    el.style.transform = `translate3d(calc(-50% + ${xPos}px), ${yPos}px, 0)`;
  }

  private dragEnd() {
    this.initialX = this.currentX;
    this.initialY = this.currentY;
    this.isDragging = false;
    this.container.style.cursor = 'grab';
  }
}
