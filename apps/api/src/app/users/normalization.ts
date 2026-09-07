import { storedUserSchema, User } from '@pdr-cloud/shared';

/** Misspelled field names found in the Seed Data, and what they meant. */
const FIELD_ALIASES: Readonly<Record<string, keyof User>> = {
  fistName: 'firstName',
  birthDtae: 'birthDate',
};

/** Fields a stored User may lack (ADR-0001), so an unusable value can be cleared rather than the record dropped. */
const CLEARABLE_FIELDS: ReadonlySet<string> = new Set<keyof User>(['email', 'phoneNumber', 'birthDate']);

/** What Normalization did to one Legacy Record. */
export interface RecordRepair {
  id: unknown;
  /** Misspelled field names corrected, as `from → to`. */
  renamed: string[];
  /** Fields whose value was held as the wrong type and converted. */
  retyped: string[];
  /** Fields whose value could not be salvaged, with the value that was cleared. */
  cleared: { field: string; value: unknown }[];
}

export interface NormalizationReport {
  total: number;
  repaired: RecordRepair[];
}

export interface NormalizationResult {
  users: User[];
  report: NormalizationReport;
}

/**
 * The one-time correction applied to Seed Data before it reaches the store
 * (ADR-0001): repair what is unambiguous, clear what cannot be salvaged,
 * never drop a record. A record that still cannot satisfy the stored schema
 * after that is a defect in the Seed Data or in this function, and is
 * reported by throwing rather than by quietly losing a User.
 */
export function normalizeSeedData(records: readonly unknown[]): NormalizationResult {
  const users: User[] = [];
  const repaired: RecordRepair[] = [];

  for (const record of records) {
    const { user, repair } = normalizeRecord(record);
    users.push(user);
    if (repair.renamed.length + repair.retyped.length + repair.cleared.length > 0) {
      repaired.push(repair);
    }
  }

  return { users, report: { total: records.length, repaired } };
}

function normalizeRecord(record: unknown): { user: User; repair: RecordRepair } {
  const fields = { ...(record as Record<string, unknown>) };
  const repair: RecordRepair = { id: fields['id'], renamed: [], retyped: [], cleared: [] };

  for (const [alias, canonical] of Object.entries(FIELD_ALIASES)) {
    if (alias in fields) {
      fields[canonical] = fields[alias];
      delete fields[alias];
      repair.renamed.push(`${alias} → ${canonical}`);
    }
  }

  if (typeof fields['id'] === 'string' && /^\d+$/.test(fields['id'])) {
    fields['id'] = Number(fields['id']);
    repair.retyped.push('id');
  }

  const firstPass = storedUserSchema.safeParse(fields);
  if (firstPass.success) return { user: firstPass.data, repair };

  for (const issue of firstPass.error.issues) {
    const field = String(issue.path[0]);
    if (CLEARABLE_FIELDS.has(field) && field in fields) {
      repair.cleared.push({ field, value: fields[field] });
      delete fields[field];
    }
  }

  const secondPass = storedUserSchema.safeParse(fields);
  if (!secondPass.success) {
    const problems = secondPass.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Seed Data record with id ${JSON.stringify(repair.id)} cannot be normalized (${problems})`);
  }
  return { user: secondPass.data, repair };
}
