# Strict validation for new Users, tolerant validation for stored Users

The Seed Data contains Legacy Records that violate today's Conditional Requirements — misspelled field names, malformed emails, an impossible birth date, ids stored as strings. We validate a User strictly when it is created, but read stored Users tolerantly, rather than retroactively rejecting Legacy Records.

## Considered Options

Rejecting Legacy Records under the same strict rules would drop 13 of 100 Users from the directory — deleting a person over a malformed email, and leaving a reviewer to wonder why the list is short. Normalization repairs what is unambiguously repairable (misspelled keys, string ids) and clears only values that cannot be salvaged, so all 100 Users remain visible.

## Consequences

Two schemas describe the same entity: one for what we require of new input, one for what may legitimately already exist. A field can therefore be required on creation yet absent from a stored User, and consumers must treat those fields as optional when reading.
