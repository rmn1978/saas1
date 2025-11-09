import { ApiService } from './apiService.js';

export class AuthService {
  constructor() {
    this.apiService = new ApiService();
    this.tokenKey = 'auth_token';
    this.userKey = 'user_data';
  }

  async register(data) {
    const response = await this.apiService.post('/auth/register', data);
    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
    }
    return response;
  }

  async login(email, password) {
    const response = await this.apiService.post('/auth/login', { email, password });
    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
    }
    return response;
  }

  async getProfile() {
    return await this.apiService.get('/auth/profile');
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    window.location.href = '/login';
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}
