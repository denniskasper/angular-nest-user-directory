# User Directory

A system that stores, lists, searches and creates User records. Which fields a User must provide depends on their Role.

## Language

**User**:
A person recorded in the system, identified by a numeric id.
_Avoid_: account, customer, person, profile

**Role**:
A User's classification — `admin`, `editor` or `viewer` — that determines which of their fields are required. It confers no permissions: nothing in this system grants or restricts access based on Role.
_Avoid_: permission, access level, user type

**Conditional Requirement**:
A rule making a field required based on a User's Role. An admin requires phoneNumber and birthDate; an editor requires phoneNumber; a viewer requires neither.
_Avoid_: dynamic validation, role validation

**Full Name**:
A User's firstName and lastName joined by a single space. The unit by which Users are searched.
_Avoid_: display name, name

**phoneNumber**:
A User's contact telephone number.
_Avoid_: phone, tel, mobile

**birthDate**:
A User's date of birth.
_Avoid_: dob, birthday, dateOfBirth

## Data provenance

**Seed Data**:
The 100 Users supplied with the challenge, forming the system's initial content.
_Avoid_: fixtures, sample data, mock data

**Legacy Record**:
A User that entered the system as Seed Data rather than through creation, and may therefore lack fields that a Conditional Requirement would demand today.
_Avoid_: dirty record, invalid user, bad data

**Normalization**:
The one-time correction applied to Seed Data on first load: repairing misspelled field names and mistyped ids, and clearing values that cannot be salvaged.
_Avoid_: cleaning, sanitization, migration
