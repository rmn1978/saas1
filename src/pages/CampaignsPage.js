import { Layout } from '../components/Layout.js';
import { ApiService } from '../services/apiService.js';

export class CampaignsPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
    this.apiService = new ApiService();
    this.layout = new Layout(authService, router);
  }

  async loadCampaigns() {
    try {
      return await this.apiService.get('/campaigns');
    } catch (error) {
      console.error('Error loading campaigns:', error);
      return { campaigns: [], total: 0 };
    }
  }

  async createCampaign(data) {
    try {
      await this.apiService.post('/campaigns', data);
      this.closeModal();
      this.render(document.getElementById('app'));
    } catch (error) {
      alert('Error creating campaign: ' + error.message);
    }
  }

  showCreateModal() {
    const modal = document.getElementById('create-modal');
    modal.style.display = 'flex';
  }

  closeModal() {
    const modal = document.getElementById('create-modal');
    modal.style.display = 'none';
  }

  async render(container) {
    const content = `
      <div class="page-header">
        <h1 class="page-title">Email Campaigns</h1>
        <button class="btn btn-primary" id="create-campaign-btn">Create Campaign</button>
      </div>

      <div id="campaigns-content">
        <div class="spinner"></div>
      </div>

      <!-- Create Modal -->
      <div id="create-modal" class="modal-overlay" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Create New Campaign</h2>
            <button class="modal-close" id="close-modal">&times;</button>
          </div>

          <form id="create-campaign-form">
            <div class="form-group">
              <label class="form-label">Campaign Name</label>
              <input type="text" name="name" class="form-control" placeholder="Summer Sale 2024" required>
            </div>

            <div class="form-group">
              <label class="form-label">Email Subject</label>
              <input type="text" name="subject" class="form-control" placeholder="Don't miss our summer sale!" required>
            </div>

            <div class="form-group">
              <label class="form-label">Preview Text</label>
              <input type="text" name="previewText" class="form-control" placeholder="Get up to 50% off...">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label class="form-label">From Name</label>
                <input type="text" name="fromName" class="form-control" placeholder="Your Company" required>
              </div>

              <div class="form-group">
                <label class="form-label">From Email</label>
                <input type="email" name="fromEmail" class="form-control" placeholder="hello@company.com" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email Content (HTML)</label>
              <textarea name="htmlContent" class="form-control" rows="6" placeholder="<h1>Hello {{firstName}}!</h1>..." required></textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Campaign</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = this.layout.render(content);
    this.layout.attachEventListeners(container);

    // Attach event listeners
    document.getElementById('create-campaign-btn').addEventListener('click', () => {
      this.showCreateModal();
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('create-campaign-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        subject: formData.get('subject'),
        previewText: formData.get('previewText'),
        fromName: formData.get('fromName'),
        fromEmail: formData.get('fromEmail'),
        htmlContent: formData.get('htmlContent'),
        textContent: formData.get('htmlContent').replace(/<[^>]*>/g, '')
      };
      this.createCampaign(data);
    });

    // Load campaigns
    const campaigns = await this.loadCampaigns();
    this.renderCampaigns(campaigns);
  }

  renderCampaigns(data) {
    const campaignsContent = document.getElementById('campaigns-content');

    if (data.campaigns.length === 0) {
      campaignsContent.innerHTML = `
        <div class="card">
          <div style="text-align: center; padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: var(--text-light);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <h3 style="margin-bottom: 10px;">No campaigns yet</h3>
            <p style="color: var(--text-light); margin-bottom: 20px;">Create your first email campaign to get started</p>
            <button class="btn btn-primary" onclick="document.getElementById('create-campaign-btn').click()">Create Your First Campaign</button>
          </div>
        </div>
      `;
      return;
    }

    campaignsContent.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Opened</th>
                <th>Clicked</th>
                <th>Open Rate</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${data.campaigns.map(campaign => {
                const openRate = campaign.stats?.sent > 0
                  ? ((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1)
                  : 0;

                return `
                  <tr>
                    <td><strong>${campaign.name}</strong></td>
                    <td>${campaign.subject}</td>
                    <td><span class="badge badge-${this.getStatusBadge(campaign.status)}">${campaign.status}</span></td>
                    <td>${campaign.stats?.sent || 0}</td>
                    <td>${campaign.stats?.opened || 0}</td>
                    <td>${campaign.stats?.clicked || 0}</td>
                    <td>${openRate}%</td>
                    <td>${new Date(campaign.createdAt).toLocaleDateString()}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
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
