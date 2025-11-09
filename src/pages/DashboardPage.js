import { Layout } from '../components/Layout.js';
import { ApiService } from '../services/apiService.js';

export class DashboardPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
    this.apiService = new ApiService();
    this.layout = new Layout(authService, router);
  }

  async loadDashboardData() {
    try {
      const [campaigns, contacts, workflows] = await Promise.all([
        this.apiService.get('/campaigns?limit=5'),
        this.apiService.get('/contacts?limit=5'),
        this.apiService.get('/workflows?limit=5')
      ]);

      return { campaigns, contacts, workflows };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      return { campaigns: { campaigns: [], total: 0 }, contacts: { contacts: [], total: 0 }, workflows: { workflows: [], total: 0 } };
    }
  }

  async render(container) {
    const content = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
      </div>

      <div id="dashboard-content">
        <div class="spinner"></div>
      </div>
    `;

    container.innerHTML = this.layout.render(content);
    this.layout.attachEventListeners(container);

    // Load data
    const data = await this.loadDashboardData();
    this.renderDashboard(data);
  }

  renderDashboard(data) {
    const dashboardContent = document.getElementById('dashboard-content');

    const totalSent = data.campaigns.campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
    const totalOpened = data.campaigns.campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;

    dashboardContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Campaigns</div>
          <div class="stat-value">${data.campaigns.total}</div>
          <div class="stat-change positive">Active campaigns</div>
        </div>

        <div class="stat-card success">
          <div class="stat-label">Total Contacts</div>
          <div class="stat-value">${data.contacts.total}</div>
          <div class="stat-change positive">Subscribed contacts</div>
        </div>

        <div class="stat-card warning">
          <div class="stat-label">Emails Sent</div>
          <div class="stat-value">${totalSent}</div>
          <div class="stat-change">This month</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Open Rate</div>
          <div class="stat-value">${openRate}%</div>
          <div class="stat-change ${openRate > 20 ? 'positive' : 'negative'}">${openRate > 20 ? 'Good' : 'Needs work'}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Campaigns</h3>
            <button class="btn btn-primary btn-sm" id="view-all-campaigns">View All</button>
          </div>
          <div class="table-container">
            ${data.campaigns.campaigns.length > 0 ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.campaigns.campaigns.map(campaign => `
                    <tr>
                      <td>${campaign.name}</td>
                      <td><span class="badge badge-${this.getStatusBadge(campaign.status)}">${campaign.status}</span></td>
                      <td>${campaign.stats?.sent || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: var(--text-light); padding: 20px;">No campaigns yet</p>'}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Contacts</h3>
            <button class="btn btn-primary btn-sm" id="view-all-contacts">View All</button>
          </div>
          <div class="table-container">
            ${data.contacts.contacts.length > 0 ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.contacts.contacts.map(contact => `
                    <tr>
                      <td>${contact.email}</td>
                      <td><span class="badge badge-${contact.status === 'subscribed' ? 'success' : 'danger'}">${contact.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: var(--text-light); padding: 20px;">No contacts yet</p>'}
          </div>
        </div>
      </div>

      <div class="card mt-20">
        <div class="card-header">
          <h3 class="card-title">Active Workflows</h3>
          <button class="btn btn-primary btn-sm" id="view-all-workflows">View All</button>
        </div>
        ${data.workflows.workflows.length > 0 ? `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Triggered</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                ${data.workflows.workflows.map(workflow => `
                  <tr>
                    <td>${workflow.name}</td>
                    <td><span class="badge badge-${workflow.isActive ? 'success' : 'danger'}">${workflow.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>${workflow.stats?.triggered || 0}</td>
                    <td>${workflow.stats?.completed || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p style="text-align: center; color: var(--text-light); padding: 20px;">No workflows yet</p>'}
      </div>
    `;

    // Attach event listeners
    document.getElementById('view-all-campaigns')?.addEventListener('click', () => {
      this.router.navigate('/campaigns');
    });

    document.getElementById('view-all-contacts')?.addEventListener('click', () => {
      this.router.navigate('/contacts');
    });

    document.getElementById('view-all-workflows')?.addEventListener('click', () => {
      this.router.navigate('/workflows');
    });
  }

  getStatusBadge(status) {
    const badges = {
      'draft': 'primary',
      'scheduled': 'warning',
      'sending': 'warning',
      'sent': 'success',
      'failed': 'danger'
    };
    return badges[status] || 'primary';
  }
}
