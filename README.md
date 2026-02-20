# SalesFlow — Deployment Guide

## What's in this folder

```
salesflow/
├── index.html          ← App entry point
├── package.json        ← Dependencies
├── vite.config.js      ← Build config
├── vercel.json         ← Vercel routing
└── src/
    ├── main.jsx        ← React bootstrap
    └── App.jsx         ← Full application
```

---

## How to deploy (step by step)

### 1. Create a GitHub account
Go to https://github.com and sign up (free).

### 2. Create a new repository
- Click the **+** icon top right → **New repository**
- Name: `salesflow`
- Keep it Public or Private (both work)
- Click **Create repository**

### 3. Upload this folder to GitHub
- On the empty repo page, click **"uploading an existing file"**
- Drag and drop ALL the files from this folder (including the `src` subfolder)
- Make sure the folder structure is preserved
- Click **Commit changes**

### 4. Deploy on Vercel
- Go to https://vercel.com and sign up with GitHub
- Click **New Project**
- Select your `salesflow` repository
- Framework: **Vite** (Vercel usually detects this automatically)
- Click **Deploy**

### 5. You're live! 🎉
Vercel gives you a URL like `https://salesflow-abc123.vercel.app`

---

## Already connected to Supabase
The app is pre-configured with your Supabase project.
No environment variables needed — it works out of the box.

## Login
Open your live URL and sign up with any email + password.
Each user only sees their own data.
