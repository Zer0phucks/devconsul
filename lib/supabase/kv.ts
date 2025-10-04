/**
 * Supabase Key-Value Store Adapter
 * Replaces Vercel KV with Supabase database-backed storage
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// KV-like interface using Supabase
class SupabaseKV {
  /**
   * Get appropriate Supabase client based on context
   * Uses service client during build, regular client during request
   */
  private async getClient() {
    try {
      // Try to use request-scoped client first
      return await createClient();
    } catch (error) {
      // Fallback to service client for build-time operations
      return createServiceClient();
    }
  }

  /**
   * Set a key-value pair with optional expiration
   */
  async set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<string> {
    try {
      const supabase = await this.getClient();
      const expiresAt = options?.ex
        ? new Date(Date.now() + options.ex * 1000)
        : options?.px
        ? new Date(Date.now() + options.px)
        : null;

      const { error } = await supabase
        .from('kv_store')
        .upsert({
          key,
          value: JSON.stringify(value),
          expires_at: expiresAt,
          updated_at: new Date(),
        });

      if (error) throw error;
      return 'OK';
    } catch (error) {
      console.error('KV set error:', error);
      return 'OK'; // Fail gracefully
    }
  }

  /**
   * Get a value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('kv_store')
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) return null;

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Expired, delete it
        await this.del(key);
        return null;
      }

      return JSON.parse(data.value) as T;
    } catch (error) {
      console.error('KV get error:', error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  async del(...keys: string[]): Promise<number> {
    try {
      const supabase = await this.getClient();
      const { error, count } = await supabase
        .from('kv_store')
        .delete()
        .in('key', keys);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('KV del error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    try {
      const supabase = await this.getClient();
      const { count, error } = await supabase
        .from('kv_store')
        .select('key', { count: 'exact', head: true })
        .in('key', keys);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('KV exists error:', error);
      return 0;
    }
  }

  /**
   * Get keys matching a pattern (simplified - exact match or prefix)
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const supabase = await this.getClient();

      // Convert Redis-style pattern to SQL LIKE pattern
      // * becomes %
      const likePattern = pattern.replace(/\*/g, '%');

      const { data, error } = await supabase
        .from('kv_store')
        .select('key')
        .like('key', likePattern);

      if (error) throw error;
      return data?.map(row => row.key) || [];
    } catch (error) {
      console.error('KV keys error:', error);
      return [];
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    try {
      const current = await this.get<number>(key);
      const newValue = (current || 0) + 1;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error('KV incr error:', error);
      return 1;
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string): Promise<number> {
    try {
      const current = await this.get<number>(key);
      const newValue = (current || 0) - 1;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error('KV decr error:', error);
      return -1;
    }
  }

  /**
   * Add to sorted set (simplified - just store array)
   */
  async zadd(key: string, ...args: any[]): Promise<number> {
    try {
      // Parse Redis zadd format: score1 member1 score2 member2
      // or object format: { score: number, member: string }
      const members: Array<{ score: number; member: string }> = [];

      if (typeof args[0] === 'object' && 'score' in args[0]) {
        // Object format
        members.push(...args);
      } else {
        // Flat format
        for (let i = 0; i < args.length; i += 2) {
          members.push({ score: args[i], member: args[i + 1] });
        }
      }

      const current = await this.get<Array<{ score: number; member: string }>>(key) || [];
      const updated = [...current, ...members];
      await this.set(key, updated);

      return members.length;
    } catch (error) {
      console.error('KV zadd error:', error);
      return 0;
    }
  }

  /**
   * Get sorted set range
   */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      const data = await this.get<Array<{ score: number; member: string }>>(key);
      if (!data) return [];

      const sorted = data.sort((a, b) => a.score - b.score);
      const slice = sorted.slice(start, stop === -1 ? undefined : stop + 1);
      return slice.map(item => item.member);
    } catch (error) {
      console.error('KV zrange error:', error);
      return [];
    }
  }

  /**
   * Expire a key after seconds
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const current = await this.get(key);
      if (!current) return false;

      await this.set(key, current, { ex: seconds });
      return true;
    } catch (error) {
      console.error('KV expire error:', error);
      return false;
    }
  }

  /**
   * Set expiration timestamp
   */
  async expireat(key: string, timestamp: number): Promise<boolean> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase
        .from('kv_store')
        .update({ expires_at: new Date(timestamp * 1000) })
        .eq('key', key);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('KV expireat error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const kv = new SupabaseKV();
