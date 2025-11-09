import { Layout } from '../components/Layout.js';
import { ApiService } from '../services/apiService.js';

export class WorkflowsPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
    this.apiService = new ApiService();
    this.layout = new Layout(authService, router);
  }

  async loadWorkflows() {
    try {
      return await this.apiService.get('/workflows');
    } catch (error) {
      console.error('Error loading workflows:', error);
      return { workflows: [], total: 0 };
    }
  }

  async createWorkflow(data) {
    try {
      await this.apiService.post('/workflows', data);
      this.closeModal();
      this.render(document.getElementById('app'));
    } catch (error) {
      alert('Error creating workflow: ' + error.message);
    }
  }

  async toggleWorkflow(id) {
    try {
      await this.apiService.post(`/workflows/${id}/toggle`);
      this.render(document.getElementById('app'));
    } catch (error) {
      alert('Error toggling workflow: ' + error.message);
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
        <h1 class="page-title">Automation Workflows</h1>
        <button class="btn btn-primary" id="create-workflow-btn">Create Workflow</button>
      </div>

      <div id="workflows-content">
        <div class="spinner"></div>
      </div>

      <!-- Create Modal -->
      <div id="create-modal" class="modal-overlay" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Create New Workflow</h2>
            <button class="modal-close" id="close-modal">&times;</button>
          </div>

          <form id="create-workflow-form">
            <div class="form-group">
              <label class="form-label">Workflow Name</label>
              <input type="text" name="name" class="form-control" placeholder="Welcome Email Series" required>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea name="description" class="form-control" rows="3" placeholder="Send welcome emails to new subscribers..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Trigger</label>
              <select name="trigger" class="form-control" required>
                <option value="">Select a trigger...</option>
                <option value="contact_created">Contact Created</option>
                <option value="tag_added">Tag Added</option>
                <option value="email_opened">Email Opened</option>
                <option value="email_clicked">Email Link Clicked</option>
                <option value="form_submitted">Form Submitted</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Actions</label>
              <select name="action" class="form-control" required>
                <option value="">Select an action...</option>
                <option value="send_email">Send Email</option>
                <option value="add_tag">Add Tag</option>
                <option value="remove_tag">Remove Tag</option>
                <option value="update_field">Update Custom Field</option>
                <option value="wait">Wait (Delay)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Action Value</label>
              <input type="text" name="actionValue" class="form-control" placeholder="e.g., 'welcome' tag or campaign ID" required>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Workflow</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = this.layout.render(content);
    this.layout.attachEventListeners(container);

    // Attach event listeners
    document.getElementById('create-workflow-btn').addEventListener('click', () => {
      this.showCreateModal();
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('create-workflow-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        trigger: {
          type: formData.get('trigger')
        },
        actions: [
          {
            type: formData.get('action'),
            value: formData.get('actionValue')
          }
        ]
      };
      this.createWorkflow(data);
    });

    // Load workflows
    const workflows = await this.loadWorkflows();
    this.renderWorkflows(workflows);
  }

  renderWorkflows(data) {
    const workflowsContent = document.getElementById('workflows-content');

    if (data.workflows.length === 0) {
      workflowsContent.innerHTML = `
        <div class="card">
          <div style="text-align: center; padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: var(--text-light);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <h3 style="margin-bottom: 10px;">No workflows yet</h3>
            <p style="color: var(--text-light); margin-bottom: 20px;">Create automation workflows to save time and engage contacts</p>
            <button class="btn btn-primary" onclick="document.getElementById('create-workflow-btn').click()">Create Your First Workflow</button>
          </div>
        </div>
      `;
      return;
    }

    workflowsContent.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Triggered</th>
                <th>Completed</th>
                <th>Success Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.workflows.map(workflow => {
                const successRate = workflow.stats?.triggered > 0
                  ? ((workflow.stats.completed / workflow.stats.triggered) * 100).toFixed(1)
                  : 0;

                return `
                  <tr>
                    <td>
                      <strong>${workflow.name}</strong>
                      ${workflow.description ? `<br><small style="color: var(--text-light);">${workflow.description}</small>` : ''}
                    </td>
                    <td><span class="badge badge-primary">${workflow.trigger?.type || 'N/A'}</span></td>
                    <td><span class="badge badge-${workflow.isActive ? 'success' : 'danger'}">${workflow.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>${workflow.stats?.triggered || 0}</td>
                    <td>${workflow.stats?.completed || 0}</td>
                    <td>${successRate}%</td>
                    <td>
                      <button class="btn btn-sm ${workflow.isActive ? 'btn-danger' : 'btn-success'}" onclick="window.toggleWorkflow('${workflow.id}')">
                        ${workflow.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach toggle workflow to window for inline onclick
    window.toggleWorkflow = (id) => this.toggleWorkflow(id);
  }
}
