/**
 * The three Roles a User may hold. A Role determines which fields the User
 * must provide (the Conditional Requirement); it confers no permissions.
 */
export const USER_ROLES = ['admin', 'editor', 'viewer'] as const;

export type Role = (typeof USER_ROLES)[number];
