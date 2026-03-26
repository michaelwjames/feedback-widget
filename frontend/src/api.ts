import {
  Config,
  FeedbackPayload,
  FeedbackResponse,
  JulesPayload,
  SourcesResponse,
  PersonasResponse,
  DefaultsResponse
} from './types';

export class APIClient {
  private config: Config;
  private baseUrl: string;

  constructor(config: Config) {
    this.config = config;
    this.baseUrl = config.endpoint.split('/api/feedback')[0];
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

  async fetchDefaults(): Promise<DefaultsResponse> {
    const res = await fetch(`${this.baseUrl}/api/jules/defaults`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  async fetchSources(refresh: boolean = false): Promise<SourcesResponse> {
    const url = `${this.baseUrl}/api/jules/sources${refresh ? '?refresh=true' : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  async fetchPersonas(): Promise<PersonasResponse> {
    const res = await fetch(`${this.baseUrl}/api/jules/personas`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  async analyzeFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
    const res = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    return res.json();
  }

  async sendToJules(payload: JulesPayload): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/send-to-jules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    return res.json();
  }
}

