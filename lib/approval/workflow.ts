/**
 * Approval Workflow Engine
 *
 * State machine for content approval workflow with transitions,
 * validation, and event handling.
 */

import { ApprovalStatus, ApprovalDecision, ApprovalPriority } from "@prisma/client";
import { db } from "@/lib/db";

export interface ApprovalStateTransition {
  from: ApprovalStatus;
  to: ApprovalStatus;
  event: ApprovalEvent;
  validate?: (context: ApprovalContext) => Promise<boolean>;
  onTransition?: (context: ApprovalContext) => Promise<void>;
}

export type ApprovalEvent =
  | "SUBMIT"
  | "START_REVIEW"
  | "APPROVE"
  | "REJECT"
  | "REQUEST_CHANGES"
  | "RESUBMIT"
  | "ESCALATE"
  | "CANCEL"
  | "EXPIRE";

export interface ApprovalContext {
  approvalId: string;
  userId: string;
  metadata?: Record<string, any>;
  reason?: string;
  feedback?: string;
}

// State machine definition
const APPROVAL_STATE_MACHINE: ApprovalStateTransition[] = [
  // Initial submission
  {
    from: ApprovalStatus.PENDING,
    to: ApprovalStatus.IN_REVIEW,
    event: "START_REVIEW",
    validate: async (ctx) => {
      const approval = await db.contentApproval.findUnique({
        where: { id: ctx.approvalId },
        include: { content: true }
      });
      return approval?.status === ApprovalStatus.PENDING;
    },
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.IN_REVIEW,
          history: {
            push: {
              event: "START_REVIEW",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Approval
  {
    from: ApprovalStatus.IN_REVIEW,
    to: ApprovalStatus.APPROVED,
    event: "APPROVE",
    validate: async (ctx) => {
      const approval = await db.contentApproval.findUnique({
        where: { id: ctx.approvalId },
      });

      if (!approval) return false;

      // Check if user has permission to approve
      if (approval.assignedTo.length > 0 && !approval.assignedTo.includes(ctx.userId)) {
        return false;
      }

      return approval.status === ApprovalStatus.IN_REVIEW;
    },
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.APPROVED,
          decision: ApprovalDecision.APPROVE,
          approvedBy: ctx.userId,
          approvedAt: new Date(),
          feedback: ctx.feedback,
          history: {
            push: {
              event: "APPROVE",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              feedback: ctx.feedback,
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Rejection
  {
    from: ApprovalStatus.IN_REVIEW,
    to: ApprovalStatus.REJECTED,
    event: "REJECT",
    validate: async (ctx) => {
      const approval = await db.contentApproval.findUnique({
        where: { id: ctx.approvalId },
      });

      if (!approval) return false;

      // Check if user has permission to reject
      if (approval.assignedTo.length > 0 && !approval.assignedTo.includes(ctx.userId)) {
        return false;
      }

      return approval.status === ApprovalStatus.IN_REVIEW;
    },
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.REJECTED,
          decision: ApprovalDecision.REJECT,
          rejectedBy: ctx.userId,
          rejectedAt: new Date(),
          feedback: ctx.feedback,
          history: {
            push: {
              event: "REJECT",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              feedback: ctx.feedback,
              reason: ctx.reason,
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Request changes
  {
    from: ApprovalStatus.IN_REVIEW,
    to: ApprovalStatus.CHANGES_REQUESTED,
    event: "REQUEST_CHANGES",
    validate: async (ctx) => {
      const approval = await db.contentApproval.findUnique({
        where: { id: ctx.approvalId },
      });

      if (!approval) return false;

      // Check if user has permission
      if (approval.assignedTo.length > 0 && !approval.assignedTo.includes(ctx.userId)) {
        return false;
      }

      return approval.status === ApprovalStatus.IN_REVIEW;
    },
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.CHANGES_REQUESTED,
          decision: ApprovalDecision.REQUEST_CHANGES,
          feedback: ctx.feedback,
          history: {
            push: {
              event: "REQUEST_CHANGES",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              feedback: ctx.feedback,
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Resubmit after changes
  {
    from: ApprovalStatus.CHANGES_REQUESTED,
    to: ApprovalStatus.PENDING,
    event: "RESUBMIT",
    validate: async (ctx) => {
      const approval = await db.contentApproval.findUnique({
        where: { id: ctx.approvalId },
      });
      return approval?.status === ApprovalStatus.CHANGES_REQUESTED;
    },
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.PENDING,
          history: {
            push: {
              event: "RESUBMIT",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Escalation
  {
    from: ApprovalStatus.IN_REVIEW,
    to: ApprovalStatus.ESCALATED,
    event: "ESCALATE",
    validate: async (ctx) => {
      const approval = await db.contentApproval.findUnique({
        where: { id: ctx.approvalId },
      });
      return approval?.status === ApprovalStatus.IN_REVIEW;
    },
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.ESCALATED,
          escalatedAt: new Date(),
          escalatedTo: ctx.metadata?.escalatedTo,
          escalationReason: ctx.reason,
          priority: ApprovalPriority.HIGH,
          history: {
            push: {
              event: "ESCALATE",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              reason: ctx.reason,
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Escalated back to review
  {
    from: ApprovalStatus.ESCALATED,
    to: ApprovalStatus.IN_REVIEW,
    event: "START_REVIEW",
    validate: async (ctx) => {
      const approval = await db.contentApproval.findUnique({
        where: { id: ctx.approvalId },
      });
      return approval?.status === ApprovalStatus.ESCALATED;
    },
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.IN_REVIEW,
          history: {
            push: {
              event: "START_REVIEW",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Cancellation (from any state except APPROVED/REJECTED)
  {
    from: ApprovalStatus.PENDING,
    to: ApprovalStatus.CANCELLED,
    event: "CANCEL",
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.CANCELLED,
          history: {
            push: {
              event: "CANCEL",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              reason: ctx.reason,
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },
  {
    from: ApprovalStatus.IN_REVIEW,
    to: ApprovalStatus.CANCELLED,
    event: "CANCEL",
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.CANCELLED,
          history: {
            push: {
              event: "CANCEL",
              userId: ctx.userId,
              timestamp: new Date().toISOString(),
              reason: ctx.reason,
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  },

  // Expiration (from PENDING or IN_REVIEW)
  {
    from: ApprovalStatus.PENDING,
    to: ApprovalStatus.EXPIRED,
    event: "EXPIRE",
    onTransition: async (ctx) => {
      await db.contentApproval.update({
        where: { id: ctx.approvalId },
        data: {
          status: ApprovalStatus.EXPIRED,
          history: {
            push: {
              event: "EXPIRE",
              timestamp: new Date().toISOString(),
              reason: "Approval request expired after timeout",
              metadata: ctx.metadata
            }
          }
        }
      });
    }
  }
];

/**
 * Execute a state transition
 */
export async function executeTransition(
  event: ApprovalEvent,
  context: ApprovalContext
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current approval state
    const approval = await db.contentApproval.findUnique({
      where: { id: context.approvalId }
    });

    if (!approval) {
      return { success: false, error: "Approval not found" };
    }

    // Find valid transition
    const transition = APPROVAL_STATE_MACHINE.find(
      (t) => t.from === approval.status && t.event === event
    );

    if (!transition) {
      return {
        success: false,
        error: `Invalid transition: ${event} from ${approval.status}`
      };
    }

    // Validate transition
    if (transition.validate) {
      const isValid = await transition.validate(context);
      if (!isValid) {
        return { success: false, error: "Transition validation failed" };
      }
    }

    // Execute transition
    if (transition.onTransition) {
      await transition.onTransition(context);
    }

    return { success: true };
  } catch (error) {
    console.error("Error executing transition:", error);
    return { success: false, error: "Internal error" };
  }
}

/**
 * Get available transitions for current state
 */
export async function getAvailableTransitions(
  approvalId: string
): Promise<ApprovalEvent[]> {
  const approval = await db.contentApproval.findUnique({
    where: { id: approvalId }
  });

  if (!approval) return [];

  return APPROVAL_STATE_MACHINE
    .filter((t) => t.from === approval.status)
    .map((t) => t.event);
}

/**
 * Check if approval has expired (> 24 hours pending)
 */
export async function checkExpiredApprovals(): Promise<void> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expiredApprovals = await db.contentApproval.findMany({
    where: {
      status: {
        in: [ApprovalStatus.PENDING, ApprovalStatus.IN_REVIEW]
      },
      requestedAt: {
        lt: twentyFourHoursAgo
      }
    }
  });

  for (const approval of expiredApprovals) {
    await executeTransition("EXPIRE", {
      approvalId: approval.id,
      userId: "system"
    });
  }
}

/**
 * Auto-escalate if pending > 24 hours
 */
export async function autoEscalate(approvalId: string, escalateTo: string): Promise<void> {
  const approval = await db.contentApproval.findUnique({
    where: { id: approvalId }
  });

  if (!approval || approval.status !== ApprovalStatus.IN_REVIEW) {
    return;
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (approval.requestedAt < twentyFourHoursAgo) {
    await executeTransition("ESCALATE", {
      approvalId,
      userId: "system",
      reason: "Auto-escalated after 24 hours",
      metadata: { escalatedTo }
    });
  }
}
