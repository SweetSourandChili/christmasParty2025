/**
 * Server-side logging utility for tracking user actions
 * This is used in API routes to log actions directly
 */

import prisma from "./prisma";

export type LogAction =
  | "LOGIN"
  | "REGISTER"
  | "CREATE_PERFORMANCE"
  | "JOIN_PERFORMANCE"
  | "LEAVE_PERFORMANCE"
  | "JOIN_EVENT"
  | "LEAVE_EVENT"
  | "ADD_TASK"
  | "ADD_FEEDBACK"
  | "VOTE_PERFORMANCE"
  | "COMMENT_PERFORMANCE"
  | "TICKET_STATUS_CHANGE"
  | "ADMIN_DELETE_USER"
  | "ADMIN_CREATE_EVENT"
  | "ADMIN_UPDATE_EVENT"
  | "ADMIN_DELETE_EVENT"
  | "ADMIN_TOGGLE_VOTING"
  | "ADMIN_TOGGLE_ILLUSION"
  | "ADMIN_SYNC_PERFORMANCE_EVENT"
  | "ADMIN_TOGGLE_BODYGUARD"
  | "ADMIN_APPROVE_TICKET"
  | "ADMIN_RESET_NOTIFICATIONS"
  | "VERIFY_TICKET"
  | "UPDATE_PROFILE"
  | "VIEW_PAGE"
  | "CLICK_TAB"
  | "OPEN_MODAL"
  | "CLOSE_MODAL"
  | "CLICK_BUTTON"
  | "VIEW_PERFORMANCE"
  | "VIEW_EVENT"
  | "VIEW_TICKET"
  | "VIEW_DASHBOARD"
  | "VIEW_ADMIN";

/**
 * Log a user action (server-side)
 * This is a fire-and-forget operation - errors are silently caught
 */
export async function logAction(
  userId: string,
  action: LogAction,
  details?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        details: details || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Silently fail - logging should never break the app
    console.error("Failed to log action:", error);
  }
}

