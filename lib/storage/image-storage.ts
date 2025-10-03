/**
 * Image Storage Module
 * Handles image upload, storage, and retrieval using Vercel Blob Storage
 */

import { put, del, head, list } from '@vercel/blob';
import { createHash } from 'crypto';

export interface UploadImageOptions {
  file: File | Blob;
  filename: string;
  folder?: string;
  contentType?: string;
  cacheControl?: string;
  addRandomSuffix?: boolean;
}

export interface UploadImageResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export interface UploadImageError {
  error: string;
  code?: string;
  retryable: boolean;
}

export interface ImageMetadata {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

export interface ListImagesOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface ListImagesResult {
  blobs: ImageMetadata[];
  cursor?: string;
  hasMore: boolean;
}

export class ImageStorage {
  private token: string;
  private baseUrl: string;

  constructor(token?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN || '';
    this.baseUrl = process.env.BLOB_STORE_URL || '';

    if (!this.token) {
      throw new Error(
        'Vercel Blob storage token not configured. Set BLOB_READ_WRITE_TOKEN environment variable.'
      );
    }
  }

  /**
   * Upload an image to Vercel Blob storage
   */
  async upload(
    options: UploadImageOptions
  ): Promise<UploadImageResult | UploadImageError> {
    try {
      const { file, filename, folder, contentType, cacheControl, addRandomSuffix } = options;

      // Build pathname
      const pathname = folder ? `${folder}/${filename}` : filename;

      // Upload to Vercel Blob
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: contentType || this.guessContentType(filename),
        cacheControl: cacheControl || 'public, max-age=31536000, immutable',
        addRandomSuffix: addRandomSuffix ?? true,
        token: this.token,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || 'image/jpeg',
        size: blob.size,
        uploadedAt: new Date(blob.uploadedAt),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Upload multiple images in batch
   */
  async uploadBatch(
    images: Array<{
      file: File | Blob;
      filename: string;
      folder?: string;
    }>
  ): Promise<Array<UploadImageResult | UploadImageError>> {
    const results: Array<UploadImageResult | UploadImageError> = [];

    for (const image of images) {
      const result = await this.upload(image);
      results.push(result);
    }

    return results;
  }

  /**
   * Upload image from URL
   */
  async uploadFromUrl(
    imageUrl: string,
    options: {
      filename?: string;
      folder?: string;
    }
  ): Promise<UploadImageResult | UploadImageError> {
    try {
      // Fetch image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return {
          error: `Failed to fetch image from URL: ${response.statusText}`,
          code: 'FETCH_ERROR',
          retryable: response.status >= 500,
        };
      }

      const blob = await response.blob();
      const filename =
        options.filename || this.extractFilenameFromUrl(imageUrl);

      return this.upload({
        file: blob,
        filename,
        folder: options.folder,
        contentType: blob.type,
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Upload base64 encoded image
   */
  async uploadBase64(
    base64Data: string,
    options: {
      filename: string;
      folder?: string;
      contentType?: string;
    }
  ): Promise<UploadImageResult | UploadImageError> {
    try {
      // Remove data URL prefix if present
      const base64String = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

      // Convert base64 to buffer
      const buffer = Buffer.from(base64String, 'base64');

      // Create blob from buffer
      const blob = new Blob([buffer], {
        type: options.contentType || 'image/jpeg',
      });

      return this.upload({
        file: blob,
        filename: options.filename,
        folder: options.folder,
        contentType: options.contentType,
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Delete an image from storage
   */
  async delete(url: string): Promise<void> {
    try {
      await del(url, { token: this.token });
    } catch (error: any) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   */
  async deleteBatch(urls: string[]): Promise<void> {
    try {
      await del(urls, { token: this.token });
    } catch (error: any) {
      throw new Error(`Failed to delete images: ${error.message}`);
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(url: string): Promise<ImageMetadata | null> {
    try {
      const metadata = await head(url, { token: this.token });

      if (!metadata) {
        return null;
      }

      return {
        url: metadata.url,
        pathname: metadata.pathname,
        size: metadata.size,
        contentType: metadata.contentType || 'image/jpeg',
        uploadedAt: new Date(metadata.uploadedAt),
      };
    } catch {
      return null;
    }
  }

  /**
   * List images in storage
   */
  async list(
    options: ListImagesOptions = {}
  ): Promise<ListImagesResult> {
    try {
      const result = await list({
        prefix: options.prefix,
        limit: options.limit || 100,
        cursor: options.cursor,
        token: this.token,
      });

      return {
        blobs: result.blobs.map((blob) => ({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          contentType: blob.contentType || 'image/jpeg',
          uploadedAt: new Date(blob.uploadedAt),
        })),
        cursor: result.cursor,
        hasMore: result.hasMore,
      };
    } catch (error: any) {
      throw new Error(`Failed to list images: ${error.message}`);
    }
  }

  /**
   * Check if image exists
   */
  async exists(url: string): Promise<boolean> {
    const metadata = await this.getMetadata(url);
    return metadata !== null;
  }

  /**
   * Copy image to new location
   */
  async copy(
    sourceUrl: string,
    options: {
      filename: string;
      folder?: string;
    }
  ): Promise<UploadImageResult | UploadImageError> {
    try {
      // Download source image
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        return {
          error: 'Failed to fetch source image',
          code: 'FETCH_ERROR',
          retryable: true,
        };
      }

      const blob = await response.blob();

      // Upload to new location
      return this.upload({
        file: blob,
        filename: options.filename,
        folder: options.folder,
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(
    originalFilename: string,
    options?: {
      prefix?: string;
      useHash?: boolean;
    }
  ): string {
    const ext = this.getFileExtension(originalFilename);
    const baseName = originalFilename.replace(`.${ext}`, '');
    const sanitized = this.sanitizeFilename(baseName);

    if (options?.useHash) {
      const hash = createHash('md5')
        .update(sanitized + Date.now().toString())
        .digest('hex')
        .slice(0, 8);
      return options.prefix
        ? `${options.prefix}-${hash}.${ext}`
        : `${hash}.${ext}`;
    }

    const timestamp = Date.now();
    return options?.prefix
      ? `${options.prefix}-${sanitized}-${timestamp}.${ext}`
      : `${sanitized}-${timestamp}.${ext}`;
  }

  /**
   * Sanitize filename for storage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9-_.]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
  }

  /**
   * Guess content type from filename
   */
  private guessContentType(filename: string): string {
    const ext = this.getFileExtension(filename);

    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
    };

    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      const filename = segments[segments.length - 1];
      return filename || 'image.jpg';
    } catch {
      return 'image.jpg';
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): UploadImageError {
    const errorMessage = error.message || 'Unknown error';

    // File too large
    if (errorMessage.includes('too large') || errorMessage.includes('size')) {
      return {
        error: 'Image file is too large',
        code: 'FILE_TOO_LARGE',
        retryable: false,
      };
    }

    // Invalid file type
    if (errorMessage.includes('type') || errorMessage.includes('format')) {
      return {
        error: 'Invalid image file type',
        code: 'INVALID_FILE_TYPE',
        retryable: false,
      };
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        error: 'Network error. Please try again.',
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    }

    // Authentication errors
    if (errorMessage.includes('token') || errorMessage.includes('auth')) {
      return {
        error: 'Storage authentication error',
        code: 'AUTH_ERROR',
        retryable: false,
      };
    }

    // Generic error
    return {
      error: errorMessage,
      code: 'UNKNOWN_ERROR',
      retryable: false,
    };
  }
}

/**
 * Create image storage instance
 */
export function createImageStorage(token?: string): ImageStorage {
  return new ImageStorage(token);
}

/**
 * Upload single image (convenience function)
 */
export async function uploadImage(
  file: File | Blob,
  filename: string,
  folder?: string
): Promise<UploadImageResult | UploadImageError> {
  const storage = createImageStorage();
  return storage.upload({ file, filename, folder });
}

/**
 * Upload image from URL (convenience function)
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  folder?: string
): Promise<UploadImageResult | UploadImageError> {
  const storage = createImageStorage();
  return storage.uploadFromUrl(imageUrl, { folder });
}

/**
 * Delete image (convenience function)
 */
export async function deleteImage(url: string): Promise<void> {
  const storage = createImageStorage();
  return storage.delete(url);
}
