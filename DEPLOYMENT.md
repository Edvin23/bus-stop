# 🚀 Deployment Guide for Bus Tracking App

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install with `npm i -g vercel`
3. **Git Repository**: Your code should be in a Git repo

## 🔧 Environment Variables Setup

Before deploying, you need to set up environment variables in Vercel:

### Required Environment Variables:

- `SWIFTLY_API_KEY` - Your Swiftly API key
- `GTFS_RT_URL` - GTFS-RT endpoint URL
- `GTFS_RT_API_KEY` - GTFS-RT API key (same as Swiftly key)

### How to Set Environment Variables:

1. **Via Vercel Dashboard**:

   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add each variable with the same values as your `.env` file

2. **Via Vercel CLI**:
   ```bash
   vercel env add SWIFTLY_API_KEY
   vercel env add GTFS_RT_URL
   vercel env add GTFS_RT_API_KEY
   ```

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Push to Git**: Ensure your code is pushed to GitHub/GitLab
2. **Import Project**: Go to Vercel dashboard → "New Project"
3. **Connect Repository**: Select your bus tracking repository
4. **Configure Build**:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. **Deploy**: Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel**:

   ```bash
   vercel login
   ```

2. **Deploy**:

   ```bash
   vercel --prod
   ```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Confirm build settings
   - Set environment variables

## 🔍 Post-Deployment Verification

1. **Check API Endpoints**:

   - `https://your-domain.vercel.app/api/swiftly/vehicles?agencyKey=lametro`
   - Should return GTFS-RT binary data

2. **Check Frontend**:
   - `https://your-domain.vercel.app/`
   - Should show the map with LA Metro buses

## 🛠️ Troubleshooting

### Common Issues:

1. **Environment Variables Not Set**:

   - Check Vercel dashboard → Environment Variables
   - Ensure variables are set for "Production" environment

2. **Build Failures**:

   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`

3. **API Errors**:
   - Verify API keys are correct
   - Check CORS settings if needed

### Support:

- Check Vercel deployment logs
- Verify environment variables are set correctly
- Ensure all files are committed to Git

## 📊 Performance

Your app should:

- Load in under 3 seconds
- Show real-time bus data
- Update every 30 seconds
- Handle 474+ LA Metro vehicles

## 🔄 Updates

To update your deployed app:

1. Make changes locally
2. Test with `npm run dev`
3. Build with `npm run build`
4. Push to Git
5. Vercel will auto-deploy

---

**Your bus tracking app is now live and serving real-time LA Metro data!** 🎉
