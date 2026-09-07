import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { fullName, User } from '@pdr-cloud/shared';

/**
 * The directory: every User, readable at any width. Phones get a stacked
 * entry per User; from tablet width upward the same data is a Material
 * table. Both presentations are rendered from one resource and the switch
 * is a media query, so the breakpoint stays defined once in SCSS.
 */
@Component({
  selector: 'app-user-list-page',
  imports: [MatTableModule],
  templateUrl: './user-list-page.html',
  styleUrl: './user-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPage {
  protected readonly users = httpResource<User[]>(() => '/api/users');
  protected readonly columns = ['id', 'name', 'email', 'role'];
  protected readonly fullName = fullName;
}
