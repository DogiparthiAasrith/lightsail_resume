# Simple Manual Deployment Guide

No GitHub Secrets needed! Just follow these steps:

## Step 1: Create IAM Role (AWS Console)

1. **IAM** → **Policies** → **Create Policy** → **JSON**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
      "Resource": "arn:aws:s3:::public-site-lightsail/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::public-site-lightsail"
    }
  ]
}
```
Name: `ResumeUploadS3Policy`

2. **IAM** → **Roles** → **Create Role**
   - Select: **AWS Service** → **EC2**
   - Attach: `ResumeUploadS3Policy`
   - Name: `LightsailResumeRole`

## Step 2: Create Lightsail Instance

1. **Lightsail Console** → **Create Instance**
2. Select: **OS Only** → **Ubuntu 22.04 LTS**
3. Choose plan: **$5/month** (1GB RAM)
4. Name: `resume-upload-server`
5. Click **Create**
6. Wait for it to start

## Step 3: Attach IAM Role

1. Go to **EC2 Console** (not Lightsail)
2. **Instances** → Find `resume-upload-server`
3. Select it → **Actions** → **Security** → **Modify IAM role**
4. Select: `LightsailResumeRole`
5. Click **Update IAM role**

## Step 4: Configure Firewall

1. Back to **Lightsail Console** → Your instance
2. **Networking** tab → **Add rule**
3. Add: **Custom** → **TCP** → **Port 80**
4. Click **Create**

## Step 5: Push Code to GitHub

```bash
# In your project folder
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 6: Deploy to Lightsail

### Connect to Instance

In Lightsail Console, click **Connect using SSH** (opens browser terminal)

Or use your terminal:
```bash
ssh -i YourKey.pem ubuntu@YOUR_LIGHTSAIL_IP
```

### Clone Your Code

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git resume-app
cd resume-app
```

### Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- ✅ Install Node.js
- ✅ Install dependencies
- ✅ Create `.env` file (with bucket name, no keys!)
- ✅ Set up PM2
- ✅ Configure Nginx
- ✅ Start your app

### Verify IAM Role

```bash
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
# Should show: LightsailResumeRole
```

## Step 7: Test Your App

Open browser: `http://YOUR_LIGHTSAIL_IP`

Upload a resume and check your S3 bucket!

## Update Your App Later

When you make changes:

```bash
# On your local machine
git add .
git commit -m "Updated feature"
git push

# On Lightsail (SSH)
cd /home/ubuntu/resume-app
git pull
npm install
pm2 restart resume-app
```

## Useful Commands

```bash
# View logs
pm2 logs resume-app

# Restart app
pm2 restart resume-app

# Check status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

**Upload fails?**
```bash
# Check IAM role
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Check app logs
pm2 logs resume-app --err
```

**App not starting?**
```bash
pm2 restart resume-app
pm2 logs resume-app
```

## Summary

✅ No GitHub Secrets needed
✅ No CI/CD complexity
✅ IAM role provides AWS access
✅ Simple git pull to update
✅ Cost: ~$5/month

That's it! Simple and straightforward deployment.
