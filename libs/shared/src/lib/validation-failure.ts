/**
 * The body the API answers a validation failure with (spec.md, API
 * contract): the messages keyed by the field at fault, so a client can
 * attach each to the right control without parsing prose. An issue that
 * names no field is carried in `message` instead.
 */
export interface ValidationFailure {
  statusCode: 400;
  error: 'Bad Request';
  message: string;
  fields: Record<string, string[]>;
}

/** An issue as any Standard Schema reports it. */
interface Issue {
  message: string;
  path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
}

export function validationFailure(issues: readonly Issue[]): ValidationFailure {
  const fields: Record<string, string[]> = {};
  const general: string[] = [];
  for (const issue of issues) {
    const head = issue.path?.[0];
    if (head === undefined) {
      general.push(issue.message);
      continue;
    }
    const field = String(typeof head === 'object' ? head.key : head);
    (fields[field] ??= []).push(issue.message);
  }
  return {
    statusCode: 400,
    error: 'Bad Request',
    message: general.length ? general.join('; ') : 'Validation failed',
    fields,
  };
}

export function isValidationFailure(body: unknown): body is ValidationFailure {
  if (typeof body !== 'object' || body === null) return false;
  const { statusCode, fields } = body as Partial<ValidationFailure>;
  return (
    statusCode === 400 && typeof fields === 'object' && fields !== null
  );
}
