"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
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
      __publicField(this, "config");
      __publicField(this, "baseUrl");
      this.config = config;
      this.baseUrl = config.endpoint.split("/api/feedback")[0];
    }
    checkAuth() {
      return __async(this, null, function* () {
        try {
          const res = yield fetch(`${this.baseUrl}/api/auth/check`, { credentials: "include" });
          return res.ok;
        } catch (e) {
          return false;
        }
      });
    }
    login(password) {
      return __async(this, null, function* () {
        try {
          const res = yield fetch(`${this.baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
            credentials: "include"
          });
          return res.ok;
        } catch (e) {
          return false;
        }
      });
    }
    fetchDefaults() {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}/api/jules/defaults`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });
    }
    fetchSources(refresh = false) {
      return __async(this, null, function* () {
        const url = `${this.baseUrl}/api/jules/sources${refresh ? "?refresh=true" : ""}`;
        const res = yield fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });
    }
    fetchPersonas() {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}/api/jules/personas`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });
    }
    analyzeFeedback(payload) {
      return __async(this, null, function* () {
        const res = yield fetch(this.config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });
        return res.json();
      });
    }
    sendToJules(payload) {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}/api/send-to-jules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });
        return res.json();
      });
    }
  };

  // src/ui/Trigger.ts
  var Trigger = class {
    constructor(onClickTrigger, onClickBadge) {
      __publicField(this, "triggerBtn");
      __publicField(this, "minimizedBadge");
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

  // src/ui/Toolbar.ts
  var Toolbar = class {
    constructor(callbacks) {
      this.callbacks = callbacks;
      __publicField(this, "container");
      __publicField(this, "selectBtn");
      __publicField(this, "commentBtn");
      __publicField(this, "cancelBtn");
      __publicField(this, "isDragging", false);
      __publicField(this, "currentX", 0);
      __publicField(this, "currentY", 0);
      __publicField(this, "initialX", 0);
      __publicField(this, "initialY", 0);
      __publicField(this, "xOffset", 0);
      __publicField(this, "yOffset", 0);
      this.container = document.createElement("div");
      this.container.id = "fw-toolbar";
      this.container.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
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
      const dragHandle = document.createElement("div");
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
      this.selectBtn = document.createElement("button");
      this.selectBtn.title = "Select Area";
      this.selectBtn.style.cssText = btnStyle;
      this.selectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
      this.commentBtn = document.createElement("button");
      this.commentBtn.title = "Add Comment";
      this.commentBtn.style.cssText = btnStyle;
      this.commentBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      const divider = document.createElement("div");
      divider.style.cssText = "width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px;";
      this.cancelBtn = document.createElement("button");
      this.cancelBtn.title = "Cancel Feedback";
      this.cancelBtn.style.cssText = btnStyle + "color: #e53e3e;";
      this.cancelBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      this.container.appendChild(this.selectBtn);
      this.container.appendChild(this.commentBtn);
      this.container.appendChild(divider);
      this.container.appendChild(this.cancelBtn);
      document.body.appendChild(this.container);
      this.attachHover(this.selectBtn);
      this.attachHover(this.commentBtn);
      this.attachHover(this.cancelBtn, "#fed7d7");
      this.selectBtn.addEventListener("click", () => {
        this.setActiveBtn(this.selectBtn);
        this.callbacks.onModeChanged("select");
      });
      this.commentBtn.addEventListener("click", () => {
        this.setActiveBtn(this.commentBtn);
        this.callbacks.onModeChanged("comment");
      });
      this.cancelBtn.addEventListener("click", () => {
        this.callbacks.onCancel();
        this.resetActiveBtn();
      });
      this.setupDragging();
    }
    attachHover(btn, bg = "#edf2f7") {
      btn.addEventListener("mouseenter", () => {
        if (btn.style.backgroundColor !== "#e2e8f0") {
          btn.style.backgroundColor = bg;
        }
      });
      btn.addEventListener("mouseleave", () => {
        if (btn.style.backgroundColor !== "#e2e8f0") {
          btn.style.backgroundColor = "transparent";
        }
      });
    }
    setActiveBtn(activeBtn) {
      this.resetActiveBtn();
      activeBtn.style.backgroundColor = "#e2e8f0";
      activeBtn.style.color = "#2b6cb0";
    }
    resetActiveBtn() {
      this.selectBtn.style.backgroundColor = "transparent";
      this.selectBtn.style.color = "#4a5568";
      this.commentBtn.style.backgroundColor = "transparent";
      this.commentBtn.style.color = "#4a5568";
    }
    show() {
      this.container.style.display = "flex";
    }
    hide() {
      this.container.style.display = "none";
      this.resetActiveBtn();
    }
    // Dragging logic
    setupDragging() {
      this.container.addEventListener("mousedown", this.dragStart.bind(this));
      document.addEventListener("mousemove", this.drag.bind(this));
      document.addEventListener("mouseup", this.dragEnd.bind(this));
    }
    dragStart(e) {
      if (e.target.closest("button")) return;
      this.initialX = e.clientX - this.xOffset;
      this.initialY = e.clientY - this.yOffset;
      this.isDragging = true;
      this.container.style.cursor = "grabbing";
    }
    drag(e) {
      if (!this.isDragging) return;
      e.preventDefault();
      this.currentX = e.clientX - this.initialX;
      this.currentY = e.clientY - this.initialY;
      this.xOffset = this.currentX;
      this.yOffset = this.currentY;
      this.setTranslate(this.currentX, this.currentY, this.container);
    }
    setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
    dragEnd() {
      this.initialX = this.currentX;
      this.initialY = this.currentY;
      this.isDragging = false;
      this.container.style.cursor = "grab";
    }
  };

  // src/ui/Overlay.ts
  var Overlay = class {
    constructor(onComplete) {
      __publicField(this, "overlay");
      __publicField(this, "selectionRect");
      __publicField(this, "isDrawing", false);
      __publicField(this, "startX", 0);
      __publicField(this, "startY", 0);
      __publicField(this, "rectParams", null);
      __publicField(this, "onComplete");
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

  // src/ui/CommentOverlay.ts
  var CommentOverlay = class {
    constructor() {
      __publicField(this, "overlay");
      __publicField(this, "comments", []);
      __publicField(this, "currentCommentCount", 0);
      __publicField(this, "activeInput", null);
      __publicField(this, "isActive", false);
      this.overlay = document.createElement("div");
      this.overlay.id = "fw-comment-overlay";
      this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99998;
      display: none;
      cursor: crosshair;
    `;
      document.body.appendChild(this.overlay);
      this.overlay.addEventListener("click", (e) => {
        if (!this.isActive || e.target !== this.overlay) return;
        this.placeMarker(e.clientX, e.clientY);
      });
    }
    show() {
      this.isActive = true;
      this.overlay.style.display = "block";
    }
    hide() {
      this.isActive = false;
      this.overlay.style.display = "none";
      if (this.activeInput) {
        this.activeInput.remove();
        this.activeInput = null;
      }
    }
    reset() {
      this.hide();
      this.comments = [];
      this.currentCommentCount = 0;
      document.querySelectorAll(".fw-comment-marker, .fw-comment-input").forEach((el) => el.remove());
    }
    getComments() {
      return this.comments;
    }
    placeMarker(x, y) {
      if (this.activeInput) {
        const inputEl = this.activeInput.querySelector("input");
        if (inputEl && inputEl.value.trim() !== "") {
          this.saveCommentFromInput();
        } else {
          this.activeInput.remove();
          this.activeInput = null;
          const lastMarker = document.getElementById(`fw-comment-marker-${this.currentCommentCount}`);
          if (lastMarker) lastMarker.remove();
          this.currentCommentCount--;
        }
      }
      this.currentCommentCount++;
      const num = this.currentCommentCount;
      const marker = document.createElement("div");
      marker.className = "fw-comment-marker";
      marker.id = `fw-comment-marker-${num}`;
      marker.innerText = num.toString();
      marker.style.cssText = `
      position: fixed;
      top: ${y}px;
      left: ${x}px;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
      background: #fff;
      border: 2px solid #e53e3e;
      border-radius: 50%;
      color: #e53e3e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 14px;
      z-index: 99999;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
      document.body.appendChild(marker);
      this.activeInput = document.createElement("div");
      this.activeInput.className = "fw-comment-input";
      this.activeInput.style.cssText = `
      position: fixed;
      top: ${y}px;
      left: ${x + 20}px;
      transform: translateY(-50%);
      background: white;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      padding: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      z-index: 99999;
    `;
      const input = document.createElement("input");
      input.type = "text";
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
      const saveBtn = document.createElement("button");
      saveBtn.innerText = "Save";
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
      input.focus();
      saveBtn.addEventListener("click", () => this.saveCommentFromInput());
      input.addEventListener("keydown", (e) => {
        var _a;
        if (e.key === "Enter") {
          this.saveCommentFromInput();
        } else if (e.key === "Escape") {
          (_a = this.activeInput) == null ? void 0 : _a.remove();
          this.activeInput = null;
          marker.remove();
          this.currentCommentCount--;
        }
      });
    }
    saveCommentFromInput() {
      var _a;
      if (!this.activeInput) return;
      const input = this.activeInput.querySelector("input");
      const text = input.value.trim();
      if (text) {
        this.comments.push({
          number: parseInt(input.dataset.num),
          text,
          x: parseInt(input.dataset.x),
          y: parseInt(input.dataset.y)
        });
        this.activeInput.remove();
        this.activeInput = null;
      } else {
        const num = parseInt(input.dataset.num);
        this.activeInput.remove();
        this.activeInput = null;
        (_a = document.getElementById(`fw-comment-marker-${num}`)) == null ? void 0 : _a.remove();
        this.currentCommentCount--;
      }
    }
  };

  // src/ui/Modal.ts
  var Modal = class {
    constructor(callbacks) {
      this.callbacks = callbacks;
      __publicField(this, "container");
      __publicField(this, "previewImg");
      __publicField(this, "textArea");
      __publicField(this, "closeBtn");
      __publicField(this, "minimizeBtn");
      __publicField(this, "cancelBtn");
      __publicField(this, "submitBtn");
      __publicField(this, "inputArea");
      __publicField(this, "loadingArea");
      __publicField(this, "resultArea");
      __publicField(this, "loginArea");
      __publicField(this, "passwordInput");
      __publicField(this, "loginError");
      __publicField(this, "proposedPrompt");
      __publicField(this, "editPromptBtn");
      __publicField(this, "successContainer");
      __publicField(this, "repoSelect");
      __publicField(this, "branchSelect");
      __publicField(this, "personaSelect");
      __publicField(this, "refreshReposBtn");
      __publicField(this, "downloadBtn");
      __publicField(this, "isEditingPrompt", false);
      __publicField(this, "basePrompt", "");
      __publicField(this, "availableSources", []);
      __publicField(this, "configDefaults", { repos: [], branches: [], personas: [] });
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
      this.closeBtn = this.container.querySelector(".fw-close-btn");
      this.minimizeBtn = this.container.querySelector(".fw-minimize-btn");
      this.cancelBtn = this.container.querySelector(".fw-btn-cancel");
      this.submitBtn = this.container.querySelector(".fw-btn-submit");
      this.previewImg = this.container.querySelector("#fw-screenshot-preview");
      this.textArea = this.container.querySelector("#fw-feedback-text");
      this.loginArea = this.container.querySelector("#fw-login-area");
      this.passwordInput = this.container.querySelector("#fw-password-input");
      this.loginError = this.container.querySelector("#fw-login-error");
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
      this.downloadBtn = this.container.querySelector("#fw-download-zip");
      this.attachEvents();
    }
    attachEvents() {
      this.closeBtn.addEventListener("click", this.callbacks.onClose);
      this.cancelBtn.addEventListener("click", this.callbacks.onClose);
      this.minimizeBtn.addEventListener("click", this.callbacks.onMinimize);
      this.refreshReposBtn.addEventListener("click", this.callbacks.onRefreshSources);
      this.downloadBtn.addEventListener("click", this.callbacks.onDownload);
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
        if (this.submitBtn.innerText === "Login") {
          this.callbacks.onLogin(this.passwordInput.value);
        } else if (this.submitBtn.innerText === "Analyze Feedback") {
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
    setLoginRequired() {
      this.container.style.display = "flex";
      this.loginArea.style.display = "flex";
      this.inputArea.style.display = "none";
      this.loadingArea.style.display = "none";
      this.resultArea.style.display = "none";
      this.submitBtn.innerText = "Login";
      this.submitBtn.disabled = false;
      this.submitBtn.style.display = "inline-block";
      this.passwordInput.value = "";
      this.passwordInput.focus();
    }
    setLoginError(show) {
      this.loginError.style.display = show ? "block" : "none";
    }
    setPreviewImage(dataUrl) {
      this.previewImg.src = dataUrl;
    }
    show() {
      this.container.style.display = "flex";
      if (this.loginArea.style.display !== "flex") {
        this.textArea.focus();
      }
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
      this.passwordInput.value = "";
      this.loginError.style.display = "none";
      this.container.style.visibility = "";
      this.container.style.pointerEvents = "";
      this.loginArea.style.display = "none";
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
        capturingToast.id = "fw-capturing-toast";
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
              if (node.id === "fw-toolbar") return false;
              if (node.id === "fw-overlay") return false;
              if (node.classList && node.classList.contains("fw-comment-input")) return false;
              if (node.id && node.id.startsWith("fw-") && !node.id.startsWith("fw-comment-marker-")) return false;
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
    const toolbar = new Toolbar({
      onModeChanged: (mode) => {
        if (mode === "select") {
          commentOverlay.hide();
          overlay.show();
        } else if (mode === "comment") {
          overlay.hide();
          commentOverlay.show();
        }
      },
      onCancel: () => {
        resetAll();
      }
    });
    const commentOverlay = new CommentOverlay();
    let hasInitted = false;
    const trigger = new Trigger(
      () => __async(null, null, function* () {
        const isAuthenticated = yield api.checkAuth();
        if (!isAuthenticated) {
          modal.setLoginRequired();
          return;
        }
        if (!hasInitted) {
          yield initData();
          hasInitted = true;
        }
        modal.reset();
        commentOverlay.reset();
        toolbar.show();
        toolbar.resetActiveBtn();
      }),
      () => {
        modal.maximize();
        trigger.hideBadge();
      }
    );
    function resetAll() {
      toolbar.hide();
      overlay.hide();
      commentOverlay.reset();
      modal.reset();
    }
    const modal = new Modal({
      onClose: () => {
        resetAll();
        trigger.hideBadge();
        currentFeedbackDir = null;
      },
      onMinimize: () => {
        modal.minimize();
        trigger.showBadge();
      },
      onLogin: (password) => __async(null, null, function* () {
        const success = yield api.login(password);
        if (success) {
          modal.reset();
          yield initData();
          hasInitted = true;
          toolbar.show();
          toolbar.resetActiveBtn();
        } else {
          modal.setLoginError(true);
        }
      }),
      onDownload: () => {
        if (currentFeedbackDir) {
          const downloadUrl = `${config.endpoint.replace("/feedback", "")}/feedback/download?path=${encodeURIComponent(currentFeedbackDir)}`;
          window.open(downloadUrl, "_blank");
        }
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
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          comments: commentOverlay.getComments()
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
        toolbar.hide();
        overlay.hide();
        try {
          const dataUrl = yield screenshotUtil.captureSelection(rect);
          modal.maximize();
          trigger.hideBadge();
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
