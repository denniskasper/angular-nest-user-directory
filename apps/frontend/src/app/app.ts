import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { USER_ROLES } from '@pdr-cloud/shared';
import { NoticeOutlet } from './notice';

/**
 * The application shell: brand header, navigation, the content column every
 * routed view renders inside, and a footer. Layout is mobile-first — see
 * app.scss and styles/_breakpoints.scss.
 */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NoticeOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly roles = USER_ROLES;
}
