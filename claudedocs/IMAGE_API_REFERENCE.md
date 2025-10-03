# Image API Reference

Complete API documentation for the Image Management system.

## API Endpoints

### 1. Generate Image with DALL-E

**Endpoint**: `POST /api/images/generate`

**Description**: Generate an AI image using DALL-E 3 or DALL-E 2 with optional alt text and platform processing.

**Authentication**: Required (NextAuth session)

**Request Body**:
```typescript
{
  prompt: string;           // Required: Image generation prompt
  quality?: 'standard' | 'hd';  // Default: 'standard'
  size?: '1024x1024' | '1792x1024' | '1024x1792';  // Default: '1024x1024'
  style?: 'vivid' | 'natural';  // Default: 'vivid'
  generateAlt?: boolean;    // Default: true
  platforms?: string[];     // e.g., ['twitter', 'linkedin']
  projectId?: string;
  title?: string;
  tags?: string[];
}
```

**Response**:
```typescript
{
  success: true;
  image: {
    id: string;
    url: string;
    alt: string;
    width: number;
    height: number;
    size: number;
  };
  generation: {
    prompt: string;
    revisedPrompt: string;
    model: string;
  };
  cost: {
    imageGeneration: number;
    altTextGeneration: number;
    total: number;
  };
  platforms: string[];
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A modern tech blog header about AI",
    "quality": "hd",
    "size": "1792x1024",
    "generateAlt": true,
    "platforms": ["twitter", "linkedin"],
    "title": "Understanding AI"
  }'
```

---

### 2. Upload Image

**Endpoint**: `POST /api/images/upload`

**Description**: Upload a custom image file with metadata.

**Authentication**: Required (NextAuth session)

**Request**: FormData
```typescript
{
  file: File;              // Required: Image file
  projectId?: string;
  alt?: string;
  title?: string;
  tags?: string;           // Comma-separated
  folder?: string;         // Storage folder
}
```

**Response**:
```typescript
{
  success: true;
  image: {
    id: string;
    url: string;
    filename: string;
    originalName: string;
    width: number;
    height: number;
    size: number;
    mimeType: string;
    alt: string | null;
    title: string | null;
    tags: string[];
  };
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -F "file=@image.jpg" \
  -F "title=My Image" \
  -F "alt=Description of image" \
  -F "tags=tech,blog"
```

---

### 3. List Images

**Endpoint**: `GET /api/images`

**Description**: List all images with pagination, filtering, and search.

**Authentication**: Required (NextAuth session)

**Query Parameters**:
```typescript
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 20
  projectId?: string;
  isAIGenerated?: boolean;
  tags?: string;           // Comma-separated
  search?: string;         // Search in filename, title, alt, prompt
  sortBy?: string;         // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc';  // Default: 'desc'
}
```

**Response**:
```typescript
{
  success: true;
  images: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    width: number;
    height: number;
    aspectRatio: number;
    storageUrl: string;
    alt: string | null;
    title: string | null;
    tags: string[];
    isAIGenerated: boolean;
    aiModel: string | null;
    aiPrompt: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example**:
```bash
curl "http://localhost:3000/api/images?page=1&limit=10&isAIGenerated=true&tags=tech,blog&search=AI"
```

---

### 4. Get Single Image

**Endpoint**: `GET /api/images/[id]`

**Description**: Get detailed information about a single image including usage in content and emails.

**Authentication**: Required (NextAuth session)

**Response**:
```typescript
{
  success: true;
  image: {
    // All image fields
    contentImages: Array<{
      role: ImageRole;
      content: {
        id: string;
        title: string;
        platform: string;
      };
    }>;
    emailImages: Array<{
      role: ImageRole;
      email: {
        id: string;
        subject: string;
      };
    }>;
  };
}
```

**Example**:
```bash
curl http://localhost:3000/api/images/clx123abc
```

---

### 5. Update Image Metadata

**Endpoint**: `PUT /api/images/[id]`

**Description**: Update image metadata (alt text, title, tags, caption, credits).

**Authentication**: Required (NextAuth session)

**Request Body**:
```typescript
{
  alt?: string;
  title?: string;
  tags?: string[];
  caption?: string;
  credits?: string;
}
```

**Response**:
```typescript
{
  success: true;
  image: {
    // Updated image object
  };
}
```

**Example**:
```bash
curl -X PUT http://localhost:3000/api/images/clx123abc \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Updated alt text",
    "tags": ["tech", "AI", "machine-learning"]
  }'
```

---

### 6. Delete Image

**Endpoint**: `DELETE /api/images/[id]`

**Description**: Delete an image from storage and database.

**Authentication**: Required (NextAuth session)

**Response**:
```typescript
{
  success: true;
  message: "Image deleted successfully";
}
```

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/images/clx123abc
```

---

### 7. Regenerate Alt Text

**Endpoint**: `POST /api/images/[id]/alt-text`

**Description**: Regenerate alt text for an existing image using GPT-4 Vision.

**Authentication**: Required (NextAuth session)

**Request Body**:
```typescript
{
  purpose?: 'accessibility' | 'seo' | 'both';  // Default: 'both'
  maxLength?: number;     // Default: 125
  context?: string;       // Additional context for generation
}
```

**Response**:
```typescript
{
  success: true;
  image: {
    id: string;
    alt: string;
    altTextDescription: string;
    altTextConfidence: number;
  };
  analysis: {
    detectedText: string[];
    tags: string[];
    confidence: number;
  };
  cost: number;
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/images/clx123abc/alt-text \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "both",
    "maxLength": 125,
    "context": "Tech blog about machine learning"
  }'
```

---

### 8. Process for Platforms

**Endpoint**: `POST /api/images/[id]/process`

**Description**: Process an existing image for specific social media platforms.

**Authentication**: Required (NextAuth session)

**Request Body**:
```typescript
{
  platforms: string[];     // Required: ['twitter', 'linkedin', etc.]
  types?: Record<string, string>;  // Optional: { twitter: 'post', linkedin: 'square' }
}
```

**Response**:
```typescript
{
  success: true;
  image: {
    id: string;
    platformVersions: Record<string, {
      url: string;
      width: number;
      height: number;
      size: number;
      format: string;
    }>;
  };
  processed: string[];     // List of processed platforms
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/images/clx123abc/process \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["twitter", "linkedin", "facebook"],
    "types": {
      "twitter": "post",
      "linkedin": "square"
    }
  }'
```

---

## Platform Specifications

### Twitter
- **post**: 1200x675 (16:9), max 5MB
- **square**: 1200x1200 (1:1), max 5MB
- **card**: 1200x628 (1.91:1), max 5MB

### LinkedIn
- **post**: 1200x627 (1.91:1), max 5MB
- **square**: 1200x1200 (1:1), max 5MB

### Facebook
- **post**: 1200x630 (1.91:1), max 8MB
- **story**: 1080x1920 (9:16), max 4MB

### Instagram
- **post**: 1080x1080 (1:1), max 8MB
- **landscape**: 1080x566 (1.91:1), max 8MB
- **portrait**: 1080x1350 (4:5), max 8MB
- **story**: 1080x1920 (9:16), max 4MB

### Blog
- **featured**: 1200x630 (1.91:1), max 2MB
- **hero**: 1920x1080 (16:9), max 2MB
- **inline**: 800x600 (4:3), max 1MB

### Email
- **header**: 600x300 (2:1), max 1MB
- **inline**: 600x400 (3:2), max 500KB

### OpenGraph
- **default**: 1200x630 (1.91:1), max 5MB

---

## Error Codes

### Image Generation Errors
- `invalid_api_key`: OpenAI API key is invalid
- `rate_limit_exceeded`: API rate limit exceeded
- `content_policy_violation`: Prompt violates content policy
- `insufficient_quota`: OpenAI quota exceeded
- `generation_failed`: Image generation failed

### Alt Text Errors
- `vision_api_error`: Vision API request failed
- `image_not_accessible`: Image URL not accessible
- `invalid_image_format`: Unsupported image format

### Storage Errors
- `upload_failed`: Failed to upload to storage
- `invalid_file_type`: Invalid file type
- `file_too_large`: File exceeds size limit
- `storage_quota_exceeded`: Storage quota exceeded

### Processing Errors
- `processing_failed`: Image processing failed
- `invalid_platform`: Unknown platform specified
- `sharp_not_available`: Sharp library not installed

---

## Rate Limits

### OpenAI API
- **DALL-E 3**: 5-10 requests/minute
- **DALL-E 2**: 50 requests/minute
- **Vision API**: 3-50 requests/minute (tier-dependent)

### Best Practices
1. Use batch operations with delays for multiple images
2. Implement retry logic with exponential backoff
3. Cache generated images to avoid regeneration
4. Monitor API costs and set budgets
5. Use lower quality settings for drafts

---

## Cost Tracking

### DALL-E 3
- **1024x1024 Standard**: $0.040
- **1024x1024 HD**: $0.080
- **1792x1024 Standard**: $0.080
- **1792x1024 HD**: $0.120
- **1024x1792 Standard**: $0.080
- **1024x1792 HD**: $0.120

### DALL-E 2
- **1024x1024**: $0.020
- **512x512**: $0.018
- **256x256**: $0.016

### Vision API
- **Alt Text Generation**: ~$0.002 per image

### Storage (Vercel Blob)
- **Storage**: $0.15/GB/month
- **Bandwidth**: $0.15/GB

---

## Security

### Authentication
All image API routes require authentication via NextAuth session.

### Authorization
- Users can only access their own images
- Images are scoped by userId
- No public image access (require authentication)

### File Validation
- Type validation (JPEG, PNG, WebP, GIF only)
- Size validation (max 10MB for uploads)
- Content type verification
- Sanitized filenames

### Storage Security
- Public read access on Vercel Blob
- Write access restricted to server-side
- No direct client uploads
- Immutable URLs with cache headers

---

## Usage Examples

### Complete Image Generation Workflow

```typescript
// 1. Generate image with DALL-E
const genResponse = await fetch('/api/images/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Modern tech blog header about AI',
    quality: 'hd',
    size: '1792x1024',
    generateAlt: true,
    platforms: ['twitter', 'linkedin'],
    title: 'Understanding AI',
    tags: ['tech', 'AI']
  })
});

const { image, cost } = await genResponse.json();
console.log(`Generated image: ${image.url}`);
console.log(`Total cost: $${cost.total}`);

// 2. Process for additional platforms
const processResponse = await fetch(`/api/images/${image.id}/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platforms: ['facebook', 'instagram'],
    types: {
      instagram: 'post'
    }
  })
});

const { processed } = await processResponse.json();
console.log(`Processed for: ${processed.join(', ')}`);

// 3. Update metadata
await fetch(`/api/images/${image.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tags: ['tech', 'AI', 'machine-learning'],
    caption: 'AI-generated header image'
  })
});
```

### Custom Image Upload Workflow

```typescript
// 1. Upload image
const formData = new FormData();
formData.append('file', imageFile);
formData.append('title', 'Custom Header');
formData.append('alt', 'Tech blog header');
formData.append('tags', 'tech,design');

const uploadResponse = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData
});

const { image } = await uploadResponse.json();

// 2. Generate alt text
const altResponse = await fetch(`/api/images/${image.id}/alt-text`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    purpose: 'both',
    context: 'Technology blog header image'
  })
});

const { image: updatedImage, cost } = await altResponse.json();
console.log(`Alt text: ${updatedImage.alt}`);

// 3. Process for platforms
await fetch(`/api/images/${image.id}/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platforms: ['twitter', 'linkedin', 'blog']
  })
});
```
