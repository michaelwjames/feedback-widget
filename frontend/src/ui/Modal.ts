import { Source, DefaultsResponse } from '../types';

export interface ModalCallbacks {
  onClose: () => void;
  onMinimize: () => void;
  onSubmitAnalyze: (text: string, screenshotUrl: string) => void;
  onSubmitSend: (payload: { sourceId: string; branch: string; persona: string; prompt: string }) => void;
  onRefreshSources: () => void;
  onLogin: (password: string) => void;
  onDownload: () => void;
}

export class Modal {
  private container: HTMLDivElement;
  private previewImg: HTMLImageElement;
  private textArea: HTMLTextAreaElement;
  private closeBtn: HTMLButtonElement;
  private minimizeBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private submitBtn: HTMLButtonElement;
  private inputArea: HTMLDivElement;
  private loadingArea: HTMLDivElement;
  private resultArea: HTMLDivElement;
  private loginArea: HTMLDivElement;
  private passwordInput: HTMLInputElement;
  private loginError: HTMLDivElement;
  private proposedPrompt: HTMLTextAreaElement;
  private editPromptBtn: HTMLButtonElement;
  private successContainer: HTMLDivElement;
  private repoSelect: HTMLSelectElement;
  private branchSelect: HTMLSelectElement;
  private personaSelect: HTMLSelectElement;
  private refreshReposBtn: HTMLButtonElement;
  private downloadBtn: HTMLButtonElement;

  private isEditingPrompt = false;
  private basePrompt = '';
  private availableSources: Source[] = [];
  private configDefaults: DefaultsResponse = { repos: [], branches: [], personas: [] };

  constructor(private callbacks: ModalCallbacks) {
    this.container = document.createElement('div');
    this.container.id = 'fw-modal-container';
    this.container.innerHTML = `
        <div id="fw-modal">
            <div class="fw-modal-header">
                <h2>Feedback Agent</h2>
                <div class="fw-modal-actions">
                    <button class="fw-minimize-btn" title="Minimize">&minus;</button>
                    <button class="fw-close-btn" title="Close">&times;</button>
                </div>
            </div>
            <div class="fw-modal-body">
                <div id="fw-login-area">
                    <h3>Authentication Required</h3>
                    <p>Enter the widget password to continue.</p>
                    <input type="password" id="fw-password-input" placeholder="Password..." />
                    <div id="fw-login-error">Invalid password. Please try again.</div>
                </div>

                <div id="fw-input-area">
                    <img id="fw-screenshot-preview" src="" alt="Screenshot preview" />
                    <textarea id="fw-feedback-text" placeholder="Explain the issue or feedback..."></textarea>
                </div>

                <div id="fw-loading-area">
                    <div class="fw-spinner"></div>
                    <div id="fw-loading-text">Groq is analyzing your feedback...</div>
                </div>

                <div id="fw-result-area">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div style="font-size: 14px; color: #4a5568; font-weight: bold;">Proposed Prompt for Jules:</div>
                        <button id="fw-edit-prompt" class="fw-icon-btn" title="Edit prompt">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                    </div>
                    <textarea id="fw-proposed-prompt" readonly></textarea>

                    <div class="fw-field-group">
                        <label class="fw-field-label">Target Repository</label>
                        <div class="fw-input-container">
                            <select id="fw-repo-select" class="fw-select">
                                <option value="">Loading sources...</option>
                            </select>
                            <button id="fw-refresh-sources" class="fw-refresh-btn" title="Refresh repositories">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            </button>
                        </div>
                    </div>

                    <div class="fw-field-group">
                        <label class="fw-field-label">Target Branch</label>
                        <select id="fw-branch-select" class="fw-select">
                            <option value="">Select a repository first</option>
                        </select>
                    </div>

                    <div class="fw-field-group">
                        <label class="fw-field-label">Agent Persona</label>
                        <div class="fw-input-container">
                            <select id="fw-persona-select" class="fw-select">
                                <option value="">Loading personas...</option>
                            </select>
                        </div>
                    </div>

                    <button id="fw-download-zip" class="fw-btn fw-btn-secondary" style="margin-top: 10px; width: 100%;">Download Feedback as ZIP</button>
                    <div id="fw-success-container"></div>
                </div>
            </div>
            <div class="fw-modal-footer">
                <button class="fw-btn fw-btn-cancel">Cancel</button>
                <button class="fw-btn fw-btn-submit">Analyze Feedback</button>
            </div>
        </div>
    `;
    document.body.appendChild(this.container);

    this.closeBtn = this.container.querySelector('.fw-close-btn') as HTMLButtonElement;
    this.minimizeBtn = this.container.querySelector('.fw-minimize-btn') as HTMLButtonElement;
    this.cancelBtn = this.container.querySelector('.fw-btn-cancel') as HTMLButtonElement;
    this.submitBtn = this.container.querySelector('.fw-btn-submit') as HTMLButtonElement;
    this.previewImg = this.container.querySelector('#fw-screenshot-preview') as HTMLImageElement;
    this.textArea = this.container.querySelector('#fw-feedback-text') as HTMLTextAreaElement;

    this.loginArea = this.container.querySelector('#fw-login-area') as HTMLDivElement;
    this.passwordInput = this.container.querySelector('#fw-password-input') as HTMLInputElement;
    this.loginError = this.container.querySelector('#fw-login-error') as HTMLDivElement;

    this.inputArea = this.container.querySelector('#fw-input-area') as HTMLDivElement;
    this.loadingArea = this.container.querySelector('#fw-loading-area') as HTMLDivElement;
    this.resultArea = this.container.querySelector('#fw-result-area') as HTMLDivElement;
    this.proposedPrompt = this.container.querySelector('#fw-proposed-prompt') as HTMLTextAreaElement;
    this.editPromptBtn = this.container.querySelector('#fw-edit-prompt') as HTMLButtonElement;
    this.successContainer = this.container.querySelector('#fw-success-container') as HTMLDivElement;
    this.repoSelect = this.container.querySelector('#fw-repo-select') as HTMLSelectElement;
    this.branchSelect = this.container.querySelector('#fw-branch-select') as HTMLSelectElement;
    this.personaSelect = this.container.querySelector('#fw-persona-select') as HTMLSelectElement;
    this.refreshReposBtn = this.container.querySelector('#fw-refresh-sources') as HTMLButtonElement;
    this.downloadBtn = this.container.querySelector('#fw-download-zip') as HTMLButtonElement;

    this.attachEvents();
  }

  private attachEvents() {
    this.closeBtn.addEventListener('click', this.callbacks.onClose);
    this.cancelBtn.addEventListener('click', this.callbacks.onClose);
    this.minimizeBtn.addEventListener('click', this.callbacks.onMinimize);
    this.refreshReposBtn.addEventListener('click', this.callbacks.onRefreshSources);
    this.downloadBtn.addEventListener('click', this.callbacks.onDownload);

    this.editPromptBtn.addEventListener('click', () => {
        this.isEditingPrompt = !this.isEditingPrompt;
        this.proposedPrompt.readOnly = !this.isEditingPrompt;
        if (this.isEditingPrompt) {
            this.proposedPrompt.focus();
            this.editPromptBtn.classList.add('fw-btn-active');
        } else {
            this.editPromptBtn.classList.remove('fw-btn-active');
        }
    });

    this.personaSelect.addEventListener('change', () => {
        if (!this.isEditingPrompt) {
            this.updatePromptPreview();
        }
    });

    this.repoSelect.addEventListener('change', () => {
        this.updateBranchOptions();
    });

    this.submitBtn.addEventListener('click', () => {
        if (this.submitBtn.innerText === 'Login') {
            this.callbacks.onLogin(this.passwordInput.value);
        } else if (this.submitBtn.innerText === 'Analyze Feedback') {
            this.callbacks.onSubmitAnalyze(this.textArea.value, this.previewImg.src);
        } else if (this.submitBtn.innerText === 'Send to Jules') {
            this.callbacks.onSubmitSend({
                sourceId: this.repoSelect.value,
                branch: this.branchSelect.value,
                persona: this.personaSelect.value,
                prompt: this.proposedPrompt.value
            });
        }
    });
  }

  setLoginRequired() {
    this.container.style.display = 'flex';
    this.loginArea.style.display = 'flex';
    this.inputArea.style.display = 'none';
    this.loadingArea.style.display = 'none';
    this.resultArea.style.display = 'none';
    this.submitBtn.innerText = 'Login';
    this.submitBtn.disabled = false;
    this.submitBtn.style.display = 'inline-block';
    this.passwordInput.value = '';
    this.passwordInput.focus();
  }

  setLoginError(show: boolean) {
    this.loginError.style.display = show ? 'block' : 'none';
  }

  setPreviewImage(dataUrl: string) {
    this.previewImg.src = dataUrl;
  }

  show() {
    this.container.style.display = 'flex';
    if (this.loginArea.style.display !== 'flex') {
        this.textArea.focus();
    }
  }

  hide() {
    this.container.style.display = 'none';
  }

  minimize() {
    this.container.style.visibility = 'hidden';
    this.container.style.pointerEvents = 'none';
  }

  maximize() {
    this.container.style.visibility = 'visible';
    this.container.style.pointerEvents = 'auto';
  }

  reset() {
    this.hide();
    this.textArea.value = '';
    this.previewImg.src = '';
    this.basePrompt = '';
    this.passwordInput.value = '';
    this.loginError.style.display = 'none';

    this.container.style.visibility = '';
    this.container.style.pointerEvents = '';

    this.loginArea.style.display = 'none';
    this.inputArea.style.display = 'block';
    this.loadingArea.style.display = 'none';
    this.resultArea.style.display = 'none';

    this.submitBtn.innerText = 'Analyze Feedback';
    this.submitBtn.disabled = false;
    this.submitBtn.style.display = 'inline-block';
    this.cancelBtn.innerText = 'Cancel';
    this.cancelBtn.style.display = 'inline-block';
    this.successContainer.innerHTML = '';
  }


  setLoading() {
    this.submitBtn.disabled = true;
    this.inputArea.style.display = 'none';
    this.loadingArea.style.display = 'flex';
    this.cancelBtn.style.display = 'none';
  }

  setResult(prompt: string) {
    this.basePrompt = prompt;
    this.updatePromptPreview();

    this.loadingArea.style.display = 'none';
    this.resultArea.style.display = 'flex';

    this.submitBtn.innerText = 'Send to Jules';
    this.submitBtn.disabled = false;
    this.cancelBtn.style.display = 'inline-block';
  }

  setSending() {
    this.submitBtn.innerText = 'Sending...';
    this.submitBtn.disabled = true;
  }

  setSuccess() {
    this.successContainer.innerHTML = '<div class="fw-success-msg">Success! Jules has started the task.</div>';
    this.submitBtn.style.display = 'none';
    this.cancelBtn.innerText = 'Close';
  }

  setFailed(isAnalyze: boolean) {
    if (isAnalyze) {
      this.reset();
    } else {
      this.submitBtn.innerText = 'Send to Jules';
      this.submitBtn.disabled = false;
    }
  }

  setRefreshSpinning(spinning: boolean) {
    if (spinning) {
      this.refreshReposBtn.classList.add('fw-refresh-spinning');
    } else {
      this.refreshReposBtn.classList.remove('fw-refresh-spinning');
    }
  }

  setConfigDefaults(defaults: DefaultsResponse) {
    this.configDefaults = defaults;
  }

  setSources(sources: Source[]) {
    this.availableSources = sources;

    const defaults: Source[] = [];
    const others: Source[] = [];

    if (this.configDefaults.repos) {
      this.configDefaults.repos.forEach(repoId => {
          const found = sources.find(s => s.name.replace('sources/', '') === repoId);
          if (found) defaults.push(found);
      });
    }

    if (this.configDefaults.repos) {
      sources.forEach(s => {
          const id = s.name.replace('sources/', '');
          if (!this.configDefaults.repos.includes(id)) {
              others.push(s);
          }
      });
    } else {
      sources.forEach(s => others.push(s));
    }

    others.sort((a, b) => {
        const idA = a.name.replace('sources/', '');
        const labelA = a.githubRepo ? `${a.githubRepo.owner}/${a.githubRepo.repo}` : idA;
        const idB = b.name.replace('sources/', '');
        const labelB = b.githubRepo ? `${b.githubRepo.owner}/${b.githubRepo.repo}` : idB;
        return labelA.localeCompare(labelB);
    });

    let html = defaults.map(s => {
        const id = s.name.replace('sources/', '');
        const label = s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : id;
        return `<option value="${id}">${label}</option>`;
    }).join('');

    if (defaults.length > 0 && others.length > 0) {
        html += '<option disabled>──────────</option>';
    }

    html += others.map(s => {
        const id = s.name.replace('sources/', '');
        const label = s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : id;
        return `<option value="${id}">${label}</option>`;
    }).join('');

    this.repoSelect.innerHTML = html;
    this.updateBranchOptions();
  }

  setSourcesError() {
    this.repoSelect.innerHTML = '<option value="">Error loading sources</option>';
  }

  setPersonas(personas: string[]) {
    const defaults: string[] = [];
    const others: string[] = [];

    if (this.configDefaults.personas) {
      this.configDefaults.personas.forEach(personaName => {
          const found = personas.find(p => p === personaName);
          if (found) defaults.push(found);
      });
    }

    if (this.configDefaults.personas) {
      personas.forEach(p => {
          if (!this.configDefaults.personas.includes(p)) {
              others.push(p);
          }
      });
    } else {
      personas.forEach(p => others.push(p));
    }

    others.sort((a, b) => a.localeCompare(b));

    let html = defaults.map(p => {
        return `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`;
    }).join('');

    if (defaults.length > 0 && others.length > 0) {
        html += '<option disabled>──────────</option>';
    }

    html += others.map(p => {
        return `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`;
    }).join('');

    this.personaSelect.innerHTML = html;
  }

  setPersonasError() {
    this.personaSelect.innerHTML = '<option value="">Error loading personas</option>';
  }

  private updateBranchOptions() {
    const selectedId = this.repoSelect.value;
    const source = this.availableSources.find(s => s.name.replace('sources/', '') === selectedId);

    if (!source || !source.githubRepo) {
        this.branchSelect.innerHTML = '<option value="dev">dev (default)</option>';
        return;
    }

    const branches = source.githubRepo.branches || [];
    const defaultBranch = source.githubRepo.defaultBranch ? source.githubRepo.defaultBranch.displayName : 'dev';

    if (branches.length === 0) {
        this.branchSelect.innerHTML = `<option value="${defaultBranch}">${defaultBranch}</option>`;
        return;
    }

    const defaults: any[] = [];
    const others: any[] = [];

    if (this.configDefaults.branches) {
      this.configDefaults.branches.forEach(branchName => {
          const found = branches.find(b => b.displayName === branchName);
          if (found) defaults.push(found);
      });
    }

    if (this.configDefaults.branches) {
      branches.forEach(b => {
          const name = b.displayName;
          if (!this.configDefaults.branches.includes(name)) {
              others.push(b);
          }
      });
    } else {
      branches.forEach(b => others.push(b));
    }

    others.sort((a, b) => a.displayName.localeCompare(b.displayName));

    let html = defaults.map(b => {
        const name = b.displayName;
        return `<option value="${name}" ${name === defaultBranch ? 'selected' : ''}>${name}${name === defaultBranch ? ' (default)' : ''}</option>`;
    }).join('');

    if (defaults.length > 0 && others.length > 0) {
        html += '<option disabled>──────────</option>';
    }

    html += others.map(b => {
        const name = b.displayName;
        return `<option value="${name}" ${name === defaultBranch ? 'selected' : ''}>${name}${name === defaultBranch ? ' (default)' : ''}</option>`;
    }).join('');

    this.branchSelect.innerHTML = html;
  }

  private updatePromptPreview() {
    const persona = this.personaSelect.value;
    if (persona) {
        this.proposedPrompt.value = `You are the ${persona}. Read AGENTS.md first. ${this.basePrompt}`;
    } else {
        this.proposedPrompt.value = this.basePrompt;
    }
  }
}
