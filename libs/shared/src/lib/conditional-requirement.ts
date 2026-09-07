import { Role, USER_ROLES } from './role';

/** The fields a Role may make required. */
export type ConditionalField = 'phoneNumber' | 'birthDate';

/**
 * The Conditional Requirement (CONTEXT.md): which fields a User must
 * provide, by Role. This table is the single definition. The creation
 * schema enforces it for the form and the API alike, the form reads it to
 * say what the chosen Role expects, and the API documentation is derived
 * from it rather than restating it.
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

/** The Roles that make this field required. */
export function rolesRequiring(field: ConditionalField): readonly Role[] {
  return USER_ROLES.filter((role) => REQUIRED_BY_ROLE[role].includes(field));
}

const ROLE_NOUNS: Record<Role, string> = {
  admin: 'an admin',
  editor: 'an editor',
  viewer: 'a viewer',
};

const FIELD_NOUNS: Record<ConditionalField, string> = {
  phoneNumber: 'a phone number',
  birthDate: 'a birth date',
};

function sentenceCase(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** What to tell the person when this Role wants a field they left out. */
export function conditionalRequirementMessage(
  role: Role,
  field: ConditionalField,
): string {
  return `${sentenceCase(ROLE_NOUNS[role])} must have ${FIELD_NOUNS[field]}`;
}

/** What to say about a field the Conditional Requirement governs, e.g. "Required for an admin or an editor". */
export function conditionalFieldDescription(field: ConditionalField): string {
  const roles = rolesRequiring(field).map((role) => ROLE_NOUNS[role]);
  return `Required for ${roles.join(' or ')}`;
}

/**
 * The Conditional Requirement as documentation of the creation schema,
 * derived from the table so it cannot drift from it: prose for a reader,
 * and one `if`/`then` clause per Role for a JSON Schema consumer.
 */
export function conditionalRequirementDocumentation(): {
  description: string;
  allOf: { if: object; then: { required: ConditionalField[] } }[];
} {
  const sentences = USER_ROLES.map((role) => {
    const fields = REQUIRED_BY_ROLE[role];
    const subject = sentenceCase(ROLE_NOUNS[role]);
    return fields.length
      ? `${subject} must have ${fields.map((f) => FIELD_NOUNS[f]).join(' and ')}.`
      : `${subject} has no further requirement.`;
  });
  return {
    description: `Which fields a new User must provide depends on the Role. ${sentences.join(' ')}`,
    allOf: USER_ROLES.filter((role) => REQUIRED_BY_ROLE[role].length).map(
      (role) => ({
        if: { properties: { role: { const: role } } },
        then: { required: [...REQUIRED_BY_ROLE[role]] },
      }),
    ),
  };
}

/**
 * Marks an issue the Conditional Requirement raised, as opposed to one about
 * a malformed value. A client that shows problems only once a field has
 * been visited needs the distinction: a field a Role has just made required
 * is at fault the moment the Role is chosen, before anyone visits it.
 */
export const CONDITIONAL_REQUIREMENT = 'conditionalRequirement';

export function isConditionalRequirementIssue(issue: unknown): boolean {
  if (typeof issue !== 'object' || issue === null) return false;
  const params = (issue as { params?: { rule?: unknown } }).params;
  return params?.rule === CONDITIONAL_REQUIREMENT;
}
