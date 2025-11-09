import { Layout } from '../components/Layout.js';
import { ApiService } from '../services/apiService.js';

export class SegmentsPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
    this.apiService = new ApiService();
    this.layout = new Layout(authService, router);
  }

  async loadSegments() {
    try {
      return await this.apiService.get('/segments');
    } catch (error) {
      console.error('Error loading segments:', error);
      return { segments: [], total: 0 };
    }
  }

  async createSegment(data) {
    try {
      await this.apiService.post('/segments', data);
      this.closeModal();
      this.render(document.getElementById('app'));
    } catch (error) {
      alert('Error creating segment: ' + error.message);
    }
  }

  async testSegment(criteria) {
    try {
      const result = await this.apiService.post('/segments/test', { criteria });
      return result;
    } catch (error) {
      console.error('Error testing segment:', error);
      return null;
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
        <h1 class="page-title">Contact Segments</h1>
        <button class="btn btn-primary" id="create-segment-btn">Create Segment</button>
      </div>

      <div class="card mb-20">
        <div class="card-header">
          <h3 class="card-title">What are Segments?</h3>
        </div>
        <p style="padding: 0 20px 20px;">
          Segments help you organize contacts into targeted groups based on criteria like tags, lead score, activity, and more.
          Use segments to send more relevant campaigns and track specific audience behaviors.
        </p>
      </div>

      <div id="segments-content">
        <div class="spinner"></div>
      </div>

      <!-- Create Modal -->
      <div id="create-modal" class="modal-overlay" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Create New Segment</h2>
            <button class="modal-close" id="close-modal">&times;</button>
          </div>

          <form id="create-segment-form">
            <div class="form-group">
              <label class="form-label">Segment Name</label>
              <input type="text" name="name" class="form-control" placeholder="VIP Customers" required>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea name="description" class="form-control" rows="2" placeholder="High-value customers with engagement"></textarea>
            </div>

            <h4 style="margin-bottom: 15px;">Criteria</h4>

            <div class="form-group">
              <label class="form-label">Tags (comma-separated)</label>
              <input type="text" name="tags" class="form-control" placeholder="customer, vip">
              <small style="color: var(--text-light);">Contacts must have at least one of these tags</small>
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select name="status" class="form-control">
                <option value="">Any status</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label class="form-label">Min Lead Score</label>
                <input type="number" name="leadScoreMin" class="form-control" placeholder="0" min="0">
              </div>

              <div class="form-group">
                <label class="form-label">Max Lead Score</label>
                <input type="number" name="leadScoreMax" class="form-control" placeholder="1000" max="1000">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Company Name Contains</label>
              <input type="text" name="company" class="form-control" placeholder="Tech Corp">
            </div>

            <div class="form-group">
              <label class="form-label">Email Domain</label>
              <input type="text" name="emailDomain" class="form-control" placeholder="example.com">
              <small style="color: var(--text-light);">Only include contacts from this domain</small>
            </div>

            <div id="test-results" style="display: none; margin: 20px 0; padding: 15px; background: #f0f9ff; border-radius: 6px;">
              <strong>Test Results:</strong>
              <div id="test-results-content"></div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: space-between; margin-top: 20px;">
              <button type="button" class="btn btn-outline" id="test-segment-btn">Test Criteria</button>
              <div style="display: flex; gap: 10px;">
                <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Segment</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = this.layout.render(content);
    this.layout.attachEventListeners(container);

    // Attach event listeners
    document.getElementById('create-segment-btn').addEventListener('click', () => {
      this.showCreateModal();
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('test-segment-btn').addEventListener('click', async () => {
      const form = document.getElementById('create-segment-form');
      const criteria = this.buildCriteria(form);
      const result = await this.testSegment(criteria);

      const resultsDiv = document.getElementById('test-results');
      const resultsContent = document.getElementById('test-results-content');

      if (result) {
        resultsContent.innerHTML = `
          <p style="margin: 10px 0;">
            <strong>${result.contactCount}</strong> contacts match this criteria
          </p>
          ${result.sampleContacts.length > 0 ? `
            <p style="margin-top: 10px; font-size: 14px;">Sample contacts:</p>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${result.sampleContacts.slice(0, 5).map(c => `<li>${c.email}</li>`).join('')}
            </ul>
          ` : ''}
        `;
        resultsDiv.style.display = 'block';
      }
    });

    document.getElementById('create-segment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        criteria: this.buildCriteria(form),
        isDynamic: true
      };

      this.createSegment(data);
    });

    // Load segments
    const segments = await this.loadSegments();
    this.renderSegments(segments);
  }

  buildCriteria(form) {
    const formData = new FormData(form);
    const criteria = {};

    const tagsString = formData.get('tags');
    if (tagsString) {
      criteria.tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
    }

    const status = formData.get('status');
    if (status) {
      criteria.status = status;
    }

    const leadScoreMin = formData.get('leadScoreMin');
    if (leadScoreMin) {
      criteria.leadScoreMin = parseInt(leadScoreMin);
    }

    const leadScoreMax = formData.get('leadScoreMax');
    if (leadScoreMax) {
      criteria.leadScoreMax = parseInt(leadScoreMax);
    }

    const company = formData.get('company');
    if (company) {
      criteria.company = company;
    }

    const emailDomain = formData.get('emailDomain');
    if (emailDomain) {
      criteria.emailDomain = emailDomain;
    }

    return criteria;
  }

  renderSegments(data) {
    const segmentsContent = document.getElementById('segments-content');

    if (data.segments.length === 0) {
      segmentsContent.innerHTML = `
        <div class="card">
          <div style="text-align: center; padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: var(--text-light);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <h3 style="margin-bottom: 10px;">No segments yet</h3>
            <p style="color: var(--text-light); margin-bottom: 20px;">Create segments to organize and target your contacts more effectively</p>
            <button class="btn btn-primary" onclick="document.getElementById('create-segment-btn').click()">Create Your First Segment</button>
          </div>
        </div>
      `;
      return;
    }

    segmentsContent.innerHTML = `
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        ${data.segments.map(segment => `
          <div class="stat-card">
            <div class="stat-label">${segment.name}</div>
            <div class="stat-value">${segment.contactCount}</div>
            <div class="stat-change">${segment.isDynamic ? 'Dynamic' : 'Static'} segment</div>
            ${segment.description ? `<p style="font-size: 13px; color: var(--text-light); margin-top: 10px;">${segment.description}</p>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="card mt-20">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Contacts</th>
                <th>Type</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.segments.map(segment => `
                <tr>
                  <td><strong>${segment.name}</strong></td>
                  <td>${segment.description || '-'}</td>
                  <td>${segment.contactCount}</td>
                  <td><span class="badge badge-${segment.isDynamic ? 'primary' : 'secondary'}">${segment.isDynamic ? 'Dynamic' : 'Static'}</span></td>
                  <td>${new Date(segment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" onclick="window.viewSegment('${segment.id}')">View Contacts</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach view segment function
    window.viewSegment = async (id) => {
      try {
        const result = await this.apiService.get(`/segments/${id}/contacts`);
        alert(`Segment contains ${result.total} contacts. Check console for details.`);
        console.log('Segment contacts:', result);
      } catch (error) {
        alert('Error loading segment contacts: ' + error.message);
      }
    };
  }
}
