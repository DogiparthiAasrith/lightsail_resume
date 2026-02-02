# Resume Upload Application

Web application for uploading resumes to AWS S3, hosted on AWS Lightsail with IAM role authentication.

## Features

- Simple form: name, job title, resume upload
- Uploads to AWS S3 bucket
- Supports PDF, DOC, DOCX (max 10MB)
- Uses IAM role (no hardcoded credentials)
- Responsive design

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with AWS credentials (for local testing only):
```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
PORT=3000
```

3. Run:
```bash
npm start
```

4. Open: `http://localhost:3000`

## Deploy to Lightsail

See **DEPLOY-GUIDE.md** for complete deployment instructions.

Quick steps:
1. Create IAM role with S3 permissions
2. Create Lightsail instance
3. Attach IAM role to instance
4. Upload code and run `./deploy.sh`

## Project Structure

```
.
├── server.js              # Express server with S3 upload
├── package.json           # Dependencies
├── .env                   # Environment variables (local only)
├── .env.production        # Production template (no keys)
├── deploy.sh              # Deployment script for Lightsail
├── public/
│   ├── index.html        # Upload form
│   ├── styles.css        # Styling
│   └── script.js         # Frontend logic
└── DEPLOY-GUIDE.md       # Deployment instructions
```

## Security

- IAM role authentication (production)
- File type validation
- File size limits (10MB)
- No credentials in code
- HTTPS recommended for production
