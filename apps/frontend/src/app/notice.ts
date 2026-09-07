import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Notices } from './notices';

/**
 * Shows the current notice. The live region is always in the document and
 * only its content changes, so assistive technology announces each notice
 * as it arrives rather than missing one that appears together with the
 * region.
 */
@Component({
  selector: 'app-notice',
  templateUrl: './notice.html',
  styleUrl: './notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticeOutlet {
  protected readonly notices = inject(Notices);
}
