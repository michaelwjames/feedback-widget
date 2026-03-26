import { FeedbackComment } from '../types';

export class CommentOverlay {
  private overlay: HTMLDivElement;
  private comments: FeedbackComment[] = [];
  private currentCommentCount = 0;
  private activeInput: HTMLDivElement | null = null;
  private isActive = false;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'fw-comment-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000010;
      display: none;
      cursor: crosshair;
    `;
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (!this.isActive || e.target !== this.overlay) return;
      this.placeMarker(e.clientX, e.clientY);
    });
  }

  show() {
    this.isActive = true;
    this.overlay.style.display = 'block';
  }

  hide() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    if (this.activeInput) {
      this.activeInput.remove();
      this.activeInput = null;
    }
  }

  reset() {
    this.hide();
    this.comments = [];
    this.currentCommentCount = 0;

    // Remove all markers
    document.querySelectorAll('.fw-comment-marker, .fw-comment-input').forEach(el => el.remove());
  }

  getComments(): FeedbackComment[] {
    return this.comments;
  }

  private placeMarker(x: number, y: number) {
    if (this.activeInput) {
      // If there's already an active input, save or cancel it before placing another
      const inputEl = this.activeInput.querySelector('input') as HTMLInputElement;
      if (inputEl && inputEl.value.trim() !== '') {
        this.saveCommentFromInput();
      } else {
        // Cancel the current empty input and the last marker placed
        this.activeInput.remove();
        this.activeInput = null;

        // Remove the orphan marker
        const lastMarker = document.getElementById(`fw-comment-marker-${this.currentCommentCount}`);
        if (lastMarker) lastMarker.remove();
        this.currentCommentCount--;
      }
    }

    this.currentCommentCount++;
    const num = this.currentCommentCount;

    // Create Marker
    const marker = document.createElement('div');
    marker.className = 'fw-comment-marker';
    marker.id = `fw-comment-marker-${num}`;
    marker.innerText = num.toString();
    marker.style.cssText = `
      position: fixed;
      top: ${y}px;
      left: ${x}px;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;
      background: #fff;
      border: 3px solid #e53e3e;
      border-radius: 50%;
      color: #e53e3e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 18px;
      z-index: 1000011;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(marker);

    // Create Input Box
    this.activeInput = document.createElement('div');
    this.activeInput.className = 'fw-comment-input';
    this.activeInput.style.cssText = `
      position: fixed;
      top: ${y}px;
      left: ${x + 24}px;
      transform: translateY(-50%);
      background: white;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      padding: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      z-index: 1000011;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Details for #${num}...`;
    input.style.cssText = `
      border: none;
      outline: none;
      padding: 4px 8px;
      font-size: 14px;
      width: 200px;
    `;
    input.dataset.num = num.toString();
    input.dataset.x = x.toString();
    input.dataset.y = y.toString();

    const saveBtn = document.createElement('button');
    saveBtn.innerText = 'Save';
    saveBtn.style.cssText = `
      background: #3182ce;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
    `;

    this.activeInput.appendChild(input);
    this.activeInput.appendChild(saveBtn);
    document.body.appendChild(this.activeInput);

    // Focus input immediately
    input.focus();

    // Event Listeners for Input
    saveBtn.addEventListener('click', () => this.saveCommentFromInput());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveCommentFromInput();
      } else if (e.key === 'Escape') {
        // Cancel logic
        this.activeInput?.remove();
        this.activeInput = null;
        marker.remove();
        this.currentCommentCount--;
      }
    });
  }

  private saveCommentFromInput() {
    if (!this.activeInput) return;

    const input = this.activeInput.querySelector('input') as HTMLInputElement;
    const text = input.value.trim();

    if (text) {
      this.comments.push({
        number: parseInt(input.dataset.num!),
        text: text,
        x: parseInt(input.dataset.x!),
        y: parseInt(input.dataset.y!)
      });
      this.activeInput.remove();
      this.activeInput = null;
    } else {
      // If empty and try to save, treat as cancel
      const num = parseInt(input.dataset.num!);
      this.activeInput.remove();
      this.activeInput = null;
      document.getElementById(`fw-comment-marker-${num}`)?.remove();
      this.currentCommentCount--;
    }
  }
}
