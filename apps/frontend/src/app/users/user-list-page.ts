import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { fullName, UserPage } from '@pdr-cloud/shared';
import { debounceTime, Subject } from 'rxjs';

/**
 * The directory: a page of Users, searchable by Full Name, readable at any
 * width. Phones get a stacked entry per User; from tablet width upward the
 * same data is a Material table. Both presentations are rendered from one
 * resource and the switch is a media query, so the breakpoint stays defined
 * once in SCSS.
 *
 * The page being browsed and the search term live in the URL query, bound
 * to inputs by the router, and the resource derives from them — so paging
 * and searching are navigations, the list re-fetches declaratively, and a
 * URL reproduces exactly what was on screen. The server does the narrowing
 * and the cutting; the browser never holds more than one page.
 *
 * Each User's name is a link to their detail, stretched over the whole
 * entry or row so any of it can be selected; the detail route renders in
 * the outlet below, over this page rather than instead of it.
 */
@Component({
  selector: 'app-user-list-page',
  imports: [MatTableModule, RouterLink, RouterOutlet],
  templateUrl: './user-list-page.html',
  styleUrl: './user-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPage {
  /** Query parameters, bound by the router. Absent means the first page, and no search. */
  readonly page = input<string>();
  readonly search = input<string>();

  protected readonly pageNumber = computed(() => {
    const n = Number(this.page());
    return Number.isInteger(n) && n >= 1 ? n : 1;
  });
  protected readonly term = computed(() => this.search()?.trim() ?? '');

  protected readonly users = httpResource<UserPage>(() => ({
    url: '/api/users',
    params: {
      page: this.pageNumber(),
      ...(this.term() ? { search: this.term() } : {}),
    },
  }));

  /**
   * The page on screen: the latest one received, held while the next loads
   * so moving between pages dims the list rather than blanking it.
   */
  protected readonly shown = linkedSignal<
    UserPage | undefined,
    UserPage | undefined
  >({
    source: () => (this.users.hasValue() ? this.users.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });
  /**
   * The search the shown page answers, held with it: the count is labelled
   * for the page on screen, never for a term whose page has not arrived.
   */
  protected readonly shownTerm = linkedSignal<string | undefined, string>({
    source: () => (this.users.hasValue() ? this.term() : undefined),
    computation: (next, previous) => next ?? previous?.value ?? '',
  });
  protected readonly pageCount = computed(() => {
    const shown = this.shown();
    return shown ? Math.max(1, Math.ceil(shown.total / shown.pageSize)) : 1;
  });
  /** The positions, counted from 1, of the first and last User on screen. */
  protected readonly range = computed(() => {
    const shown = this.shown();
    if (!shown || shown.items.length === 0) return undefined;
    const from = (shown.page - 1) * shown.pageSize + 1;
    return { from, to: from + shown.items.length - 1 };
  });

  protected readonly columns = ['id', 'name', 'email', 'role'];
  protected readonly fullName = fullName;

  private readonly router = inject(Router);
  private readonly searchField =
    viewChild.required<ElementRef<HTMLInputElement>>('searchField');
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly typed = new Subject<string>();
  /** Keystrokes have landed in the field that no search has yet been made of. */
  private typing = false;

  constructor() {
    // Typing becomes a search once it settles. Each search replaces the URL
    // rather than pushing one, so typing does not stack history entries; and
    // a new search starts again from the first page.
    this.typed
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe((term) => {
        this.typing = false;
        this.router.navigate([], {
          queryParams: { search: term || null, page: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

    // The URL is the source of the search term — on first load, and when
    // Back or Forward changes it — except while typing is still settling:
    // then a search landing in the URL must not overwrite what has been
    // typed since it was made.
    effect(() => {
      const term = this.search() ?? '';
      if (!this.typing) this.searchField().nativeElement.value = term;
    });
  }

  protected onTyped(term: string): void {
    this.typing = true;
    this.typed.next(term);
  }

  /** Moves to `page`; the list is brought back into view if browsing had scrolled past its top. */
  protected goTo(page: number): void {
    this.router.navigate([], {
      queryParams: { page: page === 1 ? null : page },
      queryParamsHandling: 'merge',
    });
    const list = this.list()?.nativeElement;
    if (list && list.getBoundingClientRect().top < 0) {
      list.scrollIntoView({ block: 'start' });
    }
  }
}
