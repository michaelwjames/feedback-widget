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
    get(path) {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}${path}`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });
    }
    post(path, body) {
      return __async(this, null, function* () {
        const res = yield fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include"
        });
        if (!res.ok) {
          const errorData = yield res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
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
    fetchDefaults(processor) {
      return __async(this, null, function* () {
        return this.get(`/api/${processor}/defaults`);
      });
    }
    fetchSources(processor, refresh = false) {
      return __async(this, null, function* () {
        return this.get(`/api/${processor}/sources${refresh ? "?refresh=true" : ""}`);
      });
    }
    fetchPersonas(processor) {
      return __async(this, null, function* () {
        return this.get(`/api/${processor}/personas`);
      });
    }
    saveFeedback(payload) {
      return __async(this, null, function* () {
        return this.post("/api/feedback", payload);
      });
    }
    runVisionAnalysis(payload) {
      return __async(this, null, function* () {
        return this.post("/api/vision/analyze", payload);
      });
    }
    sendToProcessor(processor, payload) {
      return __async(this, null, function* () {
        return this.post(`/api/send-to/${processor}`, payload);
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
      __publicField(this, "confirmBtn");
      __publicField(this, "togglePageBtn");
      __publicField(this, "fullPage", false);
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
      this.selectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-dasharray="3 3"></rect></svg>';
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
      this.confirmBtn = document.createElement("button");
      this.confirmBtn.title = "Confirm Screenshot";
      this.confirmBtn.style.cssText = btnStyle + "color: #38a169;";
      this.confirmBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      this.togglePageBtn = document.createElement("button");
      const updateToggleIcon = () => {
        if (this.fullPage) {
          this.togglePageBtn.title = "Full Page (active) - Click to switch to Viewport";
          this.togglePageBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>';
          this.togglePageBtn.style.color = "#2b6cb0";
        } else {
          this.togglePageBtn.title = "Viewport (active) - Click to switch to Full Page";
          this.togglePageBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
          this.togglePageBtn.style.color = "#2b6cb0";
        }
      };
      this.togglePageBtn.style.cssText = btnStyle;
      updateToggleIcon();
      this.container.appendChild(this.selectBtn);
      this.container.appendChild(this.commentBtn);
      this.container.appendChild(divider);
      this.container.appendChild(this.togglePageBtn);
      this.container.appendChild(this.cancelBtn);
      this.container.appendChild(this.confirmBtn);
      document.body.appendChild(this.container);
      this.attachHover(this.selectBtn);
      this.attachHover(this.commentBtn);
      this.attachHover(this.cancelBtn, "#fed7d7");
      this.attachHover(this.confirmBtn, "#c6f6d5");
      this.attachHover(this.togglePageBtn);
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
      this.confirmBtn.addEventListener("click", () => {
        this.callbacks.onConfirm(this.fullPage);
        this.resetActiveBtn();
      });
      this.togglePageBtn.addEventListener("click", () => {
        this.fullPage = !this.fullPage;
        updateToggleIcon();
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
      el.style.transform = `translate3d(calc(-50% + ${xPos}px), ${yPos}px, 0)`;
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
    constructor() {
      __publicField(this, "overlay");
      __publicField(this, "isDrawing", false);
      __publicField(this, "startX", 0);
      __publicField(this, "startY", 0);
      __publicField(this, "currentRectDiv", null);
      __publicField(this, "currentRectParams", null);
      __publicField(this, "rects", []);
      __publicField(this, "dimmingSvg");
      __publicField(this, "dimmingPath");
      this.overlay = document.createElement("div");
      this.overlay.id = "fw-overlay";
      document.body.appendChild(this.overlay);
      this.dimmingSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this.dimmingSvg.id = "fw-overlay-dimming";
      this.dimmingPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.dimmingPath.setAttribute("fill", "rgba(0,0,0,0.4)");
      this.dimmingPath.setAttribute("fill-rule", "evenodd");
      this.dimmingSvg.appendChild(this.dimmingPath);
      this.overlay.appendChild(this.dimmingSvg);
      this.attachEvents();
    }
    getSelections() {
      return this.rects.map((r) => r.params);
    }
    updateDimming() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let pathData = `M 0 0 H ${w} V ${h} H 0 Z`;
      this.rects.forEach((r) => {
        const { x, y, width, height } = r.params;
        pathData += ` M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
      });
      if (this.isDrawing && this.currentRectParams) {
        const { x, y, width, height } = this.currentRectParams;
        pathData += ` M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
      }
      this.dimmingPath.setAttribute("d", pathData);
    }
    attachEvents() {
      this.overlay.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("fw-selection-close")) return;
        this.isDrawing = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentRectDiv = document.createElement("div");
        this.currentRectDiv.className = "fw-selection-rect";
        this.currentRectDiv.style.left = `${this.startX}px`;
        this.currentRectDiv.style.top = `${this.startY}px`;
        this.currentRectDiv.style.width = "0px";
        this.currentRectDiv.style.height = "0px";
        this.currentRectDiv.style.display = "block";
        this.overlay.appendChild(this.currentRectDiv);
        this.overlay.classList.add("fw-drawing");
        this.updateDimming();
      });
      this.overlay.addEventListener("mousemove", (e) => {
        if (!this.isDrawing || !this.currentRectDiv) return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);
        this.currentRectDiv.style.left = `${left}px`;
        this.currentRectDiv.style.top = `${top}px`;
        this.currentRectDiv.style.width = `${width}px`;
        this.currentRectDiv.style.height = `${height}px`;
        this.currentRectParams = { x: left, y: top, width, height };
        this.updateDimming();
      });
      this.overlay.addEventListener("mouseup", () => {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        document.body.style.userSelect = "";
        if (this.currentRectParams && this.currentRectParams.width > 20 && this.currentRectParams.height > 20) {
          const div = this.currentRectDiv;
          const params = this.currentRectParams;
          const selectionObj = { div, params };
          this.rects.push(selectionObj);
          const closeBtn = document.createElement("div");
          closeBtn.className = "fw-selection-close";
          closeBtn.innerHTML = "&times;";
          closeBtn.title = "Remove selection";
          div.appendChild(closeBtn);
          closeBtn.addEventListener("mousedown", (e) => {
            e.stopPropagation();
          });
          closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            div.remove();
            this.rects = this.rects.filter((r) => r !== selectionObj);
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
      this.overlay.style.display = "block";
      document.body.style.userSelect = "none";
      this.updateDimming();
    }
    hide() {
      this.overlay.style.display = "none";
    }
    reset() {
      this.hide();
      this.overlay.classList.remove("fw-drawing");
      Array.from(this.overlay.querySelectorAll(".fw-selection-rect")).forEach((el) => el.remove());
      this.rects = [];
      this.currentRectParams = null;
      this.currentRectDiv = null;
      this.updateDimming();
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
      z-index: 1000010;
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
      this.activeInput = document.createElement("div");
      this.activeInput.className = "fw-comment-input";
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
      __publicField(this, "sendLinearBtn");
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
                    <div id="fw-loading-text">AI is analyzing your feedback...</div>
                </div>

                <div id="fw-result-area">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div style="font-size: 14px; color: #4a5568; font-weight: bold;">Proposed Agent Prompt:</div>
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
                    <button id="fw-send-to-linear" class="fw-btn fw-btn-secondary" style="margin-top: 10px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zM12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg>
                      Send to Linear
                    </button>
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
      this.sendLinearBtn = this.container.querySelector("#fw-send-to-linear");
      this.attachEvents();
    }
    attachEvents() {
      this.closeBtn.addEventListener("click", this.callbacks.onClose);
      this.cancelBtn.addEventListener("click", this.callbacks.onClose);
      this.minimizeBtn.addEventListener("click", this.callbacks.onMinimize);
      this.refreshReposBtn.addEventListener("click", this.callbacks.onRefreshSources);
      this.downloadBtn.addEventListener("click", this.callbacks.onDownload);
      this.sendLinearBtn.addEventListener("click", () => {
        this.callbacks.onSubmitLinear({
          feedbackDir: "",
          // This will be handled in index.ts
          title: ""
          // Could add a field for title if needed
        });
      });
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
    isInputStage() {
      return this.inputArea.style.display === "block";
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
      if (typeof prompt === "object" && prompt !== null) {
        this.basePrompt = `### CONTEXT
${prompt.CONTEXT || ""}

### INSTRUCTIONS
${prompt.INSTRUCTIONS || ""}`;
      } else {
        this.basePrompt = prompt;
      }
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
    setLinearSuccess() {
      this.successContainer.innerHTML = '<div class="fw-success-msg">Success! Linear issue created.</div>';
      this.submitBtn.style.display = "none";
      this.sendLinearBtn.style.display = "none";
      this.cancelBtn.innerText = "Close";
    }
    setFailed(isAnalyze) {
      if (isAnalyze) {
        this.reset();
      } else {
        const isJules = this.submitBtn.innerText.includes("Jules") || this.submitBtn.innerText === "Sending...";
        this.submitBtn.innerText = isJules ? "Send to Jules" : "Analyze Feedback";
        this.submitBtn.disabled = false;
      }
    }
    setError(message) {
      this.successContainer.innerHTML = `<div class="fw-error-msg">${message}</div>`;
      this.submitBtn.disabled = false;
      const isSending = this.submitBtn.innerText === "Sending...";
      if (isSending) {
        this.submitBtn.innerText = "Send to Jules";
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
  var _ScreenshotUtil = class _ScreenshotUtil {
    constructor() {
      this.ensureLoaded().catch((err) => {
        console.error("[FEEDBACK-WIDGET] Initial script load failed:", err);
      });
    }
    ensureLoaded() {
      if (_ScreenshotUtil.loadPromise) {
        return _ScreenshotUtil.loadPromise;
      }
      if (typeof window.htmlToImage !== "undefined") {
        _ScreenshotUtil.loadPromise = Promise.resolve();
        return _ScreenshotUtil.loadPromise;
      }
      _ScreenshotUtil.loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js";
        script.async = true;
        script.onload = () => {
          console.log("[FEEDBACK-WIDGET] html-to-image loaded successfully.");
          resolve();
        };
        script.onerror = () => {
          _ScreenshotUtil.loadPromise = null;
          reject(new Error("Failed to load html-to-image script from CDN."));
        };
        document.head.appendChild(script);
      });
      return _ScreenshotUtil.loadPromise;
    }
    captureSelection(rects, comments, fullPage = true) {
      return __async(this, null, function* () {
        yield this.ensureLoaded();
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
              if (node.id && node.id.startsWith("fw-")) return false;
              if (node.classList && (node.classList.contains("fw-comment-input") || node.classList.contains("fw-comment-marker"))) return false;
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
              const ctx = canvas.getContext("2d");
              if (fullPage) {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
              } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                ctx.drawImage(img, -window.scrollX, -window.scrollY);
              }
              if (rects.length > 0) {
                const darkCanvas = document.createElement("canvas");
                darkCanvas.width = canvas.width;
                darkCanvas.height = canvas.height;
                const darkCtx = darkCanvas.getContext("2d");
                darkCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
                darkCtx.fillRect(0, 0, darkCanvas.width, darkCanvas.height);
                darkCtx.globalCompositeOperation = "destination-out";
                darkCtx.fillStyle = "#000";
                rects.forEach((rect) => {
                  const rx = rect.x + (fullPage ? window.scrollX : 0);
                  const ry = rect.y + (fullPage ? window.scrollY : 0);
                  const rw = rect.width;
                  const rh = rect.height;
                  darkCtx.fillRect(rx, ry, rw, rh);
                });
                ctx.drawImage(darkCanvas, 0, 0);
                rects.forEach((rect) => {
                  const rx = rect.x + (fullPage ? window.scrollX : 0);
                  const ry = rect.y + (fullPage ? window.scrollY : 0);
                  const rw = rect.width;
                  const rh = rect.height;
                  ctx.strokeStyle = "#ff0000";
                  ctx.lineWidth = 2;
                  ctx.strokeRect(rx, ry, rw, rh);
                });
              }
              comments.forEach((comment) => {
                const cx = comment.x + (fullPage ? window.scrollX : 0);
                const cy = comment.y + (fullPage ? window.scrollY : 0);
                const radius = 18;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
                ctx.fillStyle = "#fff";
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#e53e3e";
                ctx.stroke();
                ctx.fillStyle = "#e53e3e";
                ctx.font = "bold 18px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(comment.number.toString(), cx, cy);
              });
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
  __publicField(_ScreenshotUtil, "loadPromise", null);
  var ScreenshotUtil = _ScreenshotUtil;

  // src/utils/consoleCapture.ts
  var _ConsoleCapture = class _ConsoleCapture {
    constructor() {
      __publicField(this, "logs", []);
      __publicField(this, "maxLogs", 100);
      __publicField(this, "lastLog", null);
      __publicField(this, "repeatCount", 0);
      __publicField(this, "originalLog", console.log);
      __publicField(this, "originalWarn", console.warn);
      __publicField(this, "originalError", console.error);
      __publicField(this, "originalInfo", console.info);
      this.interceptConsole();
    }
    static getInstance() {
      if (!_ConsoleCapture.instance) {
        _ConsoleCapture.instance = new _ConsoleCapture();
      }
      return _ConsoleCapture.instance;
    }
    interceptConsole() {
      console.log = this.createInterceptor("LOG", this.originalLog);
      console.warn = this.createInterceptor("WARN", this.originalWarn);
      console.error = this.createInterceptor("ERROR", this.originalError);
      console.info = this.createInterceptor("INFO", this.originalInfo);
    }
    createInterceptor(type, originalMethod) {
      return (...args) => {
        originalMethod.apply(console, args);
        const message = args.map((arg) => {
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return "[Object]";
            }
          }
          return String(arg);
        }).join(" ");
        const formattedMessage = `[${type}] ${message}`;
        if (formattedMessage === this.lastLog) {
          this.repeatCount++;
          if (this.logs.length > 0) {
            this.logs[this.logs.length - 1] = `${formattedMessage} (Repeated ${this.repeatCount + 1} times)`;
          }
        } else {
          this.lastLog = formattedMessage;
          this.repeatCount = 0;
          this.logs.push(formattedMessage);
          if (this.logs.length > this.maxLogs) {
            this.logs.shift();
          }
        }
      };
    }
    getLogs() {
      return [...this.logs];
    }
    clearLogs() {
      this.logs = [];
      this.lastLog = null;
      this.repeatCount = 0;
    }
  };
  __publicField(_ConsoleCapture, "instance");
  var ConsoleCapture = _ConsoleCapture;

  // src/utils/domCapture.ts
  var DOMCapture = class {
    /**
     * Captures HTML for elements selected via rectangle or comment marker.
     * Prioritizes rectangles, then comments. Returns empty string if full page is selected.
     */
    capture(rects, comments, fullPage) {
      if (fullPage) {
        return "";
      }
      const targetedElements = /* @__PURE__ */ new Set();
      comments.forEach((comment) => {
        const el = document.elementFromPoint(comment.x, comment.y);
        if (el) {
          const target = el.parentElement && el.parentElement !== document.body && el.parentElement !== document.documentElement ? el.parentElement : el;
          targetedElements.add(target);
        }
      });
      if (rects.length > 0) {
        const allElements = document.querySelectorAll("*");
        rects.forEach((rect) => {
          const intersecting = [];
          allElements.forEach((el) => {
            if (el.id.startsWith("fw-") || el.classList.contains("fw-selection-rect") || el.tagName.toLowerCase() === "svg") {
              return;
            }
            const bounds = el.getBoundingClientRect();
            const intersects = !(bounds.right < rect.x || bounds.left > rect.x + rect.width || bounds.bottom < rect.y || bounds.top > rect.y + rect.height);
            if (intersects && bounds.width > 0 && bounds.height > 0) {
              intersecting.push(el);
            }
          });
          if (intersecting.length > 0) {
            intersecting.sort((a, b) => {
              const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
              const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
              return areaB - areaA;
            });
            for (const el of intersecting) {
              if (el !== document.body && el !== document.documentElement) {
                targetedElements.add(el);
                break;
              }
            }
          }
        });
      }
      let snapshot = "";
      targetedElements.forEach((el) => {
        let html = el.outerHTML;
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
        snapshot += html + "\n\n";
      });
      snapshot = snapshot.replace(new RegExp('<div[^>]*id="fw-[^>]*>.*?<\\/div>', "gis"), "");
      snapshot = snapshot.replace(new RegExp('<div[^>]*class="fw-[^>]*>.*?<\\/div>', "gis"), "");
      return snapshot.trim();
    }
  };

  // src/index.ts
  (function() {
    const consoleCapture = ConsoleCapture.getInstance();
    const config = window.FEEDBACK_WIDGET_CONFIG || { endpoint: "http://localhost:12345/api/feedback" };
    const api = new APIClient(config);
    const screenshotUtil = new ScreenshotUtil();
    const domCapture = new DOMCapture();
    let currentFeedbackDir = null;
    let currentDomSnapshot = "";
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
      },
      onConfirm: (fullPage) => {
        processSelection(overlay.getSelections(), fullPage);
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
        toolbar.hide();
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
        if (modal.isInputStage()) {
          toolbar.show();
        }
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
          comments: commentOverlay.getComments(),
          consoleLogs: consoleCapture.getLogs(),
          domSnapshot: currentDomSnapshot
        };
        const payload = {
          text,
          screenshot: screenshotUrl,
          metadata
        };
        commentOverlay.reset();
        try {
          const saveData = yield api.saveFeedback(payload);
          if (saveData.error) throw new Error(saveData.error);
          currentFeedbackDir = saveData.feedbackDir;
          const visionData = yield api.runVisionAnalysis({
            mdFilePath: saveData.mdPath,
            imagePaths: saveData.imagePaths,
            outputPath: saveData.outputPath
          });
          if (visionData.error) throw new Error(visionData.error);
          modal.setResult(visionData.agent_prompt || "");
        } catch (err) {
          console.error("Submission or analysis failed:", err);
          modal.setError(err.message || "Operation failed.");
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
          yield api.sendToProcessor("jules", julesPayload);
          modal.setSuccess();
        } catch (err) {
          console.error("Jules trigger failed:", err);
          modal.setError(err.message || "Failed to trigger Jules.");
          modal.setFailed(false);
        }
      }),
      onSubmitLinear: (payload) => __async(null, null, function* () {
        if (!currentFeedbackDir) return;
        modal.setSending();
        try {
          yield api.sendToProcessor("linear", {
            feedbackDir: currentFeedbackDir,
            title: payload.title
          });
          modal.setLinearSuccess();
        } catch (err) {
          console.error("Linear trigger failed:", err);
          modal.setError(err.message || "Failed to create Linear issue.");
          modal.setFailed(false);
        }
      }),
      onRefreshSources: () => {
        fetchSources(true);
      }
    });
    const overlay = new Overlay();
    function processSelection(rects, fullPage) {
      return __async(this, null, function* () {
        currentDomSnapshot = domCapture.capture(rects, commentOverlay.getComments(), fullPage);
        toolbar.hide();
        overlay.hide();
        commentOverlay.hide();
        try {
          const dataUrl = yield screenshotUtil.captureSelection(rects, commentOverlay.getComments(), fullPage);
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
          const defaults = yield api.fetchDefaults("jules");
          modal.setConfigDefaults(defaults);
          fetchSources(false);
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
          const data = yield api.fetchSources("jules", refresh);
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
          const data = yield api.fetchPersonas("jules");
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
