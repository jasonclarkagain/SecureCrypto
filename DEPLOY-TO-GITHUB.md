# Deploy PGP Crypter to GitHub

This guide will help you deploy your ultra-secure PGP Crypter application to GitHub and set up various hosting options.

## 📋 Pre-Deployment Checklist

### 1. **Prepare Your Repository**
- [ ] All sensitive data removed from code
- [ ] Environment variables properly configured
- [ ] Database schema documented
- [ ] README.md completed
- [ ] License file added
- [ ] .gitignore configured

### 2. **Security Review**
- [ ] No private keys in code
- [ ] No hardcoded passwords or secrets
- [ ] All API endpoints secured
- [ ] Input validation implemented
- [ ] Error messages sanitized

## 🚀 Quick GitHub Deployment

### Step 1: Create GitHub Repository

1. **Go to GitHub.com** and click "New repository"
2. **Repository name**: `pgp-crypter` (or your preferred name)
3. **Description**: "Ultra-secure military-grade PGP encryption platform"
4. **Visibility**: Choose Public or Private
5. **Initialize**: Don't initialize with README (we have our own)
6. **Click**: "Create repository"

### Step 2: Initialize Git and Push

Run these commands in your project directory:

```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "feat: initial commit - ultra-secure PGP crypter with military-grade encryption"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/pgp-crypter.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## 🔧 Environment Setup for Deployment

### 1. **Environment Variables**

Create these environment variables in your hosting platform:

```bash
# Required for all deployments
DATABASE_URL="postgresql://username:password@host:port/database"
NODE_ENV="production"
PORT="5000"

# Optional security enhancements
SESSION_SECRET="your-super-secure-random-string-256-chars-long"
CORS_ORIGIN="https://yourdomain.com"
```

### 2. **Database Setup**

#### For PostgreSQL on various platforms:

**Neon Database (Recommended)**
```bash
# Get your connection string from Neon dashboard
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"
```

**Railway**
```bash
# Railway provides DATABASE_URL automatically
# Just deploy and connect your PostgreSQL service
```

**Supabase**
```bash
# Get connection string from Supabase dashboard
DATABASE_URL="postgresql://postgres:password@host.supabase.co:5432/postgres"
```

## 🌐 Hosting Platform Deployment

### Option 1: Vercel (Recommended for Frontend)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       },
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist/public"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/dist/public/$1"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Railway

1. **Connect GitHub Repository**
   - Go to Railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your pgp-crypter repository

2. **Add PostgreSQL Service**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets DATABASE_URL

3. **Environment Variables**
   - Add required environment variables in Railway dashboard
   - Deploy automatically happens on git push

### Option 3: Render

1. **Create Web Service**
   - Go to Render.com
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build**
   ```yaml
   # Build Command
   npm run build
   
   # Start Command  
   npm start
   
   # Environment
   NODE_ENV=production
   ```

3. **Add PostgreSQL**
   - Create new PostgreSQL database in Render
   - Copy connection string to DATABASE_URL

### Option 4: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-pgp-crypter-app
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Configure Environment**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secret-key
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

## 🐳 Docker Deployment

### 1. **Create Dockerfile**

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]
```

### 2. **Create docker-compose.yml**

```yaml
version: '3.8'

services:
  pgp-crypter:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=pgp_crypter
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. **Deploy with Docker**

```bash
# Build and run locally
docker-compose up --build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Configuration for Production

### 1. **HTTPS/SSL Setup**

Most hosting platforms provide automatic HTTPS. For custom domains:

```javascript
// Add to your Express server
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 2. **Security Headers**

```javascript
// Add security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  next();
});
```

### 3. **Rate Limiting**

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api', limiter);
```

## 📊 Monitoring and Analytics

### 1. **Health Check Endpoint**

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  });
});
```

### 2. **Error Monitoring**

Consider integrating:
- **Sentry** for error tracking
- **DataDog** for performance monitoring
- **LogRocket** for session replay (be careful with sensitive data)

## 🚀 CI/CD Pipeline Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy PGP Crypter

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

## 🎯 Domain and DNS Setup

### 1. **Custom Domain**

1. **Purchase Domain** from registrar
2. **Configure DNS** to point to your hosting platform
3. **Add Domain** in hosting platform dashboard
4. **Enable HTTPS** (usually automatic)

### 2. **Subdomain Setup**

```
# DNS Records
A     pgp.yourdomain.com     → your-server-ip
CNAME www.pgp.yourdomain.com → pgp.yourdomain.com
```

## 🔧 Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] Database connection working
- [ ] All features functional
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Error monitoring active
- [ ] Backup system in place
- [ ] Performance monitoring enabled

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check connection string format
# Ensure database is running
# Verify firewall settings
```

**Build Failures**
```bash
# Check Node.js version compatibility
# Verify all dependencies installed
# Review build logs for specific errors
```

**SSL/HTTPS Issues**
```bash
# Verify domain DNS configuration
# Check hosting platform SSL settings
# Review certificate status
```

**Performance Issues**
```bash
# Enable compression middleware
# Optimize database queries
# Implement proper caching
# Use CDN for static assets
```

## 🎉 Success!

Your ultra-secure PGP Crypter is now deployed and ready to protect communications with military-grade encryption that would take intelligence agencies hundreds of millions of years to crack!

## 📞 Support

For deployment issues:
1. Check hosting platform documentation
2. Review application logs
3. Test locally first
4. Contact hosting support if needed

---

**Remember**: This application provides government-level encryption. Use responsibly and in accordance with local laws and regulations.