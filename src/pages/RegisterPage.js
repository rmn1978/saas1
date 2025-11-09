export class RegisterPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
  }

  async handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const errorDiv = document.getElementById('register-error');

    const data = {
      email: form.email.value,
      password: form.password.value,
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      organizationName: form.organizationName.value
    };

    if (form.password.value !== form.confirmPassword.value) {
      errorDiv.textContent = 'Passwords do not match';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      await this.authService.register(data);
      this.router.navigate('/dashboard');
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  }

  render(container) {
    container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">Marketing Automation</div>
          <h1 class="auth-title">Get Started</h1>
          <p class="auth-subtitle">Create your account and start automating</p>

          <div id="register-error" style="display: none; background: #fee; color: #c33; padding: 10px; border-radius: 6px; margin-bottom: 20px;"></div>

          <form id="register-form">
            <div class="form-group">
              <label class="form-label">Organization Name</label>
              <input type="text" name="organizationName" class="form-control" placeholder="Your Company" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input type="text" name="firstName" class="form-control" placeholder="John" required>
              </div>

              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" name="lastName" class="form-control" placeholder="Doe" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" name="email" class="form-control" placeholder="you@company.com" required>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" name="password" class="form-control" placeholder="••••••••" required minlength="6">
            </div>

            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input type="password" name="confirmPassword" class="form-control" placeholder="••••••••" required minlength="6">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>

            <p class="text-center mt-20" style="color: var(--text-light);">
              Already have an account?
              <a href="/login" style="color: var(--primary); text-decoration: none;">Sign in</a>
            </p>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('register-form');
    form.addEventListener('submit', (e) => this.handleRegister(e));

    // Handle login link
    container.querySelector('a[href="/login"]').addEventListener('click', (e) => {
      e.preventDefault();
      this.router.navigate('/login');
    });
  }
}
