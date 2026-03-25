(function () {
    // Read config
    const config = window.FEEDBACK_WIDGET_CONFIG || { endpoint: 'http://localhost:3000/api/feedback' };

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
                <button class="fw-close-btn">&times;</button>
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
                    <div style="font-size: 14px; margin-bottom: 5px; color: #4a5568; font-weight: bold;">Proposed Prompt for Jules:</div>
                    <div id="fw-proposed-prompt"></div>
                    
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
                        <input type="text" id="fw-branch-input" class="fw-input" value="dev" placeholder="e.g. main, dev" />
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
    const cancelBtn = modalContainer.querySelector('.fw-btn-cancel');
    const submitBtn = modalContainer.querySelector('.fw-btn-submit');
    const previewImg = modalContainer.querySelector('#fw-screenshot-preview');
    const textArea = modalContainer.querySelector('#fw-feedback-text');

    const inputArea = modalContainer.querySelector('#fw-input-area');
    const loadingArea = modalContainer.querySelector('#fw-loading-area');
    const resultArea = modalContainer.querySelector('#fw-result-area');
    const proposedPrompt = modalContainer.querySelector('#fw-proposed-prompt');
    const successContainer = modalContainer.querySelector('#fw-success-container');
    const repoSelect = modalContainer.querySelector('#fw-repo-select');
    const branchInput = modalContainer.querySelector('#fw-branch-input');
    const refreshReposBtn = modalContainer.querySelector('#fw-refresh-sources');

    let currentFeedbackDir = null;

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    refreshReposBtn.addEventListener('click', () => fetchSources(true));

    // Fetch sources once on load to warm cache
    fetchSources();

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

        const payload = {
            text: textArea.value,
            screenshot: previewImg.src
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
            proposedPrompt.innerText = data.prompt;
            
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
            branch: branchInput.value
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
                const sources = data.sources || [];
                repoSelect.innerHTML = sources.map(s => {
                    const id = s.name.replace('sources/', '');
                    const label = s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : id;
                    return `<option value="${id}">${label}</option>`;
                }).join('');
                
                // Set default if JULES_DEFAULT_REPO is known (client-side might not know it, but server handles fallback)
            })
            .catch(err => {
                console.error("Failed to fetch sources:", err);
                repoSelect.innerHTML = '<option value="">Error loading sources</option>';
            })
            .finally(() => {
                refreshReposBtn.classList.remove('fw-refresh-spinning');
            });
    }

    function closeModal() {
        modalContainer.style.display = 'none';
        textArea.value = '';
        previewImg.src = '';
        currentFeedbackDir = null;
        
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

            // Create a temporary canvas to crop the image
            const croppedCanvas = document.createElement('canvas');
            const ctx = croppedCanvas.getContext('2d');
            
            // Handle high-DPI displays (retina) where canvas size > window size
            const scale = canvas.width / window.innerWidth;

            croppedCanvas.width = rect.width * scale;
            croppedCanvas.height = rect.height * scale;

            ctx.drawImage(
                canvas,
                rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale, // Source coordinates
                0, 0, rect.width * scale, rect.height * scale // Destination coordinates
            );

            // Get cropped image data
            const dataUrl = croppedCanvas.toDataURL('image/png');
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