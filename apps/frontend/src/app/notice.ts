import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Notices } from './notices';

/**
 * Shows the current notice. The live regions are always in the document and
 * only their content changes, so assistive technology announces each notice
 * as it arrives rather than missing one that appears together with its
 * region; a success is read politely, an error assertively.
 */
@Component({
  selector: 'app-notice',
  imports: [NgTemplateOutlet],
  templateUrl: './notice.html',
  styleUrl: './notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticeOutlet {
  protected readonly notices = inject(Notices);
  protected readonly success = computed(() => this.ofTone('success'));
  protected readonly error = computed(() => this.ofTone('error'));

  private ofTone(tone: 'success' | 'error') {
    const notice = this.notices.current();
    return notice?.tone === tone ? notice : undefined;
  }
}
