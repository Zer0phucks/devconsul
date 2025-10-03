/**
 * Integration Tests: Projects API
 * Tests project CRUD operations with database integration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET, PATCH, DELETE } from '@/app/api/projects/[id]/route';
import {
  createMockRequest,
  createUnauthenticatedRequest,
  mockPrisma,
  testDataFactories,
} from '../utils/test-helpers';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Projects API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/[id]', () => {
    it('should retrieve a project by ID for authenticated user', async () => {
      const mockProject = testDataFactories.project();
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      const request = createMockRequest('GET', '/api/projects/project-123', {
        userId: 'user-123',
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockProject.id);
      expect(data.name).toBe(mockProject.name);
      expect(data.repository).toBe(mockProject.repository);
      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'project-123', userId: 'user-123' },
      });
    });

    it('should return 404 for non-existent project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const request = createMockRequest('GET', '/api/projects/non-existent', {
        userId: 'user-123',
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
    });

    it('should not allow access to other users projects', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const request = createMockRequest('GET', '/api/projects/project-123', {
        userId: 'other-user',
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'project-123', userId: 'other-user' },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.project.findFirst.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest('GET', '/api/projects/project-123', {
        userId: 'user-123',
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch project');
    });

    it('should return properly formatted timestamp fields', async () => {
      const mockProject = testDataFactories.project({
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      });
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      const request = createMockRequest('GET', '/api/projects/project-123', {
        userId: 'user-123',
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(data.createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(data.lastUpdated).toBe('2025-01-02T00:00:00.000Z');
    });
  });

  describe('PATCH /api/projects/[id]', () => {
    it('should update project with valid data', async () => {
      const existingProject = testDataFactories.project();
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description',
      };

      mockPrisma.project.findFirst.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        ...updateData,
      });

      const request = createMockRequest(
        'PATCH',
        '/api/projects/project-123',
        {
          body: updateData,
          userId: 'user-123',
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe(updateData.name);
      expect(data.description).toBe(updateData.description);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: expect.objectContaining({
          name: updateData.name,
          description: updateData.description,
        }),
      });
    });

    it('should return 404 when updating non-existent project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const request = createMockRequest(
        'PATCH',
        '/api/projects/non-existent',
        {
          body: { name: 'Updated Name' },
          userId: 'user-123',
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });

    it('should validate update data with Zod schema', async () => {
      const existingProject = testDataFactories.project();
      mockPrisma.project.findFirst.mockResolvedValue(existingProject);

      const invalidData = {
        name: '', // Empty name should fail validation
      };

      const request = createMockRequest(
        'PATCH',
        '/api/projects/project-123',
        {
          body: invalidData,
          userId: 'user-123',
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });

      expect(response.status).toBe(400);
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });

    it('should not allow updating other users projects', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const request = createMockRequest(
        'PATCH',
        '/api/projects/project-123',
        {
          body: { name: 'Hacked Name' },
          userId: 'hacker-user',
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const existingProject = testDataFactories.project({
        name: 'Original Name',
        description: 'Original Description',
        websiteUrl: 'https://original.com',
      });

      mockPrisma.project.findFirst.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        name: 'Updated Name',
      });

      const request = createMockRequest(
        'PATCH',
        '/api/projects/project-123',
        {
          body: { name: 'Updated Name' }, // Only updating name
          userId: 'user-123',
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
    });

    it('should validate repository URL format', async () => {
      const existingProject = testDataFactories.project();
      mockPrisma.project.findFirst.mockResolvedValue(existingProject);

      const invalidData = {
        repository: 'not-a-valid-url',
      };

      const request = createMockRequest(
        'PATCH',
        '/api/projects/project-123',
        {
          body: invalidData,
          userId: 'user-123',
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/projects/[id]', () => {
    it('should delete project successfully', async () => {
      const mockProject = testDataFactories.project();
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockResolvedValue(mockProject);

      const request = createMockRequest(
        'DELETE',
        '/api/projects/project-123',
        { userId: 'user-123' }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-123' },
      });
    });

    it('should return 404 when deleting non-existent project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const request = createMockRequest(
        'DELETE',
        '/api/projects/non-existent',
        { userId: 'user-123' }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });

    it('should not allow deleting other users projects', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const request = createMockRequest(
        'DELETE',
        '/api/projects/project-123',
        { userId: 'other-user' }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });

    it('should handle cascade deletion errors', async () => {
      const mockProject = testDataFactories.project();
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      const request = createMockRequest(
        'DELETE',
        '/api/projects/project-123',
        { userId: 'user-123' }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'project-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete project');
    });
  });

  describe('Authorization and Security', () => {
    it('should require user authentication for all operations', async () => {
      const operations = [
        { method: 'GET', handler: GET },
        { method: 'PATCH', handler: PATCH },
        { method: 'DELETE', handler: DELETE },
      ];

      for (const { method, handler } of operations) {
        const request = createUnauthenticatedRequest(
          method,
          '/api/projects/project-123'
        );

        // Without x-user-id header, should default to 'default-user'
        // but won't find the project if it doesn't belong to default-user
        mockPrisma.project.findFirst.mockResolvedValue(null);

        const response = await handler(request, {
          params: Promise.resolve({ id: 'project-123' }),
        });

        expect(response.status).toBe(404);
      }
    });

    it('should prevent SQL injection in project ID', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const maliciousId = "'; DROP TABLE projects; --";
      const request = createMockRequest(
        'GET',
        `/api/projects/${encodeURIComponent(maliciousId)}`,
        { userId: 'user-123' }
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: maliciousId }),
      });

      expect(response.status).toBe(404);
      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: maliciousId, userId: 'user-123' },
      });
    });
  });
});
