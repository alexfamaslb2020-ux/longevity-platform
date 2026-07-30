const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value);
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...json.error,
      };
    }

    return json.data;
  }

  async get<T>(endpoint: string, params?: Record<string, string | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth
  async login(email: string, password: string) {
    const result = await this.post<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/auth/login', { email, password });
    this.setToken(result.accessToken);
    return result;
  }

  async register(data: { email: string; password: string; name: string }) {
    const result = await this.post<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/auth/register', data);
    this.setToken(result.accessToken);
    return result;
  }

  async me() {
    return this.get<{ id: string; email: string; name: string; role: string }>('/auth/me');
  }

  // Leads
  async getLeads(params?: Record<string, string | undefined>) {
    return this.get<{
      data: any[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>('/leads', params);
  }

  async getLead(id: string) {
    return this.get<any>(`/leads/${id}`);
  }

  async createLead(data: { name: string; email?: string; phone?: string; source?: string }) {
    return this.post<any>('/leads', data);
  }

  async updateLead(id: string, data: any) {
    return this.put<any>(`/leads/${id}`, data);
  }

  async getPipelineStats() {
    return this.get<any>('/leads/stats');
  }

  // Customers
  async getCustomers(params?: Record<string, string | undefined>) {
    return this.get<{
      data: any[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>('/customers', params);
  }

  async getCustomer(id: string) {
    return this.get<any>(`/customers/${id}`);
  }

  async getAtRiskCustomers() {
    return this.get<any[]>('/customers/at-risk');
  }

  // Pipeline
  async getPipelines() {
    return this.get<any[]>('/pipeline');
  }

  async moveLead(leadId: string, stageId: string) {
    return this.post<any>(`/pipeline/move/${leadId}/${stageId}`);
  }

  // Check-ins
  async getPendingCheckIns() {
    return this.get<any[]>('/checkins/pending');
  }

  async getCustomerCheckIns(customerId: string) {
    return this.get<any[]>(`/checkins/customer/${customerId}`);
  }

  async completeCheckIn(id: string, responses: Record<string, number | string | boolean>) {
    return this.post<any>(`/checkins/${id}/complete`, { responses });
  }

  // WhatsApp
  async sendWhatsApp(to: string, message: string) {
    return this.post<any>('/whatsapp/send', { to, message });
  }

  // Voice
  async makeVoiceCall(to: string, promptCategory: string, context?: Record<string, unknown>) {
    return this.post<any>('/voice/call', { to, promptCategory, context });
  }
}

export const api = new ApiClient(API_URL);
