/**
 * System-level role name constants.
 * These match the 'name' field of Role records that are seeded as isSystem=true.
 *
 * WHY: Using string constants instead of inline strings ('LIMITED_TECHNICIAN')
 * means a typo is a compile-time error, not a silent runtime bug where
 * a technician suddenly has admin-level data access.
 */
export const SystemRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  LIMITED_ADMIN: 'LIMITED_ADMIN',
  TECHNICIAN: 'TECHNICIAN',
  LIMITED_TECHNICIAN: 'LIMITED_TECHNICIAN',
  REQUESTER: 'REQUESTER',
  VIEW_ONLY: 'VIEW_ONLY',
} as const;

export type SystemRoleType = (typeof SystemRole)[keyof typeof SystemRole];
