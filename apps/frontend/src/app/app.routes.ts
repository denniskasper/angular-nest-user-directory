import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./users/user-list-page').then((m) => m.UserListPage),
  },
];
