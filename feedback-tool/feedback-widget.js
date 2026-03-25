(function () {
    // Read config
    const config = window.FEEDBACK_WIDGET_CONFIG || { endpoint: 'http://localhost:12345/api/feedback' };

    // Inject the Feedback button
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'fw-trigger-btn';
    triggerBtn.innerText = 'Feedback';
    document.body.appendChild(triggerBtn);

    // Dynamically load html2canvas from unpkg CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true;
    document.head.appendChild(script);

    // Minimized Toggle (Box icon)
    const minimizedBadge = document.createElement('button');
    minimizedBadge.id = 'fw-minimized-badge';
    minimizedBadge.title = 'Maximize feedback';
    minimizedBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>';
    document.body.appendChild(minimizedBadge);

    // Create the overlay and selection rectangle
    const overlay = document.createElement('div');
    overlay.id = 'fw-overlay';
    document.body.appendChild(overlay);

    const selectionRect = document.createElement('div');
    selectionRect.id = 'fw-selection-rect';
    overlay.appendChild(selectionRect);

    // Variables for drawing
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let rectParams = null;

    triggerBtn.addEventListener('click', () => {
        // Ensure fresh feedback clicks always reset the process
        closeModal(); // Close any existing modal and reset its state
        overlay.style.display = 'block';
        document.body.style.userSelect = 'none'; // Prevent text selection
    });

    overlay.addEventListener('mousedown', (e) => {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;

        selectionRect.style.left = `${startX}px`;
        selectionRect.style.top = `${startY}px`;
        selectionRect.style.width = '0px';
        selectionRect.style.height = '0px';

        overlay.classList.add('fw-drawing');
    });

    overlay.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        selectionRect.style.left = `${left}px`;
        selectionRect.style.top = `${top}px`;
        selectionRect.style.width = `${width}px`;
        selectionRect.style.height = `${height}px`;

        rectParams = { x: left, y: top, width, height };
    });

    overlay.addEventListener('mouseup', () => {
        if (!isDrawing) return;
        isDrawing = false;

        document.body.style.userSelect = '';

        if (rectParams && rectParams.width > 10 && rectParams.height > 10) {
            // Rectangle has been drawn, trigger screenshot
            processSelection(rectParams);
        } else {
            // Clicked without dragging, cancel
            resetOverlay();
        }
    });

    function resetOverlay() {
        overlay.style.display = 'none';
        overlay.classList.remove('fw-drawing');
        selectionRect.style.width = '0px';
        selectionRect.style.height = '0px';
        rectParams = null;
    }

    // Modal Setup
    const modalContainer = document.createElement('div');
    modalContainer.id = 'fw-modal-container';

    modalContainer.innerHTML = `
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
    document.body.appendChild(modalContainer);

    const closeBtn = modalContainer.querySelector('.fw-close-btn');
    const minimizeBtn = modalContainer.querySelector('.fw-minimize-btn');
    const cancelBtn = modalContainer.querySelector('.fw-btn-cancel');
    const submitBtn = modalContainer.querySelector('.fw-btn-submit');
    const previewImg = modalContainer.querySelector('#fw-screenshot-preview');
    const textArea = modalContainer.querySelector('#fw-feedback-text');

    const inputArea = modalContainer.querySelector('#fw-input-area');
    const loadingArea = modalContainer.querySelector('#fw-loading-area');
    const resultArea = modalContainer.querySelector('#fw-result-area');
    const proposedPrompt = modalContainer.querySelector('#fw-proposed-prompt');
    const editPromptBtn = modalContainer.querySelector('#fw-edit-prompt');
    const successContainer = modalContainer.querySelector('#fw-success-container');
    const repoSelect = modalContainer.querySelector('#fw-repo-select');
    const branchSelect = modalContainer.querySelector('#fw-branch-select');
    const personaSelect = modalContainer.querySelector('#fw-persona-select');
    const refreshReposBtn = modalContainer.querySelector('#fw-refresh-sources');

    let currentFeedbackDir = null;
    let basePrompt = ''; // Original prompt from Groq
    let isEditingPrompt = false;
    let availableSources = [];

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    minimizeBtn.addEventListener('click', minimizeModal);
    minimizedBadge.addEventListener('click', maximizeModal);
    refreshReposBtn.addEventListener('click', () => fetchSources(true));

    editPromptBtn.addEventListener('click', () => {
        isEditingPrompt = !isEditingPrompt;
        proposedPrompt.readOnly = !isEditingPrompt;
        if (isEditingPrompt) {
            proposedPrompt.focus();
            editPromptBtn.classList.add('fw-btn-active');
        } else {
            editPromptBtn.classList.remove('fw-btn-active');
        }
    });

    personaSelect.addEventListener('change', () => {
        if (!isEditingPrompt) {
            updatePromptPreview();
        }
    });

    repoSelect.addEventListener('change', () => {
        updateBranchOptions();
    });

    // Fetch data once on load to warm cache
    fetchSources();
    fetchPersonas();

    submitBtn.addEventListener('click', () => {
        if (submitBtn.innerText === 'Analyze Feedback') {
            analyzeFeedback();
        } else if (submitBtn.innerText === 'Send to Jules') {
            sendToJules();
        }
    });

    function analyzeFeedback() {
        submitBtn.disabled = true;
        inputArea.style.display = 'none';
        loadingArea.style.display = 'flex';
        cancelBtn.style.display = 'none';

        const metadata = {
            url: window.location.href,
            pathname: window.location.pathname,
            hostname: window.location.hostname,
            pageTitle: document.title,
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString()
        };

        const payload = {
            text: textArea.value,
            screenshot: previewImg.src,
            metadata: metadata
        };

        fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                currentFeedbackDir = data.feedbackDir;
                basePrompt = data.prompt;
                updatePromptPreview();

                loadingArea.style.display = 'none';
                resultArea.style.display = 'flex';

                submitBtn.innerText = 'Send to Jules';
                submitBtn.disabled = false;
                cancelBtn.style.display = 'inline-block';
            })
            .catch(err => {
                console.error("Analysis failed:", err);
                alert("Analysis failed. See console.");
                closeModal();
            });
    }

    function sendToJules() {
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        const baseUrl = config.endpoint.split('/api/feedback')[0];
        const julesUrl = `${baseUrl}/api/send-to-jules`;

        const payload = {
            feedbackDir: currentFeedbackDir,
            sourceId: repoSelect.value,
            branch: branchSelect.value,
            persona: personaSelect.value,
            prompt: proposedPrompt.value
        };

        fetch(julesUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                successContainer.innerHTML = '<div class="fw-success-msg">Success! Jules has started the task.</div>';
                submitBtn.style.display = 'none';
                cancelBtn.innerText = 'Close';
            })
            .catch(err => {
                console.error("Jules trigger failed:", err);
                alert("Failed to trigger Jules.");
                submitBtn.innerText = 'Send to Jules';
                submitBtn.disabled = false;
            });
    }

    function fetchSources(refresh = false) {
        refreshReposBtn.classList.add('fw-refresh-spinning');
        const baseUrl = config.endpoint.split('/api/feedback')[0];

        fetch(`${baseUrl}/api/jules/sources${refresh ? '?refresh=true' : ''}`)
            .then(res => res.json())
            .then(data => {
                availableSources = data.sources || [];
                repoSelect.innerHTML = availableSources.map(s => {
                    const id = s.name.replace('sources/', '');
                    const label = s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : id;
                    return `<option value="${id}">${label}</option>`;
                }).join('');

                updateBranchOptions();
            })
            .catch(err => {
                console.error("Failed to fetch sources:", err);
                repoSelect.innerHTML = '<option value="">Error loading sources</option>';
            })
            .finally(() => {
                refreshReposBtn.classList.remove('fw-refresh-spinning');
            });
    }

    function fetchPersonas() {
        const baseUrl = config.endpoint.split('/api/feedback')[0];

        fetch(`${baseUrl}/api/jules/personas`)
            .then(res => res.json())
            .then(data => {
                const personas = data.personas || [];
                personaSelect.innerHTML = personas.map(p => {
                    return `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`;
                }).join('');
            })
            .catch(err => {
                console.error("Failed to fetch personas:", err);
                personaSelect.innerHTML = '<option value="">Error loading personas</option>';
            });
    }

    function updateBranchOptions() {
        const selectedId = repoSelect.value;
        const source = availableSources.find(s => s.name.replace('sources/', '') === selectedId);

        if (!source || !source.githubRepo) {
            branchSelect.innerHTML = '<option value="dev">dev (default)</option>';
            return;
        }

        const branches = source.githubRepo.branches || [];
        const defaultBranch = source.githubRepo.defaultBranch ? source.githubRepo.defaultBranch.displayName : 'dev';

        if (branches.length === 0) {
            branchSelect.innerHTML = `<option value="${defaultBranch}">${defaultBranch}</option>`;
            return;
        }

        branchSelect.innerHTML = branches.map(b => {
            const name = b.displayName;
            return `<option value="${name}" ${name === defaultBranch ? 'selected' : ''}>${name}${name === defaultBranch ? ' (default)' : ''}</option>`;
        }).join('');
    }

    function updatePromptPreview() {
        const persona = personaSelect.value;
        if (persona) {
            proposedPrompt.value = `You are the ${persona}. Read AGENTS.md first. ${basePrompt}`;
        } else {
            proposedPrompt.value = basePrompt;
        }
    }

    function minimizeModal() {
        modalContainer.style.visibility = 'hidden';
        modalContainer.style.pointerEvents = 'none';
        minimizedBadge.style.display = 'flex';
    }

    function maximizeModal() {
        modalContainer.style.visibility = 'visible';
        modalContainer.style.pointerEvents = 'auto';
        minimizedBadge.style.display = 'none';
    }

    function closeModal() {
        modalContainer.style.display = 'none';
        minimizedBadge.style.display = 'none';
        textArea.value = '';
        previewImg.src = '';
        currentFeedbackDir = null;

        // Reset modal visibility
        modalContainer.style.visibility = '';
        modalContainer.style.pointerEvents = '';

        // Reset areas
        inputArea.style.display = 'block';
        loadingArea.style.display = 'none';
        resultArea.style.display = 'none';

        submitBtn.innerText = 'Analyze Feedback';
        submitBtn.disabled = false;
        submitBtn.style.display = 'inline-block';
        cancelBtn.innerText = 'Cancel';
        cancelBtn.style.display = 'inline-block';
        successContainer.innerHTML = '';
    }

    function processSelection(rect) {
        // New feedback capture always clears any old minimized state
        maximizeModal();

        // Hide overlay temporarily to capture what's underneath
        overlay.style.display = 'none';

        if (typeof html2canvas === 'undefined') {
            alert('html2canvas is still loading or failed to load.');
            resetOverlay();
            return;
        }

        // Add a visual indicator that capturing is in progress
        const capturingToast = document.createElement('div');
        capturingToast.innerText = "Capturing...";
        capturingToast.style.cssText = "position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:20px;z-index:9999999;";
        document.body.appendChild(capturingToast);

        // We capture the whole body
        html2canvas(document.body, {
            useCORS: true,
            logging: false,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            x: window.scrollX,
            y: window.scrollY,
            width: window.innerWidth,
            height: window.innerHeight
        }).then(canvas => {
            document.body.removeChild(capturingToast);

            const ctx = canvas.getContext('2d');
            // html2canvas leaves a transform on the context (e.g. for devicePixelRatio).
            // We must reset it to the identity matrix so our physical pixel calculations map correctly.
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            const scale = canvas.width / window.innerWidth;

            const rx = rect.x * scale;
            const ry = rect.y * scale;
            const rw = rect.width * scale;
            const rh = rect.height * scale;
            const cw = canvas.width;
            const ch = canvas.height;

            // Draw dark overlay on unselected areas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, cw, ry); // Top
            ctx.fillRect(0, ry + rh, cw, ch - (ry + rh)); // Bottom
            ctx.fillRect(0, ry, rx, rh); // Left
            ctx.fillRect(rx + rw, ry, cw - (rx + rw), rh); // Right

            // Draw red border around selected area
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = Math.max(2, 4 * scale);
            ctx.strokeRect(rx, ry, rw, rh);

            const dataUrl = canvas.toDataURL('image/png');
            previewImg.src = dataUrl;

            // Show modal
            modalContainer.style.display = 'flex';
            textArea.focus();

            resetOverlay();
        }).catch(err => {
            console.error("Screenshot capture failed:", err);
            if (document.body.contains(capturingToast)) {
                document.body.removeChild(capturingToast);
            }
            resetOverlay();
        });
    }

})();