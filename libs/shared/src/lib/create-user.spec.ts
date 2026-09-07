import { createUserSchema } from './create-user';

/**
 * Seam 1 (spec.md, Testing Decisions): the shared module's parse boundary.
 * These cases cover what new input must satisfy regardless of Role; the
 * Conditional Requirement is proved in conditional-requirement.spec.ts.
 */
describe('createUserSchema', () => {
  const complete = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.org',
    phoneNumber: '+44 20 7946 0958',
    birthDate: '1815-12-10',
    role: 'viewer',
  };

  it('accepts a complete new User', () => {
    const result = createUserSchema.safeParse(complete);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(complete);
  });

  it('accepts a viewer without phoneNumber and birthDate', () => {
    const { phoneNumber, birthDate, ...withoutOptionals } = complete;
    void phoneNumber;
    void birthDate;

    const result = createUserSchema.safeParse(withoutOptionals);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(withoutOptionals);
  });

  it.each([
    ['firstName', ''],
    ['lastName', '   '],
    ['email', 'not-an-email'],
    ['phoneNumber', ''],
    ['birthDate', '31-31-9999'],
    ['role', 'owner'],
  ])('rejects %s = %j, naming that field', (field, value) => {
    const result = createUserSchema.safeParse({ ...complete, [field]: value });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path)).toEqual([[field]]);
  });

  it('names every field at fault, not only the first', () => {
    const result = createUserSchema.safeParse({
      ...complete,
      firstName: '',
      email: 'nope',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path)).toEqual([
      ['firstName'],
      ['email'],
    ]);
  });

  it('does not assign an id: the server does', () => {
    const result = createUserSchema.safeParse({ ...complete, id: 5 });

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('id');
  });
});
