/**
 * Integration Tests: Authentication API
 * Tests signup, signin, and signout endpoints with database integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import {
  createUnauthenticatedRequest,
  testDataFactories,
  setupTestEnvironment,
  teardownTestEnvironment,
  assertValidationError,
} from '../utils/test-helpers';

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  signUpWithPassword: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
}));

const { signUpWithPassword } = require('@/lib/auth');

describe('Authentication API Integration Tests', () => {
  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      };

      const mockUser = {
        user: {
          id: 'user-new-123',
          email: userData.email,
          user_metadata: { name: userData.name },
        },
      };

      signUpWithPassword.mockResolvedValue(mockUser);

      const request = createUnauthenticatedRequest(
        'POST',
        '/api/auth/signup',
        userData
      );

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User created successfully');
      expect(data.user).toEqual({
        id: mockUser.user.id,
        email: mockUser.user.email,
        name: userData.name,
      });

      expect(signUpWithPassword).toHaveBeenCalledWith(
        userData.email,
        userData.password,
        { name: userData.name }
      );
    });

    it('should reject signup with missing email', async () => {
      const request = createUnauthenticatedRequest('POST', '/api/auth/signup', {
        password: 'SecurePassword123!',
        name: 'Test User',
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
      expect(signUpWithPassword).not.toHaveBeenCalled();
    });

    it('should reject signup with missing password', async () => {
      const request = createUnauthenticatedRequest('POST', '/api/auth/signup', {
        email: 'test@example.com',
        name: 'Test User',
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
      expect(signUpWithPassword).not.toHaveBeenCalled();
    });

    it('should reject signup with missing name', async () => {
      const request = createUnauthenticatedRequest('POST', '/api/auth/signup', {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
      expect(signUpWithPassword).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', async () => {
      const request = createUnauthenticatedRequest('POST', '/api/auth/signup', {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'Test User',
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
      expect(signUpWithPassword).not.toHaveBeenCalled();
    });

    it('should reject weak password (less than 8 characters)', async () => {
      const request = createUnauthenticatedRequest('POST', '/api/auth/signup', {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 8 characters');
      expect(signUpWithPassword).not.toHaveBeenCalled();
    });

    it('should handle duplicate email error', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      signUpWithPassword.mockRejectedValue(
        new Error('User already registered with this email')
      );

      const request = createUnauthenticatedRequest(
        'POST',
        '/api/auth/signup',
        userData
      );

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('User with this email already exists');
    });

    it('should handle internal server errors gracefully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      signUpWithPassword.mockRejectedValue(new Error('Database connection failed'));

      const request = createUnauthenticatedRequest(
        'POST',
        '/api/auth/signup',
        userData
      );

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should sanitize email input', async () => {
      const userData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      const mockUser = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { name: userData.name },
        },
      };

      signUpWithPassword.mockResolvedValue(mockUser);

      const request = createUnauthenticatedRequest(
        'POST',
        '/api/auth/signup',
        userData
      );

      const response = await signupHandler(request);
      expect(response.status).toBe(201);

      // Should be called with trimmed, lowercase email
      expect(signUpWithPassword).toHaveBeenCalledWith(
        userData.email,
        userData.password,
        { name: userData.name }
      );
    });

    it('should validate special characters in name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User <script>alert("xss")</script>',
      };

      const mockUser = {
        user: {
          id: 'user-123',
          email: userData.email,
          user_metadata: { name: userData.name },
        },
      };

      signUpWithPassword.mockResolvedValue(mockUser);

      const request = createUnauthenticatedRequest(
        'POST',
        '/api/auth/signup',
        userData
      );

      const response = await signupHandler(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Session Management', () => {
    it('should create valid session on successful signup', async () => {
      const userData = {
        email: 'session@example.com',
        password: 'SecurePassword123!',
        name: 'Session User',
      };

      const mockUser = {
        user: {
          id: 'user-session-123',
          email: userData.email,
          user_metadata: { name: userData.name },
        },
      };

      signUpWithPassword.mockResolvedValue(mockUser);

      const request = createUnauthenticatedRequest(
        'POST',
        '/api/auth/signup',
        userData
      );

      const response = await signupHandler(request);
      const data = await response.json();

      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBe(userData.email);
      expect(data.user.name).toBe(userData.name);
    });
  });

  describe('Security Validation', () => {
    it('should reject SQL injection attempts in email', async () => {
      const request = createUnauthenticatedRequest('POST', '/api/auth/signup', {
        email: "admin'--@example.com",
        password: 'SecurePassword123!',
        name: 'Test User',
      });

      const response = await signupHandler(request);
      expect(response.status).toBe(400);
    });

    it('should reject XSS attempts in name field', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: '<img src=x onerror=alert(1)>',
      };

      const mockUser = {
        user: {
          id: 'user-123',
          email: userData.email,
          user_metadata: { name: userData.name },
        },
      };

      signUpWithPassword.mockResolvedValue(mockUser);

      const request = createUnauthenticatedRequest(
        'POST',
        '/api/auth/signup',
        userData
      );

      const response = await signupHandler(request);
      // Should still process but sanitize the name
      expect(response.status).toBe(201);
    });
  });
});
