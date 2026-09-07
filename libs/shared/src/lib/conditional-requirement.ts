import { Role } from './role';

/** The fields a Role may make required. */
export const CONDITIONAL_FIELDS = ['phoneNumber', 'birthDate'] as const;

export type ConditionalField = (typeof CONDITIONAL_FIELDS)[number];

/**
 * The Conditional Requirement (CONTEXT.md): which fields a User must
 * provide, by Role. This table is the single definition. The creation
 * schema enforces it for the form and the API alike, and the form reads it
 * to say what the chosen Role expects.
 */
const REQUIRED_BY_ROLE: Record<Role, readonly ConditionalField[]> = {
  admin: ['phoneNumber', 'birthDate'],
  editor: ['phoneNumber'],
  viewer: [],
};

/** The fields a User of this Role must provide, beyond those every User must. */
export function requiredFieldsFor(role: Role): readonly ConditionalField[] {
  return REQUIRED_BY_ROLE[role];
}

const FIELD_NAMES: Record<ConditionalField, string> = {
  phoneNumber: 'a phone number',
  birthDate: 'a birth date',
};

/** What to tell the person when this Role wants a field they left out. */
export function conditionalRequirementMessage(
  role: Role,
  field: ConditionalField,
): string {
  const subject = role === 'admin' || role === 'editor' ? 'An' : 'A';
  return `${subject} ${role} must have ${FIELD_NAMES[field]}`;
}

/**
 * Marks an issue the Conditional Requirement raised, as opposed to one about
 * a malformed value. A client that shows problems only once a field has
 * been visited needs the distinction: a field a Role has just made required
 * is at fault the moment the Role is chosen, before anyone visits it.
 */
export const CONDITIONAL_REQUIREMENT_PARAMS = {
  rule: 'conditionalRequirement',
} as const;

export function isConditionalRequirementIssue(issue: unknown): boolean {
  if (typeof issue !== 'object' || issue === null) return false;
  const params = (issue as { params?: { rule?: unknown } }).params;
  return params?.rule === CONDITIONAL_REQUIREMENT_PARAMS.rule;
}
