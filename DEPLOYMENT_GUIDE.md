# Karamchedu Survey - Deployment Guide

## 🚀 Permanent Data Storage Solutions

### **Why Data Disappears:**
- Most deployment platforms use ephemeral storage
- SQLite files get wiped on server restarts
- Temporary directories are cleared

### **Solutions Implemented:**

#### 1. **Railway Deployment (Recommended)**
```bash
# Environment Variables to set in Railway:
NODE_ENV=production
DATABASE_PATH=/data/karamchedu_survey.db
```

**Steps:**
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add a **Volume** for persistent storage
4. Set environment variables above
5. Deploy!

#### 2. **Render Deployment**
```bash
# Environment Variables to set in Render:
NODE_ENV=production
DATABASE_PATH=/opt/render/project/src/data/karamchedu_survey.db
```

**Steps:**
1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Choose "Web Service"
4. Set environment variables above
5. Deploy!

#### 3. **Vercel Deployment (Limited)**
```bash
# Environment Variables to set in Vercel:
NODE_ENV=production
DATABASE_PATH=/tmp/karamchedu_survey.db
```

**Note:** Vercel has limited persistent storage. Data may still be lost on restarts.

### **Database Backup Features:**

#### **Automatic Backup:**
- Visit: `https://your-app-url.com/api/backup`
- Creates timestamped backup files
- Stores in `/backup` directory

#### **Database Info:**
- Visit: `https://your-app-url.com/api/database-info`
- Shows survey count, file size, last modified

#### **Export Data:**
- Visit: `https://your-app-url.com/api/export/csv`
- Downloads all survey data as CSV

### **Environment Variables Reference:**

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_PATH` | Custom database path | `/data/survey.db` |
| `PORT` | Server port | `4000` |
| `HOST` | Server host | `0.0.0.0` |

### **Best Practices:**

1. **Use Railway with Volume Storage** (Most Reliable)
2. **Regular CSV Exports** (Backup your data)
3. **Monitor Database Info** (Check data persistence)
4. **Set Proper Environment Variables**

### **Testing Data Persistence:**

1. Submit a survey
2. Check `/api/database-info`
3. Restart the server
4. Check if data still exists
5. Export CSV as backup

### **Troubleshooting:**

**Data Still Disappearing?**
- Check environment variables
- Verify database path permissions
- Use Railway Volume storage
- Export CSV regularly

**Database Connection Errors?**
- Check file permissions
- Verify directory exists
- Use fallback paths

---

## 🎯 **Recommended Deployment: Railway**

Railway provides the most reliable persistent storage for SQLite databases.

**Why Railway?**
- ✅ Persistent Volume Storage
- ✅ Automatic HTTPS
- ✅ Easy environment variables
- ✅ Reliable uptime
- ✅ Free tier available

**Quick Setup:**
1. Connect GitHub repo
2. Add Volume (1GB free)
3. Set environment variables
4. Deploy in 2 minutes!

Your data will be permanent and survive server restarts! 🎉 