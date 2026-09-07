import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { USER_ROLES } from '@pdr-cloud/shared';
// The root manifest is the one place the version is stated (AGENTS.md,
// Versioning); the bundler keeps only the field that is read.
import { version } from '../../../../package.json';

/**
 * The application shell: brand header, navigation, the content column every
 * routed view renders inside, and a footer. Layout is mobile-first — see
 * app.scss and styles/_breakpoints.scss.
 */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly roles = USER_ROLES;
  protected readonly version = version;
}
