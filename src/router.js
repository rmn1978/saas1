export class Router {
  constructor() {
    this.routes = {};
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  }

  handleRoute(path) {
    const handler = this.routes[path];
    if (handler) {
      handler();
    } else {
      // Default to login if route not found
      this.navigate('/login');
    }
  }
}
