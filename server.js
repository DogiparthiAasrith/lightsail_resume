require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure AWS SDK v3
// Uses access keys from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for temporary file storage
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }
});

// Upload endpoint
app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const { name, jobTitle } = req.body;
    
    if (!name || !jobTitle || !req.file) {
      return res.status(400).json({ error: 'Name, job title, and resume are required' });
    }

    // Read file from temporary location
    const fileContent = fs.readFileSync(req.file.path);
    
    // Generate unique filename organized by job role
    const timestamp = Date.now();
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedJobTitle = jobTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileExtension = path.extname(req.file.originalname);
    const s3Key = `${sanitizedJobTitle}/${sanitizedName}_${timestamp}${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: req.file.mimetype,
      Metadata: {
        'applicant-name': name,
        'job-title': jobTitle,
        'upload-date': new Date().toISOString()
      }
    });

    await s3Client.send(command);

    // Delete temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        name,
        jobTitle,
        filename: req.file.originalname,
        s3Key
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload resume', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
