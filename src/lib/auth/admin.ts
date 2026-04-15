import type { ViewerContext } from "@/lib/auth/viewer";

export function canAccessAdmin(viewer: ViewerContext) {
  return !viewer.hasClerk || viewer.isAdmin;
}

export function assertAdminAccess(viewer: ViewerContext) {
  if (!canAccessAdmin(viewer)) {
    throw new Error("Admin access required.");
  }
}
