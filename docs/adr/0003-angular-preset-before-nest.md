# Generate the Angular application first, then add Nest

`create-nx-workspace` defaults to the TypeScript project-references ("solution") layout, but `@nx/angular` explicitly refuses it — its generators call `assertNotUsingTsSolutionSetup` and throw. The workspace is therefore created from the `angular-monorepo` preset, with the Nest application and shared library added afterwards.

## Consequences

The workspace uses the classic layout rather than Nx's current default, which looks dated at a glance and invites a future reader to "modernise" it. An `NX_IGNORE_UNSUPPORTED_TS_SETUP` escape hatch exists, but it forces a configuration Angular explicitly does not support. The layout is fixed at workspace creation, so changing it later means regenerating the workspace.
