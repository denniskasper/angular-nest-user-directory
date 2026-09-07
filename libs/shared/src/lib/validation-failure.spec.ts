import { isValidationFailure, validationFailure } from './validation-failure';

describe('validationFailure', () => {
  it('keys the messages by the field at fault', () => {
    const body = validationFailure([
      { path: ['phoneNumber'], message: 'An admin must have a phone number' },
      { path: ['birthDate'], message: 'An admin must have a birth date' },
      { path: ['phoneNumber'], message: 'Enter a phone number' },
    ]);

    expect(body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      fields: {
        phoneNumber: ['An admin must have a phone number', 'Enter a phone number'],
        birthDate: ['An admin must have a birth date'],
      },
    });
  });

  it('carries an issue with no field in the message', () => {
    const body = validationFailure([
      { message: 'Invalid input: expected object, received string' },
      { path: [{ key: 'page' }], message: 'Enter a page' },
    ]);

    expect(body.message).toBe(
      'Invalid input: expected object, received string',
    );
    expect(body.fields).toEqual({ page: ['Enter a page'] });
  });

  it('recognises its own shape and nothing else', () => {
    expect(isValidationFailure(validationFailure([]))).toBe(true);
    expect(isValidationFailure({ statusCode: 400, message: ['x'] })).toBe(false);
    expect(isValidationFailure(null)).toBe(false);
  });
});
