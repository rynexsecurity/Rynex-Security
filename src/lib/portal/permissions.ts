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
    "view_all_reports",
    "view_audit_log",
    "receive_client_messages",
    "send_messages",
    "system_settings",
    "download_reports",
    "manage_teams",
  ],
  ADMIN: [
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
    "system_settings",
    "download_reports",
    "manage_all_users",
    "view_team_projects",
    "view_team_reports",
    "create_team_users",
  ],
  DIRECTOR: [
    "view_all_projects",
    "view_all_reports",
    "view_audit_log",
    "manage_teams",
    "send_messages",
    "download_reports",
    "view_team_projects",
    "view_team_reports",
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
  ],
  DEVELOPER: [
    "view_team_projects",
    "view_team_reports",
    "submit_reports",
    "send_messages",
    "download_reports",
  ],
  INTERN: ["submit_reports", "download_reports"],
  CLIENT: ["send_messages", "download_reports"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canCreateRole(creatorRole: Role, targetRole?: Role): boolean {
  return creatorRole === "ADMIN";
}

export function canDeleteUser(actorRole: Role): boolean {
  return actorRole === "ADMIN";
}

export function canMessageUser(
  senderRole: Role,
  receiverRole: Role,
  isAssigned: boolean = false
): boolean {
  if (senderRole === "CEO") return true;
  if (senderRole === "ADMIN") return true;
  if (senderRole === "DIRECTOR") return true;
  if (senderRole === "DEVELOPER") {
    return ["CLIENT", "CEO", "DEVELOPER", "HEAD", "INTERN"].includes(
      receiverRole
    );
  }
  if (senderRole === "HEAD") {
    return ["DEVELOPER", "INTERN", "CEO", "DIRECTOR"].includes(receiverRole);
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
  DIRECTOR: "👔 Director",
  HEAD: "🟠 Head",
  DEVELOPER: "🟡 Developer",
  INTERN: "🟢 Intern",
  CLIENT: "🔵 Client",
};

export const ROLE_COLORS: Record<Role, string> = {
  CEO: "#FFD700",
  ADMIN: "#FF4D4D",
  DIRECTOR: "#B388FF",
  HEAD: "#FF9100",
  DEVELOPER: "#00FF99",
  INTERN: "#00E5FF",
  CLIENT: "#CBD5E1",
};

export const DEPARTMENT_LABELS: Record<string, string> = {
  RED_TEAM: "🔴 Red Team",
  BLUE_TEAM: "🔵 Blue Team",
  TECHNICAL: "🟢 Technical",
  GRC: "🟣 GRC",
  OPERATIONS: "🟡 Operations",
};

export const DEPARTMENT_COLORS: Record<string, string> = {
  RED_TEAM: "#FF0055",
  BLUE_TEAM: "#00E5FF",
  TECHNICAL: "#00FF99",
  GRC: "#B388FF",
  OPERATIONS: "#FF9100",
};
