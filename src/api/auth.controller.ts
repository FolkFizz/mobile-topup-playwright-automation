import { APIRequestContext, APIResponse } from '@playwright/test';

export interface AuthPayload {
  email: string;
  password: string;
}

export class AuthController {
  readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async register(data: AuthPayload): Promise<APIResponse> {
    return this.request.post('/api/register', { data });
  }

  async login(data: AuthPayload): Promise<APIResponse> {
    return this.request.post('/api/login', { data });
  }
}
