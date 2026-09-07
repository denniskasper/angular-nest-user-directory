import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  // Declared before the list, whose detail child would otherwise read
  // "new" as a User's id.
  {
    path: 'users/new',
    loadComponent: () =>
      import('./users/create-user-page').then((m) => m.CreateUserPage),
  },
  {
    path: 'smiley',
    loadComponent: () =>
      import('./smiley/smiley-page').then((m) => m.SmileyPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./users/user-list-page').then((m) => m.UserListPage),
    // The detail is a child of the list, not a sibling, so opening a User
    // leaves the list mounted underneath with its browsing position intact.
    children: [
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./users/user-detail').then((m) => m.UserDetail),
      },
    ],
  },
];
