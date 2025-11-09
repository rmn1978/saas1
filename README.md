# Marketing Automation SaaS Platform

A comprehensive, production-ready marketing automation platform built with Node.js, Express, PostgreSQL, and vanilla JavaScript. Perfect for companies looking to automate their email marketing, manage leads, and track campaign performance.

## Features

### Core Features
- **Email Campaign Management**: Create, schedule, and send email campaigns with drag-and-drop builder
- **Lead Management & Segmentation**: Advanced contact management with custom fields, tags, and dynamic segmentation
- **Automation Workflows**: Visual workflow builder with triggers and actions for marketing automation
- **Analytics Dashboard**: Real-time analytics with open rates, click rates, and conversion tracking
- **A/B Testing**: Test different email variations to optimize campaign performance
- **Multi-tenant Architecture**: Fully isolated organization data with role-based access control
- **Template Library**: Pre-built email templates with customization options
- **Email Tracking**: Track opens, clicks, bounces, and unsubscribes automatically

### Technical Features
- RESTful API with JWT authentication
- PostgreSQL database with Sequelize ORM
- Redis for job queuing and caching
- Email service integration (SMTP)
- Rate limiting and security headers
- Responsive UI with no framework dependencies
- Real-time email tracking with pixel tracking

## Tech Stack

**Backend:**
- Node.js & Express
- PostgreSQL (Database)
- Sequelize (ORM)
- Redis (Job Queue)
- JWT (Authentication)
- Nodemailer (Email Service)
- Bull (Queue Management)

**Frontend:**
- Vanilla JavaScript (ES6+)
- Vite (Build Tool)
- CSS3 (Custom Styling)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd marketing-automation-saas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketing_automation
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Service (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourcompany.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Set Up Database
Create a PostgreSQL database:
```bash
createdb marketing_automation
```

The database schema will be created automatically when you start the server for the first time.

### 5. Start Redis
Make sure Redis is running:
```bash
redis-server
```

### 6. Run the Application

**Development Mode:**
```bash
npm run dev
```

This will start both the backend server (port 3000) and frontend dev server (port 5173).

**Production Build:**
```bash
npm run build
npm start
```

## API Documentation

### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Inc"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Campaigns

**Create Campaign**
```http
POST /api/campaigns
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Summer Sale 2024",
  "subject": "Don't miss our summer sale!",
  "fromName": "Your Company",
  "fromEmail": "hello@company.com",
  "htmlContent": "<h1>Hello {{firstName}}!</h1>",
  "scheduledAt": "2024-07-01T10:00:00Z"
}
```

**Get Campaigns**
```http
GET /api/campaigns
Authorization: Bearer <token>
```

**Get Campaign Stats**
```http
GET /api/campaigns/:id/stats
Authorization: Bearer <token>
```

### Contacts

**Create Contact**
```http
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "contact@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Tech Corp",
  "tags": ["customer", "vip"]
}
```

**Import Contacts**
```http
POST /api/contacts/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "contacts": [
    {
      "email": "user1@example.com",
      "firstName": "User",
      "lastName": "One"
    },
    {
      "email": "user2@example.com",
      "firstName": "User",
      "lastName": "Two"
    }
  ]
}
```

### Workflows

**Create Workflow**
```http
POST /api/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Welcome Series",
  "trigger": {
    "type": "contact_created"
  },
  "actions": [
    {
      "type": "send_email",
      "campaignId": "campaign-uuid"
    },
    {
      "type": "wait",
      "duration": "2d"
    },
    {
      "type": "add_tag",
      "tag": "welcomed"
    }
  ]
}
```

**Toggle Workflow**
```http
POST /api/workflows/:id/toggle
Authorization: Bearer <token>
```

## Database Schema

### Key Models

**Organization**: Multi-tenant organization data
- Plan management (free, starter, professional, enterprise)
- Email limits and usage tracking
- Custom settings and branding

**User**: User accounts with role-based access
- Admin, User, and Viewer roles
- Organization membership
- Authentication data

**Contact**: Lead and customer data
- Contact information and custom fields
- Tags and segmentation
- Lead scoring
- Activity tracking

**Campaign**: Email campaign data
- Campaign configuration
- Template and content
- Scheduling
- Statistics (sent, opened, clicked, etc.)

**Workflow**: Automation workflow data
- Trigger configuration
- Actions and conditions
- Execution statistics

**EmailEvent**: Email tracking data
- Opens, clicks, bounces, unsubscribes
- Device and location data
- Timestamp tracking

## Email Template Variables

Use these variables in your email content:

- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{email}}` - Contact's email
- `{{company}}` - Contact's company
- `{{jobTitle}}` - Contact's job title

Example:
```html
<h1>Hi {{firstName}}!</h1>
<p>Welcome to {{company}}!</p>
```

## Deployment

### Environment Setup

1. Set `NODE_ENV=production` in your environment
2. Use a strong JWT secret
3. Configure production database
4. Set up Redis instance
5. Configure SMTP service (SendGrid, AWS SES, etc.)

### Recommended Services

- **Database**: AWS RDS, Heroku Postgres, DigitalOcean Managed Database
- **Redis**: AWS ElastiCache, Redis Cloud, Heroku Redis
- **Email**: SendGrid, AWS SES, Mailgun, Postmark
- **Hosting**: AWS EC2, Heroku, DigitalOcean, Vercel (frontend)

### Docker Deployment

```dockerfile
# Coming soon: Docker Compose configuration
```

## Subscription Plans

The platform supports multiple subscription tiers:

| Plan | Monthly Email Limit | Features |
|------|---------------------|----------|
| Free | 1,000 | Basic features, 1 user |
| Starter | 10,000 | All features, 3 users |
| Professional | 50,000 | All features, unlimited users |
| Enterprise | Unlimited | Custom features, dedicated support |

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js security headers
- SQL injection prevention (Sequelize ORM)
- XSS protection
- Input validation and sanitization

## Performance Optimization

- Database indexing on frequently queried fields
- Connection pooling
- Redis caching for session data
- Pagination for large datasets
- Background job processing with Bull
- Email sending queue

## Monitoring & Analytics

Track key metrics:
- Campaign performance (open rate, click rate, conversion rate)
- Contact engagement and lead scoring
- Workflow execution statistics
- API usage and rate limits
- Database performance

## Roadmap

- [ ] Drag-and-drop email builder
- [ ] Advanced segmentation with AND/OR logic
- [ ] SMS campaigns
- [ ] WhatsApp integration
- [ ] Landing page builder
- [ ] Form builder
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Webhook support
- [ ] Custom reporting dashboard
- [ ] Mobile app

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yourcompany.com or join our Slack channel.

## Acknowledgments

- Built with modern web technologies
- Inspired by leading marketing automation platforms
- Community-driven development

---

**Built with Claude Code** - [https://claude.com/claude-code](https://claude.com/claude-code)
