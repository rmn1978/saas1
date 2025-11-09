import { Layout } from '../components/Layout.js';
import { ApiService } from '../services/apiService.js';

export class ContactsPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
    this.apiService = new ApiService();
    this.layout = new Layout(authService, router);
  }

  async loadContacts() {
    try {
      return await this.apiService.get('/contacts');
    } catch (error) {
      console.error('Error loading contacts:', error);
      return { contacts: [], total: 0 };
    }
  }

  async createContact(data) {
    try {
      await this.apiService.post('/contacts', data);
      this.closeModal();
      this.render(document.getElementById('app'));
    } catch (error) {
      alert('Error creating contact: ' + error.message);
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
        <h1 class="page-title">Contacts</h1>
        <div class="flex gap-10">
          <button class="btn btn-outline" id="import-contacts-btn">Import Contacts</button>
          <button class="btn btn-primary" id="create-contact-btn">Add Contact</button>
        </div>
      </div>

      <div id="contacts-content">
        <div class="spinner"></div>
      </div>

      <!-- Create Modal -->
      <div id="create-modal" class="modal-overlay" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Add New Contact</h2>
            <button class="modal-close" id="close-modal">&times;</button>
          </div>

          <form id="create-contact-form">
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" name="email" class="form-control" placeholder="contact@example.com" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input type="text" name="firstName" class="form-control" placeholder="John">
              </div>

              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" name="lastName" class="form-control" placeholder="Doe">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Company</label>
              <input type="text" name="company" class="form-control" placeholder="Acme Inc.">
            </div>

            <div class="form-group">
              <label class="form-label">Job Title</label>
              <input type="text" name="jobTitle" class="form-control" placeholder="Marketing Director">
            </div>

            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" name="phone" class="form-control" placeholder="+1 (555) 123-4567">
            </div>

            <div class="form-group">
              <label class="form-label">Tags (comma-separated)</label>
              <input type="text" name="tags" class="form-control" placeholder="customer, vip, newsletter">
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Contact</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = this.layout.render(content);
    this.layout.attachEventListeners(container);

    // Attach event listeners
    document.getElementById('create-contact-btn').addEventListener('click', () => {
      this.showCreateModal();
    });

    document.getElementById('import-contacts-btn').addEventListener('click', () => {
      alert('Import functionality coming soon! You can use the API endpoint POST /api/contacts/import');
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('create-contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const tagsString = formData.get('tags');
      const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

      const data = {
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        company: formData.get('company'),
        jobTitle: formData.get('jobTitle'),
        phone: formData.get('phone'),
        tags
      };
      this.createContact(data);
    });

    // Load contacts
    const contacts = await this.loadContacts();
    this.renderContacts(contacts);
  }

  renderContacts(data) {
    const contactsContent = document.getElementById('contacts-content');

    if (data.contacts.length === 0) {
      contactsContent.innerHTML = `
        <div class="card">
          <div style="text-align: center; padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: var(--text-light);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h3 style="margin-bottom: 10px;">No contacts yet</h3>
            <p style="color: var(--text-light); margin-bottom: 20px;">Add contacts to start building your audience</p>
            <button class="btn btn-primary" onclick="document.getElementById('create-contact-btn').click()">Add Your First Contact</button>
          </div>
        </div>
      `;
      return;
    }

    contactsContent.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="form-group" style="margin: 0; max-width: 300px;">
            <input type="text" class="form-control" placeholder="Search contacts..." id="search-input">
          </div>
          <div>Total: ${data.total} contacts</div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Company</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Lead Score</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              ${data.contacts.map(contact => `
                <tr>
                  <td><strong>${contact.email}</strong></td>
                  <td>${contact.firstName || ''} ${contact.lastName || ''}</td>
                  <td>${contact.company || '-'}</td>
                  <td><span class="badge badge-${contact.status === 'subscribed' ? 'success' : 'danger'}">${contact.status}</span></td>
                  <td>
                    ${(contact.tags || []).map(tag => `<span class="badge badge-primary" style="margin-right: 5px;">${tag}</span>`).join('') || '-'}
                  </td>
                  <td>${contact.leadScore || 0}</td>
                  <td>${new Date(contact.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
