# NestJS 12, despite being outside Nx's supported peer range

`@nx/nest` 23.2.0 declares a peer dependency of `@nestjs/core >=10 <12` and scaffolds NestJS 11, because NestJS 12 was released days before it. We use NestJS 12 anyway, with peer overrides.

## Considered Options

NestJS 12 ships a first-party Standard Schema validation pipe that consumes our shared validation schema directly, removing a hand-rolled validation pipe entirely, and generates OpenAPI from that same schema with no converter. NestJS 11 would stay inside Nx's supported range at the cost of maintaining both by hand.

## Consequences

`package.json` carries peer overrides that a future reader would otherwise try to remove. `@nestjs/common` 12 is ESM-only and must survive the webpack build that Nx hardcodes for Nest applications. If that proves unworkable, the documented fallback is NestJS 11 with a hand-rolled validation pipe.
