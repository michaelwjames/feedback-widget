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

  async fetchDefaults(): Promise<DefaultsResponse> {
    const res = await fetch(`${this.baseUrl}/api/jules/defaults`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  async fetchSources(refresh: boolean = false): Promise<SourcesResponse> {
    const url = `${this.baseUrl}/api/jules/sources${refresh ? '?refresh=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  async fetchPersonas(): Promise<PersonasResponse> {
    const res = await fetch(`${this.baseUrl}/api/jules/personas`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  async analyzeFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
    const res = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async sendToJules(payload: JulesPayload): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/send-to-jules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
}
