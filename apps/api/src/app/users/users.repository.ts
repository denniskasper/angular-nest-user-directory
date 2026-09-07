import { User } from '@pdr-cloud/shared';

/**
 * The persistence boundary for Users. Nothing above this interface touches
 * storage; it is the seam behind which the file store and its write queue
 * will sit (spec.md, Persistence).
 */
export abstract class UsersRepository {
  abstract findAll(): Promise<readonly User[]>;
  /** The User holding `id`, or undefined when no User does. */
  abstract findById(id: number): Promise<User | undefined>;
}
