import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A smiley drawn from layout and styling alone: no image, no vector, nothing
 * absolutely positioned. The face is a grid, and every feature on it is a
 * cell sized in container units against the frame, so the whole thing
 * follows the viewport at any width; the dimples are the mouth's two
 * pseudo-elements. See smiley.component.scss.
 *
 * Standalone, on its own route (`/smiley`), and named as the challenge
 * brief names it.
 */
@Component({
  selector: 'app-smiley',
  templateUrl: './smiley.component.html',
  styleUrl: './smiley.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmileyComponent {}
