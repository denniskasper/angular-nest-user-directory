import { storedUserSchema } from './user';

/**
 * Seam 1 (spec.md, Testing Decisions): the shared module's parse boundary.
 * These cases cover the read path — what may legitimately already exist in
 * the store, per ADR-0001.
 */
describe('storedUserSchema', () => {
  const complete = {
    id: 7,
    firstName: 'Sarah',
    lastName: 'Russell',
    email: 'xmills@david.org',
    phoneNumber: '(986)712-7166x03230',
    birthDate: '2002-03-18',
    role: 'admin',
  };

  it('accepts a complete stored User', () => {
    const result = storedUserSchema.safeParse(complete);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(complete);
  });

  it('accepts a Legacy Record lacking email, phoneNumber and birthDate', () => {
    const legacy = {
      id: 25,
      firstName: 'Amanda',
      lastName: 'Miller',
      role: 'editor',
    };

    const result = storedUserSchema.safeParse(legacy);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(legacy);
  });

  it('rejects a Role outside admin, editor and viewer', () => {
    const result = storedUserSchema.safeParse({ ...complete, role: 'owner' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path)).toEqual([['role']]);
  });

  it('rejects an id held as text', () => {
    const result = storedUserSchema.safeParse({ ...complete, id: '7' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path)).toEqual([['id']]);
  });
});
