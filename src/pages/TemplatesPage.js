import { Layout } from '../components/Layout.js';
import { ApiService } from '../services/apiService.js';

export class TemplatesPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
    this.apiService = new ApiService();
    this.layout = new Layout(authService, router);
  }

  async loadTemplates() {
    try {
      return await this.apiService.get('/templates');
    } catch (error) {
      console.error('Error loading templates:', error);
      return { templates: [], total: 0 };
    }
  }

  async createTemplate(data) {
    try {
      await this.apiService.post('/templates', data);
      this.closeModal();
      this.render(document.getElementById('app'));
    } catch (error) {
      alert('Error creating template: ' + error.message);
    }
  }

  async duplicateTemplate(id) {
    try {
      await this.apiService.post(`/templates/${id}/duplicate`);
      this.render(document.getElementById('app'));
    } catch (error) {
      alert('Error duplicating template: ' + error.message);
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
        <h1 class="page-title">Email Templates</h1>
        <button class="btn btn-primary" id="create-template-btn">Create Template</button>
      </div>

      <div class="card mb-20">
        <div class="card-header">
          <h3 class="card-title">Template Library</h3>
        </div>
        <p style="padding: 0 20px 20px;">
          Use pre-built templates or create custom ones for your email campaigns. Templates support variables like {{firstName}}, {{company}}, and more.
        </p>
      </div>

      <div id="templates-content">
        <div class="spinner"></div>
      </div>

      <!-- Create Modal -->
      <div id="create-modal" class="modal-overlay" style="display: none;">
        <div class="modal" style="max-width: 800px;">
          <div class="modal-header">
            <h2 class="modal-title">Create New Template</h2>
            <button class="modal-close" id="close-modal">&times;</button>
          </div>

          <form id="create-template-form">
            <div class="form-group">
              <label class="form-label">Template Name</label>
              <input type="text" name="name" class="form-control" placeholder="My Amazing Template" required>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea name="description" class="form-control" rows="2" placeholder="Describe your template..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-control">
                <option value="custom">Custom</option>
                <option value="welcome">Welcome</option>
                <option value="newsletter">Newsletter</option>
                <option value="announcement">Announcement</option>
                <option value="promotion">Promotion</option>
                <option value="transactional">Transactional</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">HTML Content</label>
              <textarea name="htmlContent" class="form-control" rows="10" placeholder="<h1>Hello {{firstName}}!</h1>" required></textarea>
              <small style="color: var(--text-light);">Use {{firstName}}, {{lastName}}, {{email}}, {{company}} for personalization</small>
            </div>

            <div class="form-group">
              <label class="form-label">Plain Text Content (Optional)</label>
              <textarea name="textContent" class="form-control" rows="4" placeholder="Hello {{firstName}}!"></textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Template</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = this.layout.render(content);
    this.layout.attachEventListeners(container);

    // Attach event listeners
    document.getElementById('create-template-btn').addEventListener('click', () => {
      this.showCreateModal();
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('create-template-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        category: formData.get('category'),
        htmlContent: formData.get('htmlContent'),
        textContent: formData.get('textContent') || formData.get('htmlContent').replace(/<[^>]*>/g, '')
      };

      this.createTemplate(data);
    });

    // Load templates
    const templates = await this.loadTemplates();
    this.renderTemplates(templates);
  }

  renderTemplates(data) {
    const templatesContent = document.getElementById('templates-content');

    if (data.templates.length === 0) {
      templatesContent.innerHTML = `
        <div class="card">
          <div style="text-align: center; padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: var(--text-light);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 style="margin-bottom: 10px;">No templates yet</h3>
            <p style="color: var(--text-light); margin-bottom: 20px;">Create your first email template to get started</p>
            <button class="btn btn-primary" onclick="document.getElementById('create-template-btn').click()">Create Your First Template</button>
          </div>
        </div>
      `;
      return;
    }

    // Group templates by category
    const templatesByCategory = data.templates.reduce((acc, template) => {
      const category = template.category || 'custom';
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {});

    let html = '';

    for (const [category, templates] of Object.entries(templatesByCategory)) {
      html += `
        <div class="card mb-20">
          <div class="card-header">
            <h3 class="card-title">${category.charAt(0).toUpperCase() + category.slice(1)} Templates</h3>
            <span class="badge badge-primary">${templates.length}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px;">
            ${templates.map(template => `
              <div style="border: 1px solid var(--border); border-radius: 8px; padding: 20px; transition: all 0.2s; cursor: pointer;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <h4 style="margin: 0; color: var(--dark);">${template.name}</h4>
                  ${template.organizationId ? '<span class="badge badge-success">Custom</span>' : '<span class="badge badge-primary">System</span>'}
                </div>

                ${template.description ? `<p style="color: var(--text-light); font-size: 14px; margin: 10px 0;">${template.description}</p>` : ''}

                <div style="background: #f9fafb; padding: 10px; border-radius: 4px; margin: 10px 0; max-height: 100px; overflow: hidden; font-size: 12px; color: var(--text-light);">
                  <code>${template.htmlContent.substring(0, 150)}...</code>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 15px;">
                  <button class="btn btn-sm btn-primary" onclick="window.useTemplate('${template.id}')" style="flex: 1;">
                    Use Template
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="window.duplicateTemplate('${template.id}')">
                    Duplicate
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-light); margin-top: 10px;">
                  ${template.usageCount || 0} times used
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    templatesContent.innerHTML = html;

    // Attach functions
    window.useTemplate = async (id) => {
      alert(`Navigate to Campaigns and select this template. Template ID: ${id}`);
      // In a real app, navigate to create campaign with template pre-selected
    };

    window.duplicateTemplate = (id) => this.duplicateTemplate(id);
  }
}
