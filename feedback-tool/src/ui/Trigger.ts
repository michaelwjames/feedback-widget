export class Trigger {
  private triggerBtn: HTMLButtonElement;
  private minimizedBadge: HTMLButtonElement;

  constructor(onClickTrigger: () => void, onClickBadge: () => void) {
    // Inject the Feedback button
    this.triggerBtn = document.createElement('button');
    this.triggerBtn.id = 'fw-trigger-btn';
    this.triggerBtn.innerText = 'Feedback';
    document.body.appendChild(this.triggerBtn);

    // Minimized Toggle (Box icon)
    this.minimizedBadge = document.createElement('button');
    this.minimizedBadge.id = 'fw-minimized-badge';
    this.minimizedBadge.title = 'Maximize feedback';
    this.minimizedBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>';
    document.body.appendChild(this.minimizedBadge);

    this.triggerBtn.addEventListener('click', onClickTrigger);
    this.minimizedBadge.addEventListener('click', onClickBadge);
  }

  showBadge() {
    this.minimizedBadge.style.display = 'flex';
  }

  hideBadge() {
    this.minimizedBadge.style.display = 'none';
  }
}
