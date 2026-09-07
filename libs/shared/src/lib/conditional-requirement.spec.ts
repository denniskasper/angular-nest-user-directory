import { createUserSchema } from './create-user';
import { isConditionalRequirementIssue } from './conditional-requirement';

/**
 * Seam 1 (spec.md, Testing Decisions): the shared module's parse boundary,
 * where the Conditional Requirement is proved exhaustively. Both
 * applications consume this exact boundary.
 */
describe('the Conditional Requirement', () => {
  const complete = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.org',
    phoneNumber: '+44 20 7946 0958',
    birthDate: '1815-12-10',
  };

  function without(...fields: (keyof typeof complete)[]) {
    const input: Partial<typeof complete> = { ...complete };
    for (const field of fields) delete input[field];
    return input;
  }

  function fieldsAtFault(input: unknown): string[] {
    const result = createUserSchema.safeParse(input);
    return result.success
      ? []
      : result.error.issues.map((issue) => String(issue.path[0]));
  }

  describe('admin', () => {
    it('accepts a complete record', () => {
      expect(fieldsAtFault({ ...complete, role: 'admin' })).toEqual([]);
    });

    it.each(['phoneNumber', 'birthDate'] as const)(
      'rejects a record without %s, naming it',
      (field) => {
        expect(fieldsAtFault({ ...without(field), role: 'admin' })).toEqual([
          field,
        ]);
      },
    );

    it('names both fields when both are missing', () => {
      expect(
        fieldsAtFault({ ...without('phoneNumber', 'birthDate'), role: 'admin' }),
      ).toEqual(['phoneNumber', 'birthDate']);
    });
  });

  describe('editor', () => {
    it('accepts a complete record', () => {
      expect(fieldsAtFault({ ...complete, role: 'editor' })).toEqual([]);
    });

    it('accepts a record without birthDate', () => {
      expect(fieldsAtFault({ ...without('birthDate'), role: 'editor' })).toEqual(
        [],
      );
    });

    it('rejects a record without phoneNumber, naming it', () => {
      expect(
        fieldsAtFault({ ...without('phoneNumber'), role: 'editor' }),
      ).toEqual(['phoneNumber']);
    });
  });

  describe('viewer', () => {
    it('accepts a complete record', () => {
      expect(fieldsAtFault({ ...complete, role: 'viewer' })).toEqual([]);
    });

    it('accepts a record without phoneNumber and birthDate', () => {
      expect(
        fieldsAtFault({
          ...without('phoneNumber', 'birthDate'),
          role: 'viewer',
        }),
      ).toEqual([]);
    });
  });

  it('rejects a Role outside admin, editor and viewer, naming role', () => {
    expect(fieldsAtFault({ ...complete, role: 'owner' })).toEqual(['role']);
  });

  it('is not suppressed by an error in an unrelated field', () => {
    expect(
      fieldsAtFault({ ...without('phoneNumber'), email: 'nope', role: 'admin' }),
    ).toEqual(['email', 'phoneNumber']);
  });

  it('tells the person which Role wants the field', () => {
    const result = createUserSchema.safeParse({
      ...without('phoneNumber', 'birthDate'),
      role: 'admin',
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'An admin must have a phone number',
      'An admin must have a birth date',
    ]);
  });

  it('marks its issues so a client can tell them from a malformed value', () => {
    const result = createUserSchema.safeParse({
      ...without('phoneNumber'),
      email: 'nope',
      role: 'editor',
    });

    expect(
      result.error?.issues.map((issue) => isConditionalRequirementIssue(issue)),
    ).toEqual([false, true]);
  });

  it('does not crash on input that is not a record', () => {
    expect(createUserSchema.safeParse(null).success).toBe(false);
  });
});
