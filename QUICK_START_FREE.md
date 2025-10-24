# 🚀 Quick Start - FREE Production Setup

## ⏱️ Setup Time: 30 minutes

This guide will help you deploy your company management app **completely FREE** with zero monthly costs.

---

## 📋 Prerequisites

- [x] Node.js installed (v18+)
- [x] Gmail account (for email sending)
- [x] GitHub account (for deployment)

---

## STEP 1: Database Setup (5 minutes)

### MongoDB Atlas - FREE 512MB

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster**:
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select cloud provider (any)
   - Click "Create"
3. **Security**:
   - Username: `admin`
   - Password: (generate strong password)
   - Click "Create User"
4. **Network Access**:
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
5. **Get Connection String**:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

**Result**: `mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

---

## STEP 2: Email Setup (3 minutes)

### Gmail SMTP - FREE 100 emails/day

1. **Enable 2-Factor Authentication**:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

**Result**: 
- Email: `your-company@gmail.com`
- Password: `abcd efgh ijkl mnop` (16 chars)

---

## STEP 3: File Storage Setup (2 minutes)

### Cloudinary - FREE 25GB

1. **Sign up**: https://cloudinary.com/users/register/free
2. **Get Credentials**:
   - Go to Dashboard
   - Copy:
     - Cloud Name
     - API Key
     - API Secret

**Result**:
- Cloud Name: `dxxxxxxxxxxxxx`
- API Key: `123456789012345`
- API Secret: `abcdefghijklmnopqrstuvwxyz123456`

---

## STEP 4: Configure Environment (2 minutes)

1. **Copy `.env.example` to `.env`**:
```bash
cp .env.example .env
```

2. **Edit `.env` file** with your credentials:

```env
# Database
MONGODB_URI=mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/company-manager?retryWrites=true&w=majority

# Session Security
SESSION_SECRET=generate-random-32-char-string-here-use-crypto

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-company@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM="Company Name <your-company@gmail.com>"

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456

# Google OAuth (Optional - for Google Sign-in)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

# Server
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:8080
```

3. **Generate Session Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## STEP 5: Install & Run Locally (3 minutes)

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

**Open**: http://localhost:8080

**Create Account**:
- Use email/password signup
- Choose role (Employee/Manager/Admin)

---

## STEP 6: Deploy to Production (15 minutes)

### Option A: Render.com (Recommended - FREE)

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/company-manager.git
git push -u origin main
```

2. **Deploy Backend**:
   - Go to: https://render.com
   - Sign up with GitHub
   - Click "New +" → "Web Service"
   - Connect your repository
   - Settings:
     - **Name**: `company-manager`
     - **Environment**: `Node`
     - **Build Command**: `pnpm install && pnpm build`
     - **Start Command**: `pnpm start`
     - **Plan**: FREE
   - Add Environment Variables (copy from `.env`)
   - Click "Create Web Service"

3. **Your app URL**: `https://company-manager.onrender.com`

4. **Update Environment Variables**:
   - In Render dashboard, update:
     ```
     CLIENT_URL=https://company-manager.onrender.com
     GOOGLE_CALLBACK_URL=https://company-manager.onrender.com/api/auth/google/callback
     NODE_ENV=production
     ```

### Option B: Vercel + Railway

**Frontend (Vercel)**:
1. Go to: https://vercel.com
2. Import GitHub repo
3. Deploy (automatic)

**Backend (Railway)**:
1. Go to: https://railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy

---

## STEP 7: Setup Google OAuth (Optional - 5 minutes)

1. **Google Cloud Console**: https://console.cloud.google.com
2. Create Project → Enable Google+ API
3. Create OAuth Credentials:
   - **Authorized JavaScript origins**:
     - `http://localhost:8080`
     - `https://your-app.onrender.com`
   - **Authorized redirect URIs**:
     - `http://localhost:8080/api/auth/google/callback`
     - `https://your-app.onrender.com/api/auth/google/callback`
4. Copy Client ID & Secret to `.env`

---

## STEP 8: Prevent Cold Starts (Optional - 2 minutes)

Render free tier spins down after 15 minutes of inactivity.

### Use UptimeRobot (FREE):

1. **Sign up**: https://uptimerobot.com
2. **Add Monitor**:
   - Monitor Type: HTTP(s)
   - URL: `https://your-app.onrender.com/api/health`
   - Monitoring Interval: 5 minutes
3. Done! App stays warm.

---

## ✅ Verification Checklist

After deployment, test:

- [ ] Can access app URL
- [ ] Can create account
- [ ] Can login
- [ ] Can create tasks
- [ ] Can request leave
- [ ] Can chat
- [ ] Receive email notifications
- [ ] Can upload profile photo
- [ ] Dark/Light theme works

---

## 📊 FREE Tier Limits

### What You Get:
- ✅ **Database**: 512 MB (enough for 10,000+ users)
- ✅ **Email**: 100/day (expandable with multiple Gmail accounts)
- ✅ **Files**: 25 GB storage + 25 GB bandwidth/month
- ✅ **Hosting**: 750 hours/month (24/7 with cold starts)
- ✅ **SSL**: Automatic HTTPS
- ✅ **Users**: Supports 50-100 active users easily

### When to Upgrade:
- Database >400 MB → MongoDB M10 ($57/month)
- Email >100/day → SendGrid Essentials ($20/month)
- Files >20 GB → Cloudinary Plus ($99/month)
- Need zero cold starts → Render Starter ($7/month)

---

## 🆘 Troubleshooting

### App won't start
- Check environment variables are set
- Verify MongoDB connection string
- Check Render logs

### Can't send emails
- Verify Gmail app password (not regular password)
- Check 2FA is enabled
- Try different Gmail account

### Files won't upload
- Verify Cloudinary credentials
- Check file size (<5MB for photos, <10MB for documents)
- Will fallback to local storage if Cloudinary not configured

### Database connection failed
- Check IP whitelist (use 0.0.0.0/0)
- Verify connection string format
- Test connection string in MongoDB Compass

---

## 📈 Next Steps

After successful deployment:

1. **Create Admin Account**:
   - Sign up with email
   - Choose "Admin" role
   - This is your master account

2. **Invite Team Members**:
   - They can sign up directly
   - Or you can use Google OAuth

3. **Setup Email Templates**:
   - Customize welcome email
   - Setup leave notification emails

4. **Configure Settings**:
   - Set company name
   - Add company logo
   - Configure leave types

5. **Train Users**:
   - Create user guide
   - Hold training session

---

## 💡 Pro Tips

### 1. Multiple Gmail Accounts
If you need more than 100 emails/day:
- Create multiple Gmail accounts
- Rotate between them in code
- Or use SendGrid free tier (100/day)

### 2. Optimize Images
Cloudinary automatically optimizes images:
- WebP format
- Auto quality
- CDN delivery

### 3. Database Optimization
Add indexes for better performance (already included):
```typescript
userSchema.index({ email: 1 });
taskSchema.index({ status: 1, assignedTo: 1 });
messageSchema.index({ createdAt: -1 });
```

### 4. Monitor Usage
Check your usage regularly:
- MongoDB Atlas Dashboard
- Cloudinary Dashboard
- Render Dashboard

### 5. Backup Database
Export database weekly:
```bash
mongodump --uri="your-connection-string" --out=./backup
```

---

## 📞 Support

### Resources:
- **MongoDB Issues**: https://www.mongodb.com/docs/
- **Render Issues**: https://render.com/docs
- **Cloudinary Issues**: https://cloudinary.com/documentation
- **Gmail SMTP**: https://support.google.com/mail/answer/7126229

### Common Solutions:
- **Cold Start**: Use UptimeRobot pinging
- **Email Limit**: Create multiple Gmail accounts
- **Storage Limit**: Use compression, delete old files
- **Database Limit**: Archive old data, optimize queries

---

## 🎉 Success!

You now have a fully functional company management system running **100% FREE**!

**Monthly Cost**: $0  
**Annual Cost**: $0-10 (optional domain)

**Enjoy your free production app!** 🚀
