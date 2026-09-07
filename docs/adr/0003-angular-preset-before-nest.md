# Generate the Angular application first, then add Nest

`create-nx-workspace` defaults to the TypeScript project-references ("solution") layout, but `@nx/angular` explicitly refuses it — its generators call `assertNotUsingTsSolutionSetup` and throw. The workspace is therefore created from the `angular-monorepo` preset, with the Nest application and shared library added afterwards.

## Consequences

The workspace uses the classic layout rather than Nx's current default, which looks dated at a glance and invites a future reader to "modernise" it. An `NX_IGNORE_UNSUPPORTED_TS_SETUP` escape hatch exists, but it forces a configuration Angular explicitly does not support. The layout is fixed at workspace creation, so changing it later means regenerating the workspace.

## Notes from creation

Two tooling quirks in Nx 23.2.0 affect anyone regenerating the workspace:

- `create-nx-workspace` silently swaps the `angular-monorepo` preset for the
  `nrwl/angular-template` GitHub template (a sample shop with SSR and zone.js)
  when it detects an AI agent through environment variables such as
  `CLAUDECODE`. Unset them to get the real preset.
- `@nx/js` ships an empty `files/readme` template directory, so
  `@nx/js:library` throws even with `--minimal`. Dropping any
  `README.md__tmpl__` into `node_modules/@nx/js/dist/src/generators/library/files/readme/`
  lets the generator run.
