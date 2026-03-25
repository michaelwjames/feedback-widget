import { APIClient } from './api';
import { Trigger } from './ui/Trigger';
import { Overlay, RectParams } from './ui/Overlay';
import { Modal } from './ui/Modal';
import { ScreenshotUtil } from './utils/screenshot';
import { Config, FeedbackPayload, JulesPayload } from './types';

(function () {
  // Read config
  const config: Config = window.FEEDBACK_WIDGET_CONFIG || { endpoint: 'http://localhost:12345/api/feedback' };

  const api = new APIClient(config);
  const screenshotUtil = new ScreenshotUtil();

  let currentFeedbackDir: string | null = null;

  const trigger = new Trigger(
    () => {
      // Ensure fresh feedback clicks always reset the process
      modal.reset(); // Close any existing modal and reset its state
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
        timestamp: new Date().toISOString()
      };

      const payload: FeedbackPayload = {
        text,
        screenshot: screenshotUrl,
        metadata
      };

      try {
        const data = await api.analyzeFeedback(payload);
        if (data.error) throw new Error(data.error);

        currentFeedbackDir = data.feedbackDir || null;
        modal.setResult(data.prompt || '');
      } catch (err) {
        console.error("Analysis failed:", err);
        alert("Analysis failed. See console.");
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
        await api.sendToJules(julesPayload);
        modal.setSuccess();
      } catch (err) {
        console.error("Jules trigger failed:", err);
        alert("Failed to trigger Jules.");
        modal.setFailed(false);
      }
    },
    onRefreshSources: () => {
      fetchSources(true);
    }
  });

  const overlay = new Overlay((rect: RectParams) => {
    processSelection(rect);
  });

  async function processSelection(rect: RectParams) {
    // New feedback capture always clears any old minimized state
    modal.maximize();
    trigger.hideBadge();

    // Hide overlay temporarily to capture what's underneath
    overlay.hide();

    try {
      const dataUrl = await screenshotUtil.captureSelection(rect);
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
      const defaults = await api.fetchDefaults();
      modal.setConfigDefaults(defaults);

      fetchSources();
      fetchPersonas();
    } catch (err) {
      console.error("Failed to init defaults:", err);
    }
  }

  async function fetchSources(refresh: boolean = false) {
    modal.setRefreshSpinning(true);
    try {
      const data = await api.fetchSources(refresh);
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
      const data = await api.fetchPersonas();
      modal.setPersonas(data.personas || []);
    } catch (err) {
      console.error("Failed to fetch personas:", err);
      modal.setPersonasError();
    }
  }

  initData();

})();
