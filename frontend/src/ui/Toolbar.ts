export type ToolbarMode = 'select' | 'comment';

export interface ToolbarCallbacks {
  onModeChanged: (mode: ToolbarMode) => void;
  onCancel: () => void;
  onConfirm: (fullPage: boolean) => void;
}

export class Toolbar {
  private container: HTMLDivElement;
  private selectBtn: HTMLButtonElement;
  private commentBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private confirmBtn: HTMLButtonElement;
  private togglePageBtn: HTMLButtonElement;
  private fullPage = false;

  private isDragging = false;
  private currentX = 0;
  private currentY = 0;
  private initialX = 0;
  private initialY = 0;
  private xOffset = 0;
  private yOffset = 0;
  private targetClientX = 0;
  private targetClientY = 0;

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
      z-index: 1000020;
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
    this.selectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-dasharray="3 3"></rect></svg>';

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

    this.confirmBtn = document.createElement('button');
    this.confirmBtn.title = 'Confirm Screenshot';
    this.confirmBtn.style.cssText = btnStyle + 'color: #38a169;';
    this.confirmBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    this.togglePageBtn = document.createElement('button');
    const updateToggleIcon = () => {
      if (this.fullPage) {
        this.togglePageBtn.title = 'Full Page (active) - Click to switch to Viewport';
        this.togglePageBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>';
        this.togglePageBtn.style.color = '#2b6cb0';
      } else {
        this.togglePageBtn.title = 'Viewport (active) - Click to switch to Full Page';
        this.togglePageBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
        this.togglePageBtn.style.color = '#2b6cb0';
      }
    };
    this.togglePageBtn.style.cssText = btnStyle;
    updateToggleIcon();

    this.container.appendChild(this.selectBtn);
    this.container.appendChild(this.commentBtn);
    this.container.appendChild(divider);
    this.container.appendChild(this.togglePageBtn); // Add toggle before actions
    this.container.appendChild(this.cancelBtn);
    this.container.appendChild(this.confirmBtn);

    document.body.appendChild(this.container);

    // Hover styles
    this.attachHover(this.selectBtn);
    this.attachHover(this.commentBtn);
    this.attachHover(this.cancelBtn, '#fed7d7');
    this.attachHover(this.confirmBtn, '#c6f6d5');
    this.attachHover(this.togglePageBtn);

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

    this.confirmBtn.addEventListener('click', () => {
      this.callbacks.onConfirm(this.fullPage);
      this.resetActiveBtn();
    });

    this.togglePageBtn.addEventListener('click', () => {
      this.fullPage = !this.fullPage;
      updateToggleIcon();
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

    // Store latest coordinates outside rAF to ensure the frame uses the most up-to-date position
    this.targetClientX = e.clientX;
    this.targetClientY = e.clientY;

    if (this.dragAnimationFrame === null) {
      this.dragAnimationFrame = window.requestAnimationFrame(() => {
        this.currentX = this.targetClientX - this.initialX;
        this.currentY = this.targetClientY - this.initialY;

        this.xOffset = this.currentX;
        this.yOffset = this.currentY;

        this.setTranslate(this.currentX, this.currentY, this.container);
        this.dragAnimationFrame = null;
      });
    }
  }

  private setTranslate(xPos: number, yPos: number, el: HTMLElement) {
    el.style.transform = `translate3d(calc(-50% + ${xPos}px), ${yPos}px, 0)`;
  }

  private dragAnimationFrame: number | null = null;

  private dragEnd() {
    this.initialX = this.currentX;
    this.initialY = this.currentY;
    this.isDragging = false;
    this.container.style.cursor = 'grab';
  }
}
