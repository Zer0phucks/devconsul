/**
 * Image Processing Module
 * Handles image resize, crop, optimize, and format conversion
 * NOTE: Requires 'sharp' package: npm install sharp
 */

export interface ProcessImageOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp';
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ProcessImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number; // File size in bytes
  originalSize?: number; // Original size for comparison
}

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
}

/**
 * Image Processor Class
 * Uses sharp for high-performance image processing
 */
export class ImageProcessor {
  /**
   * Process an image with given options
   */
  async process(
    input: Buffer | string,
    options: ProcessImageOptions = {}
  ): Promise<ProcessImageResult> {
    try {
      // Dynamically import sharp (server-side only)
      const sharp = await this.loadSharp();

      let pipeline = sharp(input);

      // Get original metadata
      const metadata = await pipeline.metadata();
      const originalSize = metadata.size || 0;

      // Apply crop if specified
      if (options.crop) {
        pipeline = pipeline.extract(options.crop);
      }

      // Apply resize if specified
      if (options.width || options.height) {
        pipeline = pipeline.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          position: options.position || 'center',
        });
      }

      // Apply format conversion and optimization
      const format = options.format || 'jpeg';
      const quality = options.quality || 85;

      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality,
            progressive: true,
            mozjpeg: true,
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality,
            progressive: true,
            compressionLevel: 9,
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality,
          });
          break;
      }

      // Execute processing
      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

      return {
        buffer: data,
        format: info.format,
        width: info.width,
        height: info.height,
        size: info.size,
        originalSize,
      };
    } catch (error: any) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Get image information without processing
   */
  async getInfo(input: Buffer | string): Promise<ImageInfo> {
    try {
      const sharp = await this.loadSharp();
      const metadata = await sharp(input).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
        aspectRatio:
          metadata.width && metadata.height
            ? metadata.width / metadata.height
            : 1,
      };
    } catch (error: any) {
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  /**
   * Optimize image without resizing
   */
  async optimize(
    input: Buffer | string,
    options: { quality?: number; format?: 'jpeg' | 'png' | 'webp' } = {}
  ): Promise<ProcessImageResult> {
    return this.process(input, {
      quality: options.quality || 85,
      format: options.format,
    });
  }

  /**
   * Resize image to specific dimensions
   */
  async resize(
    input: Buffer | string,
    width: number,
    height: number,
    options: Omit<ProcessImageOptions, 'width' | 'height'> = {}
  ): Promise<ProcessImageResult> {
    return this.process(input, {
      width,
      height,
      ...options,
    });
  }

  /**
   * Crop image to specific area
   */
  async crop(
    input: Buffer | string,
    crop: { x: number; y: number; width: number; height: number }
  ): Promise<ProcessImageResult> {
    return this.process(input, { crop });
  }

  /**
   * Convert image format
   */
  async convert(
    input: Buffer | string,
    format: 'jpeg' | 'png' | 'webp',
    quality?: number
  ): Promise<ProcessImageResult> {
    return this.process(input, { format, quality });
  }

  /**
   * Create thumbnail from image
   */
  async createThumbnail(
    input: Buffer | string,
    size: number = 200,
    options: { format?: 'jpeg' | 'png' | 'webp'; quality?: number } = {}
  ): Promise<ProcessImageResult> {
    return this.process(input, {
      width: size,
      height: size,
      fit: 'cover',
      format: options.format || 'jpeg',
      quality: options.quality || 80,
    });
  }

  /**
   * Generate multiple sizes from single image
   */
  async generateSizes(
    input: Buffer | string,
    sizes: Array<{ width: number; height?: number; name: string }>,
    options: { format?: 'jpeg' | 'png' | 'webp'; quality?: number } = {}
  ): Promise<
    Array<
      ProcessImageResult & {
        name: string;
      }
    >
  > {
    const results = [];

    for (const size of sizes) {
      const result = await this.process(input, {
        width: size.width,
        height: size.height,
        fit: 'cover',
        format: options.format,
        quality: options.quality,
      });

      results.push({
        ...result,
        name: size.name,
      });
    }

    return results;
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth?: number,
    targetHeight?: number,
    fit: 'cover' | 'contain' = 'contain'
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    if (fit === 'cover') {
      if (targetWidth && targetHeight) {
        return { width: targetWidth, height: targetHeight };
      }
      if (targetWidth) {
        return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
      }
      if (targetHeight) {
        return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
      }
    }

    if (fit === 'contain') {
      if (targetWidth && targetHeight) {
        const targetRatio = targetWidth / targetHeight;

        if (aspectRatio > targetRatio) {
          // Image is wider
          return {
            width: targetWidth,
            height: Math.round(targetWidth / aspectRatio),
          };
        } else {
          // Image is taller
          return {
            width: Math.round(targetHeight * aspectRatio),
            height: targetHeight,
          };
        }
      }

      if (targetWidth) {
        return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
      }

      if (targetHeight) {
        return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
      }
    }

    return { width: originalWidth, height: originalHeight };
  }

  /**
   * Dynamically load sharp (server-side only)
   */
  private async loadSharp() {
    try {
      const sharp = (await import('sharp')).default;
      return sharp;
    } catch (error) {
      throw new Error(
        'Sharp library not available. Install with: npm install sharp'
      );
    }
  }
}

/**
 * Create image processor instance
 */
export function createImageProcessor(): ImageProcessor {
  return new ImageProcessor();
}

/**
 * Quick helper functions
 */

export async function resizeImage(
  input: Buffer | string,
  width: number,
  height: number
): Promise<ProcessImageResult> {
  const processor = createImageProcessor();
  return processor.resize(input, width, height);
}

export async function optimizeImage(
  input: Buffer | string,
  quality?: number
): Promise<ProcessImageResult> {
  const processor = createImageProcessor();
  return processor.optimize(input, { quality });
}

export async function convertImageFormat(
  input: Buffer | string,
  format: 'jpeg' | 'png' | 'webp',
  quality?: number
): Promise<ProcessImageResult> {
  const processor = createImageProcessor();
  return processor.convert(input, format, quality);
}

export async function getImageInfo(input: Buffer | string): Promise<ImageInfo> {
  const processor = createImageProcessor();
  return processor.getInfo(input);
}
