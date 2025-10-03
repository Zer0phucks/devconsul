# AI Image Generation Setup Guide

Quick start guide for implementing the AI Image Generation and Management system.

## 📦 Installation

### 1. Install Dependencies

```bash
npm install sharp
```

All other dependencies (openai, @vercel/blob) are already in package.json.

### 2. Environment Variables

Add to your `.env` file:

```bash
# OpenAI API (for DALL-E and Vision)
OPENAI_API_KEY=sk-...

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...
BLOB_STORE_URL=https://...
```

### 3. Database Migration

**Note**: Database migrations should be run in your deployment environment (Vercel, Railway, etc.) where the database is accessible.

```bash
# Generate Prisma client (run locally)
npx prisma generate

# Deploy migration (run in deployment environment or via CI/CD)
npx prisma migrate deploy
```

If running locally with a local database:
```bash
npx prisma migrate dev --name add_image_management
npx prisma generate
```

## 🚀 Quick Start

### Generate an Image

```typescript
import { generateImage } from '@/lib/ai/image-generation';

const result = await generateImage(
  'A modern tech blog header about AI',
  {
    quality: 'hd',
    size: '1792x1024',
  }
);

if ('images' in result) {
  console.log('Image URL:', result.images[0].url);
  console.log('Cost: $' + result.cost);
}
```

### Upload an Image

```typescript
import { uploadImage } from '@/lib/storage/image-storage';

const result = await uploadImage(file, 'my-image.jpg', 'uploads');

if ('url' in result) {
  console.log('Uploaded:', result.url);
}
```

### Generate Alt Text

```typescript
import { generateAltText } from '@/lib/ai/alt-text';

const result = await generateAltText(imageUrl, {
  purpose: 'both',
  maxLength: 125,
});

if ('altText' in result) {
  console.log('Alt text:', result.altText);
}
```

### Process for Platforms

```typescript
import { processImageForPlatform } from '@/lib/image-processing/platform-specs';

const result = await processImageForPlatform(
  buffer,
  'twitter',
  'post'
);

console.log('Twitter image:', result.metadata);
```

## 🔧 API Routes

### Generate Image

```bash
POST /api/images/generate

Body:
{
  "prompt": "A modern tech blog header",
  "quality": "hd",
  "size": "1792x1024",
  "style": "vivid",
  "generateAlt": true,
  "platforms": ["twitter", "linkedin"],
  "projectId": "...",
  "title": "My Blog Post",
  "tags": ["tech", "AI"]
}
```

### Upload Image

```bash
POST /api/images/upload

FormData:
- file: File
- projectId: string (optional)
- alt: string (optional)
- title: string (optional)
- tags: string (optional, comma-separated)
- folder: string (optional)
```

## 📊 Platform Specifications

Available platforms and types:

- **twitter**: post, square, card
- **linkedin**: post, square
- **facebook**: post, story
- **instagram**: post, landscape, portrait, story
- **blog**: featured, hero, inline
- **email**: header, inline
- **opengraph**: default

## 💰 Cost Estimates

- **DALL-E 3 Standard**: $0.040-$0.080 per image
- **DALL-E 3 HD**: $0.080-$0.120 per image
- **Alt Text Generation**: ~$0.002 per image
- **Vercel Blob Storage**: $0.15/GB/month

## 🔐 Security

1. Never commit `.env` file
2. Use environment variables for all API keys
3. Validate file uploads (type, size)
4. Implement rate limiting
5. Authenticate all API routes

## 📝 Database Schema

Key models:
- **Image**: Main image table
- **ContentImage**: Links images to content
- **EmailImage**: Links images to email campaigns
- **ImageGenerationJob**: Tracks batch generation

## 🎯 Next Steps

1. Build UI components (image upload, library, editor)
2. Create dashboard pages
3. Integrate with content creation workflow
4. Add image analytics
5. Implement image editing features

## 🐛 Troubleshooting

### "Sharp library not available"
```bash
npm install sharp
```

### "OpenAI API key not configured"
Add `OPENAI_API_KEY` to `.env`

### "Vercel Blob storage token not configured"
Add `BLOB_READ_WRITE_TOKEN` to `.env`

### Rate limit exceeded
- DALL-E 3: Max 5-10 requests/minute
- Vision API: Max 3-50 requests/minute
- Use built-in delays in batch operations

### File too large
- DALL-E: Images are automatically sized
- Upload: Max 10MB (configurable)
- Platform specs: Auto-compressed to meet limits

## 📚 Resources

- [OpenAI DALL-E Documentation](https://platform.openai.com/docs/guides/images)
- [OpenAI Vision Documentation](https://platform.openai.com/docs/guides/vision)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

## ✅ Verification

Test your setup:

```typescript
// Test DALL-E connection
import { createImageGenerator } from '@/lib/ai/image-generation';
const generator = createImageGenerator();
const connected = await generator.testConnection();
console.log('DALL-E connected:', connected);

// Test Vision API
import { createAltTextGenerator } from '@/lib/ai/alt-text';
const altGen = createAltTextGenerator();
const altConnected = await altGen.testConnection();
console.log('Vision API connected:', altConnected);

// Test storage
import { createImageStorage } from '@/lib/storage/image-storage';
const storage = createImageStorage();
const list = await storage.list({ limit: 1 });
console.log('Storage connected:', list.blobs.length >= 0);
```

Happy coding! 🎨
