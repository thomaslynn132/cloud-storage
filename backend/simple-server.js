const { NestFactory } = require('@nestjs/core');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { ValidationPipe } = require('@nestjs/common');

// Simple inline module for testing
const express = require('express');
const app = express();
app.use(express.json());

// Mock routes for testing
app.post('/auth/register', (req, res) => {
  res.json({ accessToken: 'mock-token', refreshToken: 'mock-refresh' });
});

app.post('/auth/login', (req, res) => {
  res.json({ accessToken: 'mock-token', refreshToken: 'mock-refresh' });
});

app.get('/files', (req, res) => {
  res.json([]);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Application is running on: http://localhost:${port}`);
  console.log('Note: This is a simplified JS backend for testing');
});
