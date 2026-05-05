const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Config
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_USER = process.env.DB_USERNAME || 'postgres';
const DB_PASS = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_DATABASE || 'filehost';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'filehost';

// Database
const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
});

// R2 Client
const s3Client = new S3Client({
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
  region: 'auto',
});

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(401).json({ message: 'Email already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id, email, planType: 'free' }, JWT_SECRET);
    
    res.status(201).json({ accessToken: token, refreshToken: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ sub: user.id, email, planType: user.plan_type }, JWT_SECRET);
    res.json({ accessToken: token, refreshToken: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// File routes
app.get('/files', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE user_id = $1 AND is_deleted = false ORDER BY created_at DESC',
      [req.user.sub]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/upload/init', authMiddleware, async (req, res) => {
  try {
    const { fileName, fileSize, fileHash, isPermanent } = req.body;
    
    // Check for duplicate
    const existing = await pool.query('SELECT * FROM files WHERE hash = $1 AND is_deleted = false', [fileHash]);
    if (existing.rows.length > 0) {
      return res.json({ fileId: existing.rows[0].id, isDuplicate: true });
    }
    
    // Generate storage key
    const storageKey = `${req.user.sub}/${Date.now()}-${fileName}`;
    
    // Create file record
    const result = await pool.query(
      `INSERT INTO files (user_id, file_name, size, hash, storage_key, is_permanent, expiry_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        req.user.sub,
        fileName,
        fileSize,
        fileHash,
        storageKey,
        isPermanent || false,
        isPermanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ]
    );
    
    // Generate pre-signed URL
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: storageKey,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    res.json({ fileId: result.rows[0].id, storageKey, uploadUrl, isDuplicate: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download routes
app.get('/files/:id/ad', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM files WHERE id = $1 AND is_deleted = false', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = result.rows[0];
    res.json({
      id: file.id,
      fileName: file.file_name,
      size: file.size,
      downloadCount: file.download_count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/files/:id/verify-ad', async (req, res) => {
  try {
    const fileId = req.params.id;
    const ipAddress = req.ip || 'unknown';
    
    // Generate download token
    const downloadToken = jwt.sign({ fileId, ip: ipAddress, type: 'download' }, JWT_SECRET, { expiresIn: '10m' });
    
    // Update download count
    await pool.query('UPDATE files SET download_count = download_count + 1 WHERE id = $1', [fileId]);
    
    // Get file for download URL
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [fileId]);
    const file = result.rows[0];
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: file.storage_key,
    });
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    
    res.json({ downloadToken, downloadUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Note: This is a simplified Express backend for testing');
});
