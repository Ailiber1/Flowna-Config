/**
 * Connector services for external integrations
 * GitHub, Claude Code, Gemini, Custom API
 */

import { validateApiKey, apiRateLimiter, sanitizeText } from '../utils/security';

// Types
export interface ConnectorResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
}

// ============================================
// GitHub Connector
// ============================================

export class GitHubConnector {
  private token: string = '';
  private baseUrl = 'https://api.github.com';

  setToken(token: string): boolean {
    if (!validateApiKey(token)) return false;
    this.token = token;
    return true;
  }

  clearToken(): void {
    this.token = '';
  }

  isConfigured(): boolean {
    return this.token.length > 0;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    if (!this.isConfigured()) return null;
    if (!apiRateLimiter.canMakeRequest()) {
      console.warn('Rate limit exceeded for GitHub API');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        console.error(`GitHub API error: ${response.status}`);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('GitHub API request failed:', error);
      return null;
    }
  }

  async testConnection(): Promise<ConnectorResult> {
    const user = await this.request<{ login: string }>('/user');
    if (user) {
      return { success: true, message: `Connected as ${user.login}`, data: user };
    }
    return { success: false, message: 'Connection failed. Check your token.' };
  }

  async getRepositories(): Promise<GitHubRepo[]> {
    const repos = await this.request<GitHubRepo[]>('/user/repos?sort=updated&per_page=30');
    return repos || [];
  }

  async getWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    const result = await this.request<{ workflows: GitHubWorkflow[] }>(
      `/repos/${owner}/${repo}/actions/workflows`
    );
    return result?.workflows || [];
  }

  async triggerWorkflow(owner: string, repo: string, workflowId: number, ref: string = 'main'): Promise<ConnectorResult> {
    const result = await this.request(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        body: JSON.stringify({ ref }),
      }
    );

    if (result !== null) {
      return { success: true, message: 'Workflow triggered successfully' };
    }
    return { success: false, message: 'Failed to trigger workflow' };
  }

  async getIssues(owner: string, repo: string): Promise<unknown[]> {
    const issues = await this.request<unknown[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=20`);
    return issues || [];
  }

  async createRepository(options: {
    name: string;
    description?: string;
    private?: boolean;
  }, token?: string): Promise<ConnectorResult> {
    // If a token is provided, use it temporarily
    const originalToken = this.token;
    if (token) {
      this.token = token;
    }

    if (!this.isConfigured()) {
      return { success: false, message: 'GitHub token not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: options.name,
          description: options.description || '',
          private: options.private || false,
          auto_init: true,
        }),
      });

      // Restore original token
      if (token) {
        this.token = originalToken;
      }

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || `Failed to create repository: ${response.status}`,
        };
      }

      const repo = await response.json();
      return {
        success: true,
        message: `Repository created: ${repo.full_name}`,
        data: repo,
      };
    } catch (error) {
      // Restore original token
      if (token) {
        this.token = originalToken;
      }
      return {
        success: false,
        message: `Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// ============================================
// Claude Code Connector (Anthropic API)
// ============================================

export class ClaudeConnector {
  private apiKey: string = '';
  private baseUrl = 'https://api.anthropic.com/v1';
  private model = 'claude-3-sonnet-20240229';

  setApiKey(key: string): boolean {
    if (!validateApiKey(key)) return false;
    this.apiKey = key;
    return true;
  }

  clearApiKey(): void {
    this.apiKey = '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async testConnection(): Promise<ConnectorResult> {
    // Simple test - we can't easily test without making a real API call
    if (this.isConfigured()) {
      return { success: true, message: 'API key configured. Ready to use.' };
    }
    return { success: false, message: 'API key not configured' };
  }

  async sendMessage(prompt: string, systemPrompt?: string): Promise<ConnectorResult> {
    if (!this.isConfigured()) {
      return { success: false, message: 'API key not configured' };
    }
    if (!apiRateLimiter.canMakeRequest()) {
      return { success: false, message: 'Rate limit exceeded. Please wait.' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt || 'You are a helpful AI assistant for workflow management.',
          messages: [{ role: 'user', content: sanitizeText(prompt) }],
        }),
      });

      if (!response.ok) {
        return { success: false, message: `API error: ${response.status}` };
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Response received',
        data: data.content?.[0]?.text || '',
      };
    } catch (error) {
      return { success: false, message: `Request failed: ${error}` };
    }
  }

  async generateNodeSuggestions(context: string): Promise<ConnectorResult> {
    const prompt = `Based on the following workflow context, suggest 3-5 additional nodes that might be useful.
Context: ${context}
Please respond in JSON format with an array of objects containing: title, description, category (AGENT/LOGIC/SYSTEM/RULE), icon (emoji).`;

    return this.sendMessage(prompt, 'You are an AI assistant that helps design workflows. Always respond with valid JSON.');
  }

  async generateCodeFromWorkflow(workflow: string): Promise<ConnectorResult> {
    const prompt = `Convert the following workflow description into pseudocode or a structured implementation outline:
${workflow}`;

    return this.sendMessage(prompt, 'You are an AI code assistant. Generate clean, well-documented code.');
  }
}

// ============================================
// Gemini Connector (Google AI)
// ============================================

export class GeminiConnector {
  private apiKey: string = '';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-pro';

  setApiKey(key: string): boolean {
    if (!validateApiKey(key)) return false;
    this.apiKey = key;
    return true;
  }

  clearApiKey(): void {
    this.apiKey = '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async testConnection(): Promise<ConnectorResult> {
    if (!this.isConfigured()) {
      return { success: false, message: 'API key not configured' };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { method: 'GET' }
      );

      if (response.ok) {
        return { success: true, message: 'Connected to Gemini API' };
      }
      return { success: false, message: `Connection failed: ${response.status}` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  async generateContent(prompt: string): Promise<ConnectorResult> {
    if (!this.isConfigured()) {
      return { success: false, message: 'API key not configured' };
    }
    if (!apiRateLimiter.canMakeRequest()) {
      return { success: false, message: 'Rate limit exceeded. Please wait.' };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: sanitizeText(prompt) }] }],
          }),
        }
      );

      if (!response.ok) {
        return { success: false, message: `API error: ${response.status}` };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, message: 'Response received', data: text };
    } catch (error) {
      return { success: false, message: `Request failed: ${error}` };
    }
  }

  async analyzeWorkflow(workflowDescription: string): Promise<ConnectorResult> {
    const prompt = `Analyze this workflow and suggest improvements:
${workflowDescription}

Please provide:
1. Potential bottlenecks
2. Missing steps
3. Optimization suggestions`;

    return this.generateContent(prompt);
  }
}

// ============================================
// Custom API Connector
// ============================================

export interface CustomApiConfig {
  baseUrl: string;
  authType: 'none' | 'bearer' | 'apikey' | 'basic';
  authValue?: string;
  headers?: Record<string, string>;
}

export class CustomApiConnector {
  private config: CustomApiConfig | null = null;

  setConfig(config: CustomApiConfig): boolean {
    if (!config.baseUrl) return false;
    // Validate URL
    try {
      new URL(config.baseUrl);
    } catch {
      return false;
    }
    this.config = config;
    return true;
  }

  clearConfig(): void {
    this.config = null;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  async testConnection(): Promise<ConnectorResult> {
    if (!this.config) {
      return { success: false, message: 'Not configured' };
    }

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      }
      return { success: false, message: `Connection failed: ${response.status}` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config?.headers,
    };

    if (this.config?.authType === 'bearer' && this.config.authValue) {
      headers['Authorization'] = `Bearer ${this.config.authValue}`;
    } else if (this.config?.authType === 'apikey' && this.config.authValue) {
      headers['X-API-Key'] = this.config.authValue;
    } else if (this.config?.authType === 'basic' && this.config.authValue) {
      headers['Authorization'] = `Basic ${btoa(this.config.authValue)}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T | null> {
    if (!this.config) return null;
    if (!apiRateLimiter.canMakeRequest()) {
      console.warn('Rate limit exceeded');
      return null;
    }

    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Custom API request failed:', error);
      return null;
    }
  }
}

// Singleton instances
export const githubConnector = new GitHubConnector();
export const claudeConnector = new ClaudeConnector();
export const geminiConnector = new GeminiConnector();
export const customApiConnector = new CustomApiConnector();

// Save/Load connector configurations from localStorage
export function saveConnectorConfig(connectorId: string, config: unknown): void {
  const key = `flowna_connector_${connectorId}`;
  // Note: In production, sensitive data should be encrypted
  localStorage.setItem(key, JSON.stringify(config));
}

export function loadConnectorConfig<T>(connectorId: string): T | null {
  const key = `flowna_connector_${connectorId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export function clearConnectorConfig(connectorId: string): void {
  const key = `flowna_connector_${connectorId}`;
  localStorage.removeItem(key);
}
