import { AuthService } from './services/authService.js';
import { Router } from './router.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CampaignsPage } from './pages/CampaignsPage.js';
import { ContactsPage } from './pages/ContactsPage.js';
import { WorkflowsPage } from './pages/WorkflowsPage.js';
import { SegmentsPage } from './pages/SegmentsPage.js';

export class App {
  constructor() {
    this.authService = new AuthService();
    this.router = new Router();
    this.currentPage = null;
  }

  init() {
    // Setup routes
    this.setupRoutes();

    // Check authentication
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate('/login');
    } else {
      this.router.navigate('/dashboard');
    }

    // Listen for route changes
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Initial route
    this.handleRoute();
  }

  setupRoutes() {
    this.router.addRoute('/login', () => {
      this.renderPage(new LoginPage(this.authService, this.router));
    });

    this.router.addRoute('/register', () => {
      this.renderPage(new RegisterPage(this.authService, this.router));
    });

    this.router.addRoute('/dashboard', () => {
      if (!this.authService.getToken()) {
        this.router.navigate('/login');
        return;
      }
      this.renderPage(new DashboardPage(this.authService, this.router));
    });

    this.router.addRoute('/campaigns', () => {
      if (!this.authService.getToken()) {
        this.router.navigate('/login');
        return;
      }
      this.renderPage(new CampaignsPage(this.authService, this.router));
    });

    this.router.addRoute('/contacts', () => {
      if (!this.authService.getToken()) {
        this.router.navigate('/login');
        return;
      }
      this.renderPage(new ContactsPage(this.authService, this.router));
    });

    this.router.addRoute('/workflows', () => {
      if (!this.authService.getToken()) {
        this.router.navigate('/login');
        return;
      }
      this.renderPage(new WorkflowsPage(this.authService, this.router));
    });

    this.router.addRoute('/segments', () => {
      if (!this.authService.getToken()) {
        this.router.navigate('/login');
        return;
      }
      this.renderPage(new SegmentsPage(this.authService, this.router));
    });
  }

  handleRoute() {
    const path = window.location.pathname;
    this.router.handleRoute(path);
  }

  renderPage(page) {
    const appElement = document.getElementById('app');
    appElement.innerHTML = '';
    page.render(appElement);
  }
}
