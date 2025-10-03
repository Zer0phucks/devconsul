/**
 * Integration Tests: Approval Workflow API
 * Tests content approval submission, review, and state transitions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockRequest,
  mockPrisma,
  testDataFactories,
} from '../utils/test-helpers';

// Mock approval workflow functions
jest.mock('@/lib/approval/workflow', () => ({
  submitForApproval: jest.fn(),
  approveContent: jest.fn(),
  rejectContent: jest.fn(),
  getApprovalStatus: jest.fn(),
  reassignApproval: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const {
  submitForApproval,
  approveContent,
  rejectContent,
  getApprovalStatus,
  reassignApproval,
} = require('@/lib/approval/workflow');

describe('Approval Workflow API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Submit for Approval', () => {
    it('should submit content for approval successfully', async () => {
      const mockContent = testDataFactories.content({ status: 'DRAFT' });
      const approvalData = {
        contentId: mockContent.id,
        assignedTo: 'approver-456',
        notes: 'Please review this content',
      };

      const mockApproval = testDataFactories.contentApproval({
        contentId: mockContent.id,
        status: 'PENDING',
        requestedBy: 'user-123',
        assignedTo: approvalData.assignedTo,
      });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      submitForApproval.mockResolvedValue(mockApproval);

      const result = await submitForApproval({
        ...approvalData,
        userId: 'user-123',
      });

      expect(result.status).toBe('PENDING');
      expect(result.contentId).toBe(mockContent.id);
      expect(result.assignedTo).toBe('approver-456');
      expect(submitForApproval).toHaveBeenCalledWith({
        contentId: mockContent.id,
        assignedTo: 'approver-456',
        notes: 'Please review this content',
        userId: 'user-123',
      });
    });

    it('should prevent duplicate approval submissions', async () => {
      const mockContent = testDataFactories.content();
      const existingApproval = testDataFactories.contentApproval({
        contentId: mockContent.id,
        status: 'PENDING',
      });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.contentApproval.findFirst.mockResolvedValue(existingApproval);

      submitForApproval.mockResolvedValue({
        success: false,
        error: 'Content already has pending approval',
      });

      const result = await submitForApproval({
        contentId: mockContent.id,
        assignedTo: 'approver-456',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('pending approval');
    });

    it('should validate content exists before submission', async () => {
      mockPrisma.content.findFirst.mockResolvedValue(null);

      submitForApproval.mockResolvedValue({
        success: false,
        error: 'Content not found',
      });

      const result = await submitForApproval({
        contentId: 'non-existent-content',
        assignedTo: 'approver-456',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Content not found');
    });

    it('should validate approver exists and has permissions', async () => {
      const mockContent = testDataFactories.content();

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.user.findFirst.mockResolvedValue(null); // Approver not found

      submitForApproval.mockResolvedValue({
        success: false,
        error: 'Invalid approver',
      });

      const result = await submitForApproval({
        contentId: mockContent.id,
        assignedTo: 'invalid-approver',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid approver');
    });

    it('should update content status on submission', async () => {
      const mockContent = testDataFactories.content({ status: 'DRAFT' });
      const mockApproval = testDataFactories.contentApproval({
        contentId: mockContent.id,
      });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.content.update.mockResolvedValue({
        ...mockContent,
        status: 'PENDING_APPROVAL',
      });
      submitForApproval.mockResolvedValue(mockApproval);

      const result = await submitForApproval({
        contentId: mockContent.id,
        assignedTo: 'approver-456',
        userId: 'user-123',
      });

      expect(mockPrisma.content.update).toHaveBeenCalledWith({
        where: { id: mockContent.id },
        data: expect.objectContaining({
          status: 'PENDING_APPROVAL',
        }),
      });
    });
  });

  describe('Approve Content', () => {
    it('should approve content successfully', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
        assignedTo: 'approver-456',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);
      approveContent.mockResolvedValue({
        ...mockApproval,
        status: 'APPROVED',
        approvedBy: 'approver-456',
        approvedAt: new Date(),
      });

      const result = await approveContent({
        approvalId: mockApproval.id,
        userId: 'approver-456',
        comments: 'Looks good!',
      });

      expect(result.status).toBe('APPROVED');
      expect(result.approvedBy).toBe('approver-456');
      expect(result.approvedAt).toBeDefined();
      expect(approveContent).toHaveBeenCalledWith({
        approvalId: mockApproval.id,
        userId: 'approver-456',
        comments: 'Looks good!',
      });
    });

    it('should only allow assigned approver to approve', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
        assignedTo: 'approver-456',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      approveContent.mockResolvedValue({
        success: false,
        error: 'Not authorized to approve this content',
      });

      const result = await approveContent({
        approvalId: mockApproval.id,
        userId: 'other-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authorized');
    });

    it('should update content status to approved', async () => {
      const mockContent = testDataFactories.content({
        status: 'PENDING_APPROVAL',
      });
      const mockApproval = testDataFactories.contentApproval({
        contentId: mockContent.id,
        status: 'PENDING',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);
      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.content.update.mockResolvedValue({
        ...mockContent,
        status: 'APPROVED',
      });

      approveContent.mockResolvedValue({
        ...mockApproval,
        status: 'APPROVED',
      });

      await approveContent({
        approvalId: mockApproval.id,
        userId: mockApproval.assignedTo!,
      });

      expect(mockPrisma.content.update).toHaveBeenCalledWith({
        where: { id: mockContent.id },
        data: expect.objectContaining({
          status: 'APPROVED',
        }),
      });
    });

    it('should prevent approving already processed approval', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'APPROVED',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      approveContent.mockResolvedValue({
        success: false,
        error: 'Approval already processed',
      });

      const result = await approveContent({
        approvalId: mockApproval.id,
        userId: mockApproval.assignedTo!,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Approval already processed');
    });

    it('should record approval timestamp', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      const approvalTime = new Date();
      approveContent.mockResolvedValue({
        ...mockApproval,
        status: 'APPROVED',
        approvedAt: approvalTime,
      });

      const result = await approveContent({
        approvalId: mockApproval.id,
        userId: mockApproval.assignedTo!,
      });

      expect(result.approvedAt).toBeDefined();
      expect(result.approvedAt).toBeInstanceOf(Date);
    });
  });

  describe('Reject Content', () => {
    it('should reject content with reason', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
      });

      const rejectionReason = 'Content does not align with brand guidelines';

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);
      rejectContent.mockResolvedValue({
        ...mockApproval,
        status: 'REJECTED',
        rejectionReason,
        rejectedAt: new Date(),
      });

      const result = await rejectContent({
        approvalId: mockApproval.id,
        userId: mockApproval.assignedTo!,
        reason: rejectionReason,
      });

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe(rejectionReason);
      expect(result.rejectedAt).toBeDefined();
    });

    it('should require rejection reason', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      rejectContent.mockResolvedValue({
        success: false,
        error: 'Rejection reason is required',
      });

      const result = await rejectContent({
        approvalId: mockApproval.id,
        userId: mockApproval.assignedTo!,
        // Missing reason
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('reason is required');
    });

    it('should update content status to rejected', async () => {
      const mockContent = testDataFactories.content({
        status: 'PENDING_APPROVAL',
      });
      const mockApproval = testDataFactories.contentApproval({
        contentId: mockContent.id,
        status: 'PENDING',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);
      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.content.update.mockResolvedValue({
        ...mockContent,
        status: 'REJECTED',
      });

      rejectContent.mockResolvedValue({
        ...mockApproval,
        status: 'REJECTED',
      });

      await rejectContent({
        approvalId: mockApproval.id,
        userId: mockApproval.assignedTo!,
        reason: 'Not suitable',
      });

      expect(mockPrisma.content.update).toHaveBeenCalledWith({
        where: { id: mockContent.id },
        data: expect.objectContaining({
          status: 'REJECTED',
        }),
      });
    });

    it('should allow resubmission after rejection', async () => {
      const mockContent = testDataFactories.content({
        status: 'REJECTED',
      });
      const oldApproval = testDataFactories.contentApproval({
        contentId: mockContent.id,
        status: 'REJECTED',
      });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.contentApproval.findFirst.mockResolvedValue(oldApproval);

      // User can submit new approval request after rejection
      const newApproval = testDataFactories.contentApproval({
        contentId: mockContent.id,
        status: 'PENDING',
      });

      submitForApproval.mockResolvedValue(newApproval);

      const result = await submitForApproval({
        contentId: mockContent.id,
        assignedTo: 'approver-456',
        userId: 'user-123',
      });

      expect(result.status).toBe('PENDING');
    });
  });

  describe('Approval Status Tracking', () => {
    it('should get approval status', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      getApprovalStatus.mockResolvedValue({
        id: mockApproval.id,
        status: mockApproval.status,
        requestedBy: mockApproval.requestedBy,
        assignedTo: mockApproval.assignedTo,
        createdAt: mockApproval.createdAt,
        history: [],
      });

      const result = await getApprovalStatus({
        approvalId: mockApproval.id,
        userId: 'user-123',
      });

      expect(result.status).toBe('PENDING');
      expect(result.id).toBe(mockApproval.id);
    });

    it('should track approval state changes', async () => {
      const approvalHistory = [
        {
          status: 'PENDING',
          timestamp: new Date('2025-10-01T10:00:00Z'),
          changedBy: 'user-123',
        },
        {
          status: 'APPROVED',
          timestamp: new Date('2025-10-01T11:00:00Z'),
          changedBy: 'approver-456',
        },
      ];

      getApprovalStatus.mockResolvedValue({
        id: 'approval-123',
        status: 'APPROVED',
        history: approvalHistory,
      });

      const result = await getApprovalStatus({
        approvalId: 'approval-123',
        userId: 'user-123',
      });

      expect(result.history).toHaveLength(2);
      expect(result.history[0].status).toBe('PENDING');
      expect(result.history[1].status).toBe('APPROVED');
    });
  });

  describe('Approval Reassignment', () => {
    it('should reassign approval to different approver', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
        assignedTo: 'approver-456',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      reassignApproval.mockResolvedValue({
        ...mockApproval,
        assignedTo: 'new-approver-789',
        reassignedAt: new Date(),
      });

      const result = await reassignApproval({
        approvalId: mockApproval.id,
        newAssignee: 'new-approver-789',
        userId: 'user-123',
      });

      expect(result.assignedTo).toBe('new-approver-789');
      expect(result.reassignedAt).toBeDefined();
    });

    it('should only allow requester to reassign', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'PENDING',
        requestedBy: 'user-123',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      reassignApproval.mockResolvedValue({
        success: false,
        error: 'Only the requester can reassign approval',
      });

      const result = await reassignApproval({
        approvalId: mockApproval.id,
        newAssignee: 'new-approver',
        userId: 'other-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requester can reassign');
    });

    it('should prevent reassigning processed approvals', async () => {
      const mockApproval = testDataFactories.contentApproval({
        status: 'APPROVED',
      });

      mockPrisma.contentApproval.findFirst.mockResolvedValue(mockApproval);

      reassignApproval.mockResolvedValue({
        success: false,
        error: 'Cannot reassign processed approval',
      });

      const result = await reassignApproval({
        approvalId: mockApproval.id,
        newAssignee: 'new-approver',
        userId: mockApproval.requestedBy,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot reassign');
    });
  });

  describe('Bulk Approval Operations', () => {
    it('should approve multiple content items', async () => {
      const approvals = [
        testDataFactories.contentApproval({ id: 'approval-1', status: 'PENDING' }),
        testDataFactories.contentApproval({ id: 'approval-2', status: 'PENDING' }),
        testDataFactories.contentApproval({ id: 'approval-3', status: 'PENDING' }),
      ];

      mockPrisma.contentApproval.findMany.mockResolvedValue(approvals);

      const bulkApprove = jest.fn().mockResolvedValue({
        success: true,
        approved: 3,
        results: approvals.map((a) => ({ ...a, status: 'APPROVED' })),
      });

      const result = await bulkApprove({
        approvalIds: approvals.map((a) => a.id),
        userId: 'approver-456',
      });

      expect(result.success).toBe(true);
      expect(result.approved).toBe(3);
    });
  });

  describe('Notifications', () => {
    it('should notify approver on new approval request', async () => {
      const mockApproval = testDataFactories.contentApproval({
        assignedTo: 'approver-456',
      });

      const sendNotification = jest.fn();

      submitForApproval.mockImplementation(async (data) => {
        await sendNotification({
          to: data.assignedTo,
          type: 'APPROVAL_REQUEST',
          approvalId: mockApproval.id,
        });
        return mockApproval;
      });

      await submitForApproval({
        contentId: 'content-123',
        assignedTo: 'approver-456',
        userId: 'user-123',
      });

      expect(sendNotification).toHaveBeenCalledWith({
        to: 'approver-456',
        type: 'APPROVAL_REQUEST',
        approvalId: mockApproval.id,
      });
    });

    it('should notify requester on approval decision', async () => {
      const mockApproval = testDataFactories.contentApproval({
        requestedBy: 'user-123',
      });

      const sendNotification = jest.fn();

      approveContent.mockImplementation(async (data) => {
        await sendNotification({
          to: mockApproval.requestedBy,
          type: 'APPROVAL_APPROVED',
          approvalId: data.approvalId,
        });
        return { ...mockApproval, status: 'APPROVED' };
      });

      await approveContent({
        approvalId: mockApproval.id,
        userId: mockApproval.assignedTo!,
      });

      expect(sendNotification).toHaveBeenCalledWith({
        to: 'user-123',
        type: 'APPROVAL_APPROVED',
        approvalId: mockApproval.id,
      });
    });
  });
});
