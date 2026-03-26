import {
  Config,
  FeedbackPayload,
  SourcesResponse,
  PersonasResponse,
  DefaultsResponse,
  ProcessorPayload,
  SaveFeedbackResponse,
  VisionAnalysisPayload,
  VisionAnalysisResult
} from './types';

export class APIClient {
  private config: Config;
  private baseUrl: string;

  constructor(config: Config) {
    this.config = config;
    this.baseUrl = config.endpoint.split('/api/feedback')[0];
  }

  private async get(path: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  private async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  }

  async checkAuth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/check`, { credentials: 'include' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async login(password: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchDefaults(processor: string): Promise<DefaultsResponse> {
    return this.get(`/api/${processor}/defaults`);
  }

  async fetchSources(processor: string, refresh: boolean = false): Promise<SourcesResponse> {
    return this.get(`/api/${processor}/sources${refresh ? '?refresh=true' : ''}`);
  }

  async fetchPersonas(processor: string): Promise<PersonasResponse> {
    return this.get(`/api/${processor}/personas`);
  }

  async saveFeedback(payload: FeedbackPayload): Promise<SaveFeedbackResponse> {
    return this.post('/api/feedback', payload);
  }

  async runVisionAnalysis(payload: VisionAnalysisPayload): Promise<VisionAnalysisResult> {
    return this.post('/api/vision/analyze', payload);
  }

  async sendToProcessor(processor: string, payload: ProcessorPayload): Promise<any> {
    return this.post(`/api/send-to/${processor}`, payload);
  }
}
