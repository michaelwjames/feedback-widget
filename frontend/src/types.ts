export interface Config {
  endpoint: string;
}

export interface FeedbackComment {
  number: number;
  text: string;
  x: number;
  y: number;
}

export interface FeedbackMetadata {
  url: string;
  pathname: string;
  hostname: string;
  pageTitle: string;
  userAgent: string;
  screenResolution: string;
  windowSize: string;
  timestamp: string;
  comments?: FeedbackComment[];
}

export interface FeedbackPayload {
  text: string;
  screenshot: string;
  metadata: FeedbackMetadata;
}

export interface FeedbackResponse {
  error?: string;
  feedbackDir?: string;
  prompt?: string;
}

export interface JulesPayload {
  feedbackDir: string;
  sourceId: string;
  branch: string;
  persona: string;
  prompt: string;
}

export interface GithubBranch {
  displayName: string;
}

export interface GithubRepo {
  owner: string;
  repo: string;
  branches: GithubBranch[];
  defaultBranch?: GithubBranch;
}

export interface Source {
  name: string;
  githubRepo?: GithubRepo;
}

export interface SourcesResponse {
  sources?: Source[];
}

export interface PersonasResponse {
  personas?: string[];
}

export interface DefaultsResponse {
  repos: string[];
  branches: string[];
  personas: string[];
}

declare global {
  interface Window {
    FEEDBACK_WIDGET_CONFIG?: Config;
  }
}
