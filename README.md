# JobPop Company Backend

Express.js REST API for the JobPop hiring company portal. This backend allows companies to register, upload certificates, manage subscriptions, and post job listings.

## 🚀 Features

- **Company Registration & Authentication** - JWT-based auth with password hashing
- **Certificate Upload** - File upload to Supabase Storage for verification
- **Job Management** - Full CRUD operations for job postings
- **Subscription System** - Monthly, annual, and per-job plans with Pesapal integration
- **Admin Verification** - Company verification workflow
- **Security** - Rate limiting, CORS, helmet, input validation
- **File Upload** - Secure file handling with type and size validation

## 🏗️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Supabase PostgreSQL
- **Authentication:** JWT + bcrypt
- **File Storage:** Supabase Storage
- **Payments:** Pesapal API (sandbox/production)
- **Security:** Helmet, CORS, Rate Limiting
- **Validation:** express-validator

## 📦 Installation

1. **Clone and navigate:**
   ```bash
   cd jobpop-company-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual values:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_long_random_jwt_secret
   PESAPAL_CONSUMER_KEY=your_pesapal_key
   PESAPAL_CONSUMER_SECRET=your_pesapal_secret
   ```

4. **Database setup:**
   - Open Supabase SQL Editor
   - Run the SQL commands in `database_setup.sql`
   - This creates the required tables, indexes, and RLS policies

5. **Create uploads directory:**
   ```bash
   mkdir uploads
   ```

6. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🛠️ API Endpoints

### Authentication
```
POST /api/auth/register     - Register new company
POST /api/auth/login        - Company login
GET  /api/auth/profile      - Get profile (auth required)
PUT  /api/auth/profile      - Update profile (auth required)
```

### Company Management
```
POST /api/companies/certificate    - Upload certificate (auth required)
GET  /api/companies/me             - Get company info (auth required)
GET  /api/companies/verification-status - Get verification status (auth required)
```

### Job Management
```
GET  /api/jobs/categories   - Get job categories (public)
GET  /api/jobs/my          - Get company's jobs (auth + verified required)
GET  /api/jobs/:id         - Get specific job (auth + verified required)
POST /api/jobs             - Create job (auth + verified + subscription required)
PUT  /api/jobs/:id         - Update job (auth + verified + subscription required)
DELETE /api/jobs/:id       - Delete job (auth + verified + subscription required)
```

### Subscriptions
```
GET  /api/subscription/plans        - Get subscription plans (public)
GET  /api/subscription/current      - Get current subscription (auth required)
POST /api/subscription/initiate     - Initiate payment (auth + verified required)
POST /api/subscription/callback     - Payment webhook (Pesapal)
POST /api/subscription/simulate-payment - Test payment (development only)
```

### Health Check
```
GET  /health               - Server health status
```

## 🔐 Authentication Flow

1. **Company Registration:**
   ```javascript
   POST /api/auth/register
   {
     "name": "Company Name",
     "email": "company@example.com",
     "phone": "+256700000000",
     "country": "Uganda",
     "password": "SecurePassword123"
   }
   ```

2. **Certificate Upload:**
   ```javascript
   POST /api/companies/certificate
   Content-Type: multipart/form-data
   Authorization: Bearer <token>
   
   Form data:
   - certificate: <file> (PDF, JPG, PNG, max 2MB)
   ```

3. **Admin Verification:** (Manual process)

4. **Subscription Purchase:**
   ```javascript
   POST /api/subscription/initiate
   Authorization: Bearer <token>
   {
     "planType": "monthly" // or "annual" or "per_job"
   }
   ```

5. **Job Posting:**
   ```javascript
   POST /api/jobs
   Authorization: Bearer <token>
   {
     "title": "Job Title",
     "description": "Job description...",
     "category": "IT & Technical",
     "country": "Uganda",
     "deadline": "2025-12-31T23:59:59Z",
     "salary": "UGX 1,000,000",
     "email": "apply@company.com"
   }
   ```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - 100 requests/15min, 5 auth requests/15min
- **Input Validation** - express-validator for all inputs
- **File Upload Security** - Type, size, and content validation
- **CORS Protection** - Configured for specific origins
- **Helmet Security** - Security headers
- **RLS Policies** - Database-level security

## 🗂️ Database Schema

### Companies Table
```sql
id, name, email, phone, country, password_hash, 
is_verified, certificate_url, created_at, updated_at
```

### Jobs Table
```sql
id, title, description, category, salary, deadline, 
country, company_id, is_foreign, email, phone, 
whatsapp, application_link, created_at
```

### Subscriptions Table
```sql
id, company_id, plan_type, start_date, end_date, 
is_active, auto_renew, pesapal_txn_id, created_at, updated_at
```

## 📁 Project Structure

```
src/
├── config/
│   ├── index.js          # Main configuration
│   └── supabase.js       # Supabase client setup
├── controllers/
│   ├── authController.js
│   ├── companyController.js
│   ├── jobController.js
│   └── subscriptionController.js
├── middleware/
│   ├── auth.js           # Authentication middleware
│   ├── upload.js         # File upload middleware
│   └── validation.js     # Input validation
├── routes/
│   ├── auth.js
│   ├── companies.js
│   ├── jobs.js
│   └── subscription.js
├── utils/
│   └── helpers.js        # Utility functions
└── server.js             # Main server file
```

## 🚀 Deployment

### Namecheap Shared Hosting

1. **Upload files** to your hosting directory
2. **Install dependencies** via SSH or file manager
3. **Set environment variables** in hosting control panel
4. **Configure Node.js** version (18+)
5. **Set startup file** to `src/server.js`
6. **Enable SSL** for HTTPS
7. **Configure domain** and subdomain if needed

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
JWT_SECRET=your_production_jwt_secret
PESAPAL_ENVIRONMENT=live
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🧪 Testing

### Manual Testing with curl

**Register Company:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "email": "test@company.com",
    "phone": "+256700000000",
    "country": "Uganda",
    "password": "TestPassword123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "TestPassword123"
  }'
```

**Upload Certificate:**
```bash
curl -X POST http://localhost:3001/api/companies/certificate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "certificate=@/path/to/certificate.pdf"
```

## 🔧 Development

**Start development server:**
```bash
npm run dev
```

**Check logs:**
```bash
# Server logs will show in terminal
# Check Supabase logs in dashboard
```

**Environment:**
- Development: `http://localhost:3001`
- Health Check: `http://localhost:3001/health`

## 📋 TODO

- [ ] Implement actual Pesapal integration
- [ ] Add email notifications for verification
- [ ] Add job application tracking
- [ ] Implement admin dashboard API
- [ ] Add automated testing
- [ ] Add API documentation (Swagger)
- [ ] Add job statistics and analytics
- [ ] Implement job expiry automation

## 🆘 Support

For support or questions:
- Check the logs in terminal/hosting panel
- Verify Supabase connection and RLS policies
- Ensure all environment variables are set
- Check file permissions for uploads directory

## 📝 License

ISC License - See package.json for details.
