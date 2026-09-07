import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { USER_ROLES } from '@pdr-cloud/shared';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly roles = USER_ROLES;
}
