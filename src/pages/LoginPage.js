export class LoginPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const errorDiv = document.getElementById('login-error');

    try {
      await this.authService.login(email, password);
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
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to your account to continue</p>

          <div id="login-error" style="display: none; background: #fee; color: #c33; padding: 10px; border-radius: 6px; margin-bottom: 20px;"></div>

          <form id="login-form">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" name="email" class="form-control" placeholder="you@company.com" required>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" name="password" class="form-control" placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>

            <p class="text-center mt-20" style="color: var(--text-light);">
              Don't have an account?
              <a href="/register" style="color: var(--primary); text-decoration: none;">Sign up</a>
            </p>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => this.handleLogin(e));

    // Handle register link
    container.querySelector('a[href="/register"]').addEventListener('click', (e) => {
      e.preventDefault();
      this.router.navigate('/register');
    });
  }
}
