import { Role } from "@prisma/client";

export type Permission =
  | "view_all_projects"
  | "create_edit_projects"
  | "view_all_reports"
  | "submit_reports"
  | "approve_reports"
  | "create_users"
  | "delete_users"
  | "manage_teams"
  | "view_audit_log"
  | "receive_client_messages"
  | "send_messages"
  | "system_settings"
  | "download_reports"
  | "manage_all_users"
  | "view_team_projects"
  | "view_team_reports"
  | "create_team_users";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CEO: [
    "view_all_projects",
    "create_edit_projects",
    "view_all_reports",
    "submit_reports",
    "approve_reports",
    "create_users",
    "delete_users",
    "manage_teams",
    "view_audit_log",
    "receive_client_messages",
    "send_messages",
    "system_settings",
    "download_reports",
    "manage_all_users",
    "view_team_projects",
    "view_team_reports",
    "create_team_users",
  ],
  ADMIN: [
    "view_all_projects",
    "create_edit_projects",
    "view_all_reports",
    "approve_reports",
    "create_users",
    "delete_users",
    "manage_teams",
    "view_audit_log",
    "send_messages",
    "system_settings",
    "download_reports",
    "manage_all_users",
    "view_team_projects",
    "view_team_reports",
    "create_team_users",
  ],
  DEVELOPER: [
    "view_all_projects",
    "create_edit_projects",
    "view_all_reports",
    "submit_reports",
    "approve_reports",
    "create_users",
    "delete_users",
    "manage_teams",
    "view_audit_log",
    "send_messages",
    "download_reports",
    "manage_all_users",
    "view_team_projects",
    "view_team_reports",
    "create_team_users",
  ],
  HEAD: [
    "create_edit_projects",
    "view_team_projects",
    "view_team_reports",
    "submit_reports",
    "approve_reports",
    "manage_teams",
    "send_messages",
    "download_reports",
    "create_team_users",
  ],
  INTERN: ["submit_reports", "download_reports"],
  CLIENT: ["send_messages", "download_reports"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canCreateRole(creatorRole: Role, targetRole: Role): boolean {
  if (["CEO", "ADMIN", "DEVELOPER"].includes(creatorRole)) return true;
  if (creatorRole === "HEAD") {
    return ["DEVELOPER", "INTERN"].includes(targetRole);
  }
  return false;
}

export function canDeleteUser(actorRole: Role): boolean {
  return ["CEO", "ADMIN", "DEVELOPER"].includes(actorRole);
}

export function canMessageUser(
  senderRole: Role,
  receiverRole: Role,
  isAssigned: boolean = false
): boolean {
  if (senderRole === "CEO") return true;
  if (senderRole === "ADMIN") return true;
  if (senderRole === "DEVELOPER") {
    return ["CLIENT", "CEO", "DEVELOPER", "HEAD", "INTERN"].includes(
      receiverRole
    );
  }
  if (senderRole === "HEAD") {
    return ["DEVELOPER", "INTERN", "CEO"].includes(receiverRole);
  }
  if (senderRole === "INTERN") {
    return ["DEVELOPER", "HEAD"].includes(receiverRole) && isAssigned;
  }
  if (senderRole === "CLIENT") {
    return (
      receiverRole === "CEO" ||
      (["DEVELOPER", "HEAD"].includes(receiverRole) && isAssigned)
    );
  }
  return false;
}

export const ROLE_LABELS: Record<Role, string> = {
  CEO: "👑 CEO",
  ADMIN: "🔴 Admin",
  DEVELOPER: "🟡 Developer",
  HEAD: "🟠 Head",
  INTERN: "🟢 Intern",
  CLIENT: "🔵 Client",
};

export const ROLE_COLORS: Record<Role, string> = {
  CEO: "#F6C90E",
  ADMIN: "#EF4444",
  DEVELOPER: "#EAB308",
  HEAD: "#F97316",
  INTERN: "#22C55E",
  CLIENT: "#3B82F6",
};
