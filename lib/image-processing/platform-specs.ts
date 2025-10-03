/**
 * Platform-Specific Image Specifications
 * Handles image requirements for different social media and publishing platforms
 */

import { ImageProcessor } from './processor';

export interface PlatformImageSpec {
  platform: string;
  type: string;
  width: number;
  height: number;
  aspectRatio: string;
  maxFileSize: number; // in bytes
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
}

/**
 * Platform image specifications
 * Updated for 2024 requirements
 */
export const PLATFORM_IMAGE_SPECS: Record<string, Record<string, PlatformImageSpec>> = {
  twitter: {
    post: {
      platform: 'twitter',
      type: 'post',
      width: 1200,
      height: 675,
      aspectRatio: '16:9',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      format: 'jpeg',
      quality: 85,
    },
    square: {
      platform: 'twitter',
      type: 'square',
      width: 1200,
      height: 1200,
      aspectRatio: '1:1',
      maxFileSize: 5 * 1024 * 1024,
      format: 'jpeg',
      quality: 85,
    },
    card: {
      platform: 'twitter',
      type: 'card',
      width: 1200,
      height: 628,
      aspectRatio: '1.91:1',
      maxFileSize: 5 * 1024 * 1024,
      format: 'jpeg',
      quality: 85,
    },
  },
  linkedin: {
    post: {
      platform: 'linkedin',
      type: 'post',
      width: 1200,
      height: 627,
      aspectRatio: '1.91:1',
      maxFileSize: 5 * 1024 * 1024,
      format: 'jpeg',
      quality: 90,
    },
    square: {
      platform: 'linkedin',
      type: 'square',
      width: 1200,
      height: 1200,
      aspectRatio: '1:1',
      maxFileSize: 5 * 1024 * 1024,
      format: 'jpeg',
      quality: 90,
    },
  },
  facebook: {
    post: {
      platform: 'facebook',
      type: 'post',
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1',
      maxFileSize: 8 * 1024 * 1024, // 8MB
      format: 'jpeg',
      quality: 85,
    },
    story: {
      platform: 'facebook',
      type: 'story',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      maxFileSize: 8 * 1024 * 1024,
      format: 'jpeg',
      quality: 85,
    },
  },
  instagram: {
    post: {
      platform: 'instagram',
      type: 'post',
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      maxFileSize: 8 * 1024 * 1024,
      format: 'jpeg',
      quality: 90,
    },
    landscape: {
      platform: 'instagram',
      type: 'landscape',
      width: 1080,
      height: 566,
      aspectRatio: '1.91:1',
      maxFileSize: 8 * 1024 * 1024,
      format: 'jpeg',
      quality: 90,
    },
    portrait: {
      platform: 'instagram',
      type: 'portrait',
      width: 1080,
      height: 1350,
      aspectRatio: '4:5',
      maxFileSize: 8 * 1024 * 1024,
      format: 'jpeg',
      quality: 90,
    },
    story: {
      platform: 'instagram',
      type: 'story',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      maxFileSize: 8 * 1024 * 1024,
      format: 'jpeg',
      quality: 90,
    },
  },
  blog: {
    featured: {
      platform: 'blog',
      type: 'featured',
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1',
      maxFileSize: 2 * 1024 * 1024, // 2MB
      format: 'webp',
      quality: 85,
    },
    hero: {
      platform: 'blog',
      type: 'hero',
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      maxFileSize: 3 * 1024 * 1024,
      format: 'webp',
      quality: 85,
    },
    inline: {
      platform: 'blog',
      type: 'inline',
      width: 800,
      height: 600,
      aspectRatio: '4:3',
      maxFileSize: 1 * 1024 * 1024, // 1MB
      format: 'webp',
      quality: 80,
    },
  },
  email: {
    header: {
      platform: 'email',
      type: 'header',
      width: 600,
      height: 300,
      aspectRatio: '2:1',
      maxFileSize: 500 * 1024, // 500KB
      format: 'jpeg',
      quality: 80,
    },
    inline: {
      platform: 'email',
      type: 'inline',
      width: 600,
      height: 400,
      aspectRatio: '3:2',
      maxFileSize: 500 * 1024,
      format: 'jpeg',
      quality: 75,
    },
  },
  opengraph: {
    default: {
      platform: 'opengraph',
      type: 'default',
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1',
      maxFileSize: 2 * 1024 * 1024,
      format: 'jpeg',
      quality: 85,
    },
  },
};

/**
 * Platform Image Processor
 * Generates platform-specific images from a source image
 */
export class PlatformImageProcessor {
  private processor: ImageProcessor;

  constructor() {
    this.processor = new ImageProcessor();
  }

  /**
   * Process image for a specific platform
   */
  async processForPlatform(
    input: Buffer | string,
    platform: string,
    type: string = 'post'
  ): Promise<{
    buffer: Buffer;
    spec: PlatformImageSpec;
    metadata: {
      width: number;
      height: number;
      format: string;
      size: number;
    };
  }> {
    const spec = this.getSpec(platform, type);

    if (!spec) {
      throw new Error(`No spec found for platform: ${platform}, type: ${type}`);
    }

    const result = await this.processor.process(input, {
      width: spec.width,
      height: spec.height,
      fit: 'cover',
      format: spec.format,
      quality: spec.quality,
    });

    // Check file size
    if (result.size > spec.maxFileSize) {
      // Re-process with lower quality
      const lowerQuality = Math.max(50, spec.quality - 20);
      const reprocessed = await this.processor.process(input, {
        width: spec.width,
        height: spec.height,
        fit: 'cover',
        format: spec.format,
        quality: lowerQuality,
      });

      return {
        buffer: reprocessed.buffer,
        spec,
        metadata: {
          width: reprocessed.width,
          height: reprocessed.height,
          format: reprocessed.format,
          size: reprocessed.size,
        },
      };
    }

    return {
      buffer: result.buffer,
      spec,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size,
      },
    };
  }

  /**
   * Process image for multiple platforms
   */
  async processForPlatforms(
    input: Buffer | string,
    platforms: Array<{ platform: string; type?: string }>
  ): Promise<
    Array<{
      platform: string;
      type: string;
      buffer: Buffer;
      spec: PlatformImageSpec;
      metadata: {
        width: number;
        height: number;
        format: string;
        size: number;
      };
    }>
  > {
    const results = [];

    for (const { platform, type } of platforms) {
      const result = await this.processForPlatform(input, platform, type);
      results.push({
        platform,
        type: type || 'post',
        ...result,
      });
    }

    return results;
  }

  /**
   * Generate all sizes for a platform
   */
  async generateAllSizes(
    input: Buffer | string,
    platform: string
  ): Promise<
    Array<{
      type: string;
      buffer: Buffer;
      spec: PlatformImageSpec;
      metadata: {
        width: number;
        height: number;
        format: string;
        size: number;
      };
    }>
  > {
    const platformSpecs = PLATFORM_IMAGE_SPECS[platform];

    if (!platformSpecs) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const results = [];

    for (const [type, spec] of Object.entries(platformSpecs)) {
      const result = await this.processForPlatform(input, platform, type);
      results.push({
        type,
        ...result,
      });
    }

    return results;
  }

  /**
   * Get specification for platform/type
   */
  getSpec(platform: string, type: string = 'post'): PlatformImageSpec | null {
    const platformSpecs = PLATFORM_IMAGE_SPECS[platform];
    if (!platformSpecs) return null;

    return platformSpecs[type] || null;
  }

  /**
   * Get all specs for a platform
   */
  getPlatformSpecs(platform: string): Record<string, PlatformImageSpec> | null {
    return PLATFORM_IMAGE_SPECS[platform] || null;
  }

  /**
   * List all available platforms
   */
  listPlatforms(): string[] {
    return Object.keys(PLATFORM_IMAGE_SPECS);
  }

  /**
   * List available types for a platform
   */
  listTypes(platform: string): string[] {
    const specs = PLATFORM_IMAGE_SPECS[platform];
    return specs ? Object.keys(specs) : [];
  }

  /**
   * Validate image dimensions against platform requirements
   */
  async validateDimensions(
    input: Buffer | string,
    platform: string,
    type: string = 'post'
  ): Promise<{
    valid: boolean;
    spec: PlatformImageSpec;
    actual: { width: number; height: number };
    issues: string[];
  }> {
    const spec = this.getSpec(platform, type);

    if (!spec) {
      return {
        valid: false,
        spec: {} as PlatformImageSpec,
        actual: { width: 0, height: 0 },
        issues: [`No spec found for ${platform}/${type}`],
      };
    }

    const info = await this.processor.getInfo(input);
    const issues: string[] = [];

    if (info.width !== spec.width) {
      issues.push(
        `Width mismatch: ${info.width}px (expected ${spec.width}px)`
      );
    }

    if (info.height !== spec.height) {
      issues.push(
        `Height mismatch: ${info.height}px (expected ${spec.height}px)`
      );
    }

    if (info.size > spec.maxFileSize) {
      issues.push(
        `File too large: ${(info.size / 1024 / 1024).toFixed(2)}MB (max ${(
          spec.maxFileSize /
          1024 /
          1024
        ).toFixed(2)}MB)`
      );
    }

    return {
      valid: issues.length === 0,
      spec,
      actual: { width: info.width, height: info.height },
      issues,
    };
  }
}

/**
 * Create platform image processor instance
 */
export function createPlatformImageProcessor(): PlatformImageProcessor {
  return new PlatformImageProcessor();
}

/**
 * Convenience function to process for a single platform
 */
export async function processImageForPlatform(
  input: Buffer | string,
  platform: string,
  type?: string
): Promise<{
  buffer: Buffer;
  spec: PlatformImageSpec;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}> {
  const processor = createPlatformImageProcessor();
  return processor.processForPlatform(input, platform, type);
}

/**
 * Convenience function to generate all platform variants
 */
export async function generatePlatformVariants(
  input: Buffer | string,
  platforms: string[]
): Promise<
  Array<{
    platform: string;
    type: string;
    buffer: Buffer;
    spec: PlatformImageSpec;
    metadata: {
      width: number;
      height: number;
      format: string;
      size: number;
    };
  }>
> {
  const processor = createPlatformImageProcessor();
  const platformConfigs = platforms.map((p) => ({ platform: p }));
  return processor.processForPlatforms(input, platformConfigs);
}
