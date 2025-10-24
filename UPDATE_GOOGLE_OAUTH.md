# 🔧 URGENT: Update Google OAuth Redirect URI

## ⚠️ Port Changed to 8081

Your server is now running on **port 8081** instead of 8080.

You MUST update the Google OAuth redirect URI:

---

## 📝 Steps to Fix:

### 1. Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

### 2. Find Your OAuth Client
- Look for: **"Manager Ask Web Client"** or **"Web client 1"**
- Click on it to edit

### 3. Update Both URIs

**Authorised JavaScript origins:**
- Remove: `http://localhost:8080`
- Add: `http://localhost:8081`

**Authorised redirect URIs:**
- Remove: `http://localhost:8080/api/auth/google/callback`
- Add: `http://localhost:8081/api/auth/google/callback`

### 4. Save Changes
- Click **"SAVE"** at the bottom
- Wait 1-2 minutes for changes to take effect

---

## 🌐 Then Test Your App

1. Open: **http://localhost:8081/login**
2. Click "Continue with Google"
3. You should be able to login!

---

## 🔄 Alternative: Use Port 8080

If you want to keep using 8080, find what's using it:

**PowerShell:**
```powershell
netstat -ano | findstr :8080
```

Then kill that process or close the application using port 8080.

Then restart:
```bash
pnpm dev
```
