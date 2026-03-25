"use strict";
(() => {
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/api.ts
  var APIClient = class {
    constructor(config) {
      this.config = config;
      this.baseUrl = config.endpoint.split("/api/feedback")[0];
    }
    fetchDefaults() {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}/api/jules/defaults`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });
    }
    fetchSources(refresh = false) {
      return __async(this, null, function* () {
        const url = `${this.baseUrl}/api/jules/sources${refresh ? "?refresh=true" : ""}`;
        const res = yield fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });
    }
    fetchPersonas() {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}/api/jules/personas`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });
    }
    analyzeFeedback(payload) {
      return __async(this, null, function* () {
        const res = yield fetch(this.config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        return res.json();
      });
    }
    sendToJules(payload) {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}/api/send-to-jules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        return res.json();
      });
    }
  };

  // src/ui/Trigger.ts
  var Trigger = class {
    constructor(onClickTrigger, onClickBadge) {
      this.triggerBtn = document.createElement("button");
      this.triggerBtn.id = "fw-trigger-btn";
      this.triggerBtn.innerText = "Feedback";
      document.body.appendChild(this.triggerBtn);
      this.minimizedBadge = document.createElement("button");
      this.minimizedBadge.id = "fw-minimized-badge";
      this.minimizedBadge.title = "Maximize feedback";
      this.minimizedBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>';
      document.body.appendChild(this.minimizedBadge);
      this.triggerBtn.addEventListener("click", onClickTrigger);
      this.minimizedBadge.addEventListener("click", onClickBadge);
    }
    showBadge() {
      this.minimizedBadge.style.display = "flex";
    }
    hideBadge() {
      this.minimizedBadge.style.display = "none";
    }
  };

  // src/ui/Overlay.ts
  var Overlay = class {
    constructor(onComplete) {
      this.isDrawing = false;
      this.startX = 0;
      this.startY = 0;
      this.rectParams = null;
      this.onComplete = onComplete;
      this.overlay = document.createElement("div");
      this.overlay.id = "fw-overlay";
      document.body.appendChild(this.overlay);
      this.selectionRect = document.createElement("div");
      this.selectionRect.id = "fw-selection-rect";
      this.overlay.appendChild(this.selectionRect);
      this.attachEvents();
    }
    attachEvents() {
      this.overlay.addEventListener("mousedown", (e) => {
        this.isDrawing = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.selectionRect.style.left = `${this.startX}px`;
        this.selectionRect.style.top = `${this.startY}px`;
        this.selectionRect.style.width = "0px";
        this.selectionRect.style.height = "0px";
        this.overlay.classList.add("fw-drawing");
      });
      this.overlay.addEventListener("mousemove", (e) => {
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
      this.overlay.addEventListener("mouseup", () => {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        document.body.style.userSelect = "";
        if (this.rectParams && this.rectParams.width > 10 && this.rectParams.height > 10) {
          this.onComplete(this.rectParams);
        } else {
          this.reset();
        }
      });
    }
    show() {
      this.overlay.style.display = "block";
      document.body.style.userSelect = "none";
    }
    hide() {
      this.overlay.style.display = "none";
    }
    reset() {
      this.hide();
      this.overlay.classList.remove("fw-drawing");
      this.selectionRect.style.width = "0px";
      this.selectionRect.style.height = "0px";
      this.rectParams = null;
    }
  };

  // src/ui/Modal.ts
  var Modal = class {
    constructor(callbacks) {
      this.callbacks = callbacks;
      this.isEditingPrompt = false;
      this.basePrompt = "";
      this.availableSources = [];
      this.configDefaults = { repos: [], branches: [], personas: [] };
      this.container = document.createElement("div");
      this.container.id = "fw-modal-container";
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
      this.closeBtn = this.container.querySelector(".fw-close-btn");
      this.minimizeBtn = this.container.querySelector(".fw-minimize-btn");
      this.cancelBtn = this.container.querySelector(".fw-btn-cancel");
      this.submitBtn = this.container.querySelector(".fw-btn-submit");
      this.previewImg = this.container.querySelector("#fw-screenshot-preview");
      this.textArea = this.container.querySelector("#fw-feedback-text");
      this.inputArea = this.container.querySelector("#fw-input-area");
      this.loadingArea = this.container.querySelector("#fw-loading-area");
      this.resultArea = this.container.querySelector("#fw-result-area");
      this.proposedPrompt = this.container.querySelector("#fw-proposed-prompt");
      this.editPromptBtn = this.container.querySelector("#fw-edit-prompt");
      this.successContainer = this.container.querySelector("#fw-success-container");
      this.repoSelect = this.container.querySelector("#fw-repo-select");
      this.branchSelect = this.container.querySelector("#fw-branch-select");
      this.personaSelect = this.container.querySelector("#fw-persona-select");
      this.refreshReposBtn = this.container.querySelector("#fw-refresh-sources");
      this.attachEvents();
    }
    attachEvents() {
      this.closeBtn.addEventListener("click", this.callbacks.onClose);
      this.cancelBtn.addEventListener("click", this.callbacks.onClose);
      this.minimizeBtn.addEventListener("click", this.callbacks.onMinimize);
      this.refreshReposBtn.addEventListener("click", this.callbacks.onRefreshSources);
      this.editPromptBtn.addEventListener("click", () => {
        this.isEditingPrompt = !this.isEditingPrompt;
        this.proposedPrompt.readOnly = !this.isEditingPrompt;
        if (this.isEditingPrompt) {
          this.proposedPrompt.focus();
          this.editPromptBtn.classList.add("fw-btn-active");
        } else {
          this.editPromptBtn.classList.remove("fw-btn-active");
        }
      });
      this.personaSelect.addEventListener("change", () => {
        if (!this.isEditingPrompt) {
          this.updatePromptPreview();
        }
      });
      this.repoSelect.addEventListener("change", () => {
        this.updateBranchOptions();
      });
      this.submitBtn.addEventListener("click", () => {
        if (this.submitBtn.innerText === "Analyze Feedback") {
          this.callbacks.onSubmitAnalyze(this.textArea.value, this.previewImg.src);
        } else if (this.submitBtn.innerText === "Send to Jules") {
          this.callbacks.onSubmitSend({
            sourceId: this.repoSelect.value,
            branch: this.branchSelect.value,
            persona: this.personaSelect.value,
            prompt: this.proposedPrompt.value
          });
        }
      });
    }
    setPreviewImage(dataUrl) {
      this.previewImg.src = dataUrl;
    }
    show() {
      this.container.style.display = "flex";
      this.textArea.focus();
    }
    hide() {
      this.container.style.display = "none";
    }
    minimize() {
      this.container.style.visibility = "hidden";
      this.container.style.pointerEvents = "none";
    }
    maximize() {
      this.container.style.visibility = "visible";
      this.container.style.pointerEvents = "auto";
    }
    reset() {
      this.hide();
      this.textArea.value = "";
      this.previewImg.src = "";
      this.basePrompt = "";
      this.container.style.visibility = "";
      this.container.style.pointerEvents = "";
      this.inputArea.style.display = "block";
      this.loadingArea.style.display = "none";
      this.resultArea.style.display = "none";
      this.submitBtn.innerText = "Analyze Feedback";
      this.submitBtn.disabled = false;
      this.submitBtn.style.display = "inline-block";
      this.cancelBtn.innerText = "Cancel";
      this.cancelBtn.style.display = "inline-block";
      this.successContainer.innerHTML = "";
    }
    setLoading() {
      this.submitBtn.disabled = true;
      this.inputArea.style.display = "none";
      this.loadingArea.style.display = "flex";
      this.cancelBtn.style.display = "none";
    }
    setResult(prompt) {
      this.basePrompt = prompt;
      this.updatePromptPreview();
      this.loadingArea.style.display = "none";
      this.resultArea.style.display = "flex";
      this.submitBtn.innerText = "Send to Jules";
      this.submitBtn.disabled = false;
      this.cancelBtn.style.display = "inline-block";
    }
    setSending() {
      this.submitBtn.innerText = "Sending...";
      this.submitBtn.disabled = true;
    }
    setSuccess() {
      this.successContainer.innerHTML = '<div class="fw-success-msg">Success! Jules has started the task.</div>';
      this.submitBtn.style.display = "none";
      this.cancelBtn.innerText = "Close";
    }
    setFailed(isAnalyze) {
      if (isAnalyze) {
        this.reset();
      } else {
        this.submitBtn.innerText = "Send to Jules";
        this.submitBtn.disabled = false;
      }
    }
    setRefreshSpinning(spinning) {
      if (spinning) {
        this.refreshReposBtn.classList.add("fw-refresh-spinning");
      } else {
        this.refreshReposBtn.classList.remove("fw-refresh-spinning");
      }
    }
    setConfigDefaults(defaults) {
      this.configDefaults = defaults;
    }
    setSources(sources) {
      this.availableSources = sources;
      const defaults = [];
      const others = [];
      if (this.configDefaults.repos) {
        this.configDefaults.repos.forEach((repoId) => {
          const found = sources.find((s) => s.name.replace("sources/", "") === repoId);
          if (found) defaults.push(found);
        });
      }
      if (this.configDefaults.repos) {
        sources.forEach((s) => {
          const id = s.name.replace("sources/", "");
          if (!this.configDefaults.repos.includes(id)) {
            others.push(s);
          }
        });
      } else {
        sources.forEach((s) => others.push(s));
      }
      others.sort((a, b) => {
        const idA = a.name.replace("sources/", "");
        const labelA = a.githubRepo ? `${a.githubRepo.owner}/${a.githubRepo.repo}` : idA;
        const idB = b.name.replace("sources/", "");
        const labelB = b.githubRepo ? `${b.githubRepo.owner}/${b.githubRepo.repo}` : idB;
        return labelA.localeCompare(labelB);
      });
      let html = defaults.map((s) => {
        const id = s.name.replace("sources/", "");
        const label = s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : id;
        return `<option value="${id}">${label}</option>`;
      }).join("");
      if (defaults.length > 0 && others.length > 0) {
        html += "<option disabled>\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500</option>";
      }
      html += others.map((s) => {
        const id = s.name.replace("sources/", "");
        const label = s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : id;
        return `<option value="${id}">${label}</option>`;
      }).join("");
      this.repoSelect.innerHTML = html;
      this.updateBranchOptions();
    }
    setSourcesError() {
      this.repoSelect.innerHTML = '<option value="">Error loading sources</option>';
    }
    setPersonas(personas) {
      const defaults = [];
      const others = [];
      if (this.configDefaults.personas) {
        this.configDefaults.personas.forEach((personaName) => {
          const found = personas.find((p) => p === personaName);
          if (found) defaults.push(found);
        });
      }
      if (this.configDefaults.personas) {
        personas.forEach((p) => {
          if (!this.configDefaults.personas.includes(p)) {
            others.push(p);
          }
        });
      } else {
        personas.forEach((p) => others.push(p));
      }
      others.sort((a, b) => a.localeCompare(b));
      let html = defaults.map((p) => {
        return `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`;
      }).join("");
      if (defaults.length > 0 && others.length > 0) {
        html += "<option disabled>\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500</option>";
      }
      html += others.map((p) => {
        return `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`;
      }).join("");
      this.personaSelect.innerHTML = html;
    }
    setPersonasError() {
      this.personaSelect.innerHTML = '<option value="">Error loading personas</option>';
    }
    updateBranchOptions() {
      const selectedId = this.repoSelect.value;
      const source = this.availableSources.find((s) => s.name.replace("sources/", "") === selectedId);
      if (!source || !source.githubRepo) {
        this.branchSelect.innerHTML = '<option value="dev">dev (default)</option>';
        return;
      }
      const branches = source.githubRepo.branches || [];
      const defaultBranch = source.githubRepo.defaultBranch ? source.githubRepo.defaultBranch.displayName : "dev";
      if (branches.length === 0) {
        this.branchSelect.innerHTML = `<option value="${defaultBranch}">${defaultBranch}</option>`;
        return;
      }
      const defaults = [];
      const others = [];
      if (this.configDefaults.branches) {
        this.configDefaults.branches.forEach((branchName) => {
          const found = branches.find((b) => b.displayName === branchName);
          if (found) defaults.push(found);
        });
      }
      if (this.configDefaults.branches) {
        branches.forEach((b) => {
          const name = b.displayName;
          if (!this.configDefaults.branches.includes(name)) {
            others.push(b);
          }
        });
      } else {
        branches.forEach((b) => others.push(b));
      }
      others.sort((a, b) => a.displayName.localeCompare(b.displayName));
      let html = defaults.map((b) => {
        const name = b.displayName;
        return `<option value="${name}" ${name === defaultBranch ? "selected" : ""}>${name}${name === defaultBranch ? " (default)" : ""}</option>`;
      }).join("");
      if (defaults.length > 0 && others.length > 0) {
        html += "<option disabled>\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500</option>";
      }
      html += others.map((b) => {
        const name = b.displayName;
        return `<option value="${name}" ${name === defaultBranch ? "selected" : ""}>${name}${name === defaultBranch ? " (default)" : ""}</option>`;
      }).join("");
      this.branchSelect.innerHTML = html;
    }
    updatePromptPreview() {
      const persona = this.personaSelect.value;
      if (persona) {
        this.proposedPrompt.value = `You are the ${persona}. Read AGENTS.md first. ${this.basePrompt}`;
      } else {
        this.proposedPrompt.value = this.basePrompt;
      }
    }
  };

  // src/utils/screenshot.ts
  var ScreenshotUtil = class {
    constructor() {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
    captureSelection(rect) {
      return __async(this, null, function* () {
        if (typeof htmlToImage === "undefined") {
          throw new Error("html-to-image is still loading or failed to load. Please try again in a moment.");
        }
        console.log("[FEEDBACK-WIDGET] Starting screenshot capture with html-to-image...");
        const capturingToast = document.createElement("div");
        capturingToast.innerText = "Capturing...";
        capturingToast.style.cssText = "position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:20px;z-index:9999999;";
        document.body.appendChild(capturingToast);
        try {
          const dataUrl = yield htmlToImage.toPng(document.body, {
            backgroundColor: "#ffffff",
            pixelRatio: 1,
            cacheBust: true,
            filter: (node) => {
              if (node.tagName === "SCRIPT") return false;
              if (node.id && node.id.startsWith("fw-")) return false;
              return true;
            }
          });
          console.log("[FEEDBACK-WIDGET] Capture success. dataUrl length:", dataUrl.length);
          if (!dataUrl || !dataUrl.startsWith("data:image/")) {
            console.error("[FEEDBACK-WIDGET] Captured invalid dataUrl type:", dataUrl.substring(0, 100));
            throw new Error("Captured data is not an image. It might be an error page or blocked resource.");
          }
          return yield new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              console.log("[FEEDBACK-WIDGET] Rendering selection overlay...");
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              const rx = rect.x + window.scrollX;
              const ry = rect.y + window.scrollY;
              const rw = rect.width;
              const rh = rect.height;
              ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
              ctx.fillRect(0, 0, canvas.width, ry);
              ctx.fillRect(0, ry + rh, canvas.width, canvas.height - (ry + rh));
              ctx.fillRect(0, ry, rx, rh);
              ctx.fillRect(rx + rw, ry, canvas.width - (rx + rw), rh);
              ctx.strokeStyle = "#ff0000";
              ctx.lineWidth = 2;
              ctx.strokeRect(rx, ry, rw, rh);
              const finalDataUrl = canvas.toDataURL("image/png");
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
        } catch (err) {
          console.error("[FEEDBACK-WIDGET] Capture pipeline failed:", err);
          if (document.body.contains(capturingToast)) {
            document.body.removeChild(capturingToast);
          }
          throw new Error(err.message || "Unknown error");
        }
      });
    }
  };

  // src/index.ts
  (function() {
    const config = window.FEEDBACK_WIDGET_CONFIG || { endpoint: "http://localhost:12345/api/feedback" };
    const api = new APIClient(config);
    const screenshotUtil = new ScreenshotUtil();
    let currentFeedbackDir = null;
    const trigger = new Trigger(
      () => {
        modal.reset();
        overlay.show();
      },
      () => {
        modal.maximize();
        trigger.hideBadge();
      }
    );
    const modal = new Modal({
      onClose: () => {
        modal.reset();
        trigger.hideBadge();
        currentFeedbackDir = null;
      },
      onMinimize: () => {
        modal.minimize();
        trigger.showBadge();
      },
      onSubmitAnalyze: (text, screenshotUrl) => __async(null, null, function* () {
        modal.setLoading();
        const metadata = {
          url: window.location.href,
          pathname: window.location.pathname,
          hostname: window.location.hostname,
          pageTitle: document.title,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        const payload = {
          text,
          screenshot: screenshotUrl,
          metadata
        };
        try {
          const data = yield api.analyzeFeedback(payload);
          if (data.error) throw new Error(data.error);
          currentFeedbackDir = data.feedbackDir || null;
          modal.setResult(data.prompt || "");
        } catch (err) {
          console.error("Analysis failed:", err);
          alert("Analysis failed. See console.");
          modal.setFailed(true);
        }
      }),
      onSubmitSend: (payload) => __async(null, null, function* () {
        modal.setSending();
        const julesPayload = {
          feedbackDir: currentFeedbackDir,
          sourceId: payload.sourceId,
          branch: payload.branch,
          persona: payload.persona,
          prompt: payload.prompt
        };
        try {
          yield api.sendToJules(julesPayload);
          modal.setSuccess();
        } catch (err) {
          console.error("Jules trigger failed:", err);
          alert("Failed to trigger Jules.");
          modal.setFailed(false);
        }
      }),
      onRefreshSources: () => {
        fetchSources(true);
      }
    });
    const overlay = new Overlay((rect) => {
      processSelection(rect);
    });
    function processSelection(rect) {
      return __async(this, null, function* () {
        modal.maximize();
        trigger.hideBadge();
        overlay.hide();
        try {
          const dataUrl = yield screenshotUtil.captureSelection(rect);
          modal.setPreviewImage(dataUrl);
          modal.show();
        } catch (err) {
          alert("Screenshot capture failed. Error: " + err.message);
        } finally {
          overlay.reset();
        }
      });
    }
    function initData() {
      return __async(this, null, function* () {
        try {
          const defaults = yield api.fetchDefaults();
          modal.setConfigDefaults(defaults);
          fetchSources();
          fetchPersonas();
        } catch (err) {
          console.error("Failed to init defaults:", err);
        }
      });
    }
    function fetchSources(refresh = false) {
      return __async(this, null, function* () {
        modal.setRefreshSpinning(true);
        try {
          const data = yield api.fetchSources(refresh);
          modal.setSources(data.sources || []);
        } catch (err) {
          console.error("Failed to fetch sources:", err);
          modal.setSourcesError();
        } finally {
          modal.setRefreshSpinning(false);
        }
      });
    }
    function fetchPersonas() {
      return __async(this, null, function* () {
        try {
          const data = yield api.fetchPersonas();
          modal.setPersonas(data.personas || []);
        } catch (err) {
          console.error("Failed to fetch personas:", err);
          modal.setPersonasError();
        }
      });
    }
    initData();
  })();
})();
