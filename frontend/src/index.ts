import { APIClient } from './api';
import { Trigger } from './ui/Trigger';
import { Toolbar, ToolbarMode } from './ui/Toolbar';
import { Overlay, RectParams } from './ui/Overlay';
import { CommentOverlay } from './ui/CommentOverlay';
import { Modal } from './ui/Modal';
import { ScreenshotUtil } from './utils/screenshot';
import { ConsoleCapture } from './utils/consoleCapture';
import { DOMCapture } from './utils/domCapture';
import { Config, FeedbackPayload, JulesPayload, LinearPayload } from './types';

(function () {
  // Initialize console capture immediately
  const consoleCapture = ConsoleCapture.getInstance();

  // Read config
  const config: Config = window.FEEDBACK_WIDGET_CONFIG || { endpoint: 'http://localhost:12345/api/feedback' };

  const api = new APIClient(config);
  const screenshotUtil = new ScreenshotUtil();
  const domCapture = new DOMCapture();

  let currentFeedbackDir: string | null = null;
  let currentDomSnapshot: string = "";

  const toolbar = new Toolbar({
    onModeChanged: (mode: ToolbarMode) => {
      if (mode === 'select') {
        commentOverlay.hide();
        overlay.show();
      } else if (mode === 'comment') {
        overlay.hide();
        commentOverlay.show();
      }
    },
    onCancel: () => {
      resetAll();
    },
    onConfirm: (fullPage: boolean) => {
      processSelection(overlay.getSelections(), fullPage);
    }
  });

  const commentOverlay = new CommentOverlay();

  let hasInitted = false;
  const trigger = new Trigger(
    async () => {
      // Check auth first
      const isAuthenticated = await api.checkAuth();
      if (!isAuthenticated) {
        modal.setLoginRequired();
        return;
      }

      if (!hasInitted) {
          await initData();
          hasInitted = true;
      }

      // Ensure fresh feedback clicks always reset the process
      modal.reset();
      commentOverlay.reset();
      toolbar.show();
      toolbar.resetActiveBtn();
    },
    () => {
      modal.maximize();
      trigger.hideBadge();
      // Hide toolbar when modal is maximized to prevent UI overlap
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
      // If we are still in the input stage (haven't submitted for analysis yet), 
      // bring back the toolbar so the user can adjust selection/comments
      if (modal.isInputStage()) {
        toolbar.show();
      }
    },
    onLogin: async (password: string) => {
      const success = await api.login(password);
      if (success) {
        modal.reset();
        await initData(); // Fetch personas/sources after login
        hasInitted = true;
        // Since we intended to start the feedback process, let's open the toolbar
        toolbar.show();
        toolbar.resetActiveBtn();
      } else {
        modal.setLoginError(true);
      }
    },
    onDownload: () => {
      if (currentFeedbackDir) {
        const downloadUrl = `${config.endpoint.replace('/feedback', '')}/feedback/download?path=${encodeURIComponent(currentFeedbackDir)}`;
        window.open(downloadUrl, '_blank');
      }
    },
    onSubmitAnalyze: async (text: string, screenshotUrl: string) => {
      modal.setLoading();

      const metadata = {
        url: window.location.href,
        pathname: window.location.pathname,
        hostname: window.location.hostname,
        pageTitle: document.title,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
        comments: commentOverlay.getComments(),
        consoleLogs: consoleCapture.getLogs(),
        domSnapshot: currentDomSnapshot
      };

      const payload: FeedbackPayload = {
        text,
        screenshot: screenshotUrl,
        metadata
      };

      // Input stage is over, clear the DOM markers
      commentOverlay.reset();

      try {
        // Step 1: Save the feedback files
        const saveData = await api.saveFeedback(payload);
        if (saveData.error) throw new Error(saveData.error);

        currentFeedbackDir = saveData.feedbackDir;

        // Step 2: Trigger vision analysis using the saved path
        const visionData = await api.runVisionAnalysis({
            mdFilePath: saveData.mdPath,
            imagePaths: saveData.imagePaths,
            outputPath: saveData.outputPath
        });

        if (visionData.error) throw new Error(visionData.error);
        
        modal.setResult(visionData.agent_prompt || '');
      } catch (err: any) {
        console.error("Submission or analysis failed:", err);
        modal.setError(err.message || "Operation failed.");
        modal.setFailed(true);
      }
    },
    onSubmitSend: async (payload: { sourceId: string; branch: string; persona: string; prompt: string }) => {
      modal.setSending();

      const julesPayload: JulesPayload = {
        feedbackDir: currentFeedbackDir!,
        sourceId: payload.sourceId,
        branch: payload.branch,
        persona: payload.persona,
        prompt: payload.prompt
      };

      try {
        await api.sendToProcessor('jules', julesPayload);
        modal.setSuccess();
      } catch (err: any) {
        console.error("Jules trigger failed:", err);
        modal.setError(err.message || "Failed to trigger Jules.");
        modal.setFailed(false);
      }
    },
    onSubmitLinear: async (payload: { feedbackDir: string, title?: string }) => {
      if (!currentFeedbackDir) return;

      modal.setSending();

      try {
        await api.sendToProcessor('linear', {
          feedbackDir: currentFeedbackDir,
          title: payload.title
        });
        modal.setLinearSuccess();
      } catch (err: any) {
        console.error("Linear trigger failed:", err);
        modal.setError(err.message || "Failed to create Linear issue.");
        modal.setFailed(false);
      }
    },
    onRefreshSources: () => {
      fetchSources(true);
    }
  });

  const overlay = new Overlay();

  async function processSelection(rects: RectParams[], fullPage: boolean) {
    // Capture DOM first while elements are visible and properly structured
    currentDomSnapshot = domCapture.capture(rects, commentOverlay.getComments(), fullPage);

    // Hide UI elements before taking screenshot
    toolbar.hide();
    overlay.hide();
    commentOverlay.hide();

    try {
      const dataUrl = await screenshotUtil.captureSelection(rects, commentOverlay.getComments(), fullPage);

      // Now that screenshot is captured, we can process the rest
      modal.maximize();
      trigger.hideBadge();

      modal.setPreviewImage(dataUrl);
      modal.show();
    } catch (err: any) {
      alert("Screenshot capture failed. Error: " + err.message);
    } finally {
      overlay.reset();
    }
  }

  // Fetch data once on load to warm cache
  async function initData() {
    try {
      const defaults = await api.fetchDefaults('jules');
      modal.setConfigDefaults(defaults);

      fetchSources(false);
      fetchPersonas();
    } catch (err) {
      console.error("Failed to init defaults:", err);
    }
  }

  async function fetchSources(refresh: boolean = false) {
    modal.setRefreshSpinning(true);
    try {
      const data = await api.fetchSources('jules', refresh);
      modal.setSources(data.sources || []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
      modal.setSourcesError();
    } finally {
      modal.setRefreshSpinning(false);
    }
  }

  async function fetchPersonas() {
    try {
      const data = await api.fetchPersonas('jules');
      modal.setPersonas(data.personas || []);
    } catch (err) {
      console.error("Failed to fetch personas:", err);
      modal.setPersonasError();
    }
  }

  initData();

})();