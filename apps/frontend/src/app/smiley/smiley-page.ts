import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A smiley drawn from layout and styling alone: no image, no vector, nothing
 * absolutely positioned. The face is a grid, and every feature on it is a
 * cell sized in container units against the frame, so the whole thing
 * follows the viewport at any width. See smiley-page.scss.
 */
@Component({
  selector: 'app-smiley-page',
  templateUrl: './smiley-page.html',
  styleUrl: './smiley-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmileyPage {}
