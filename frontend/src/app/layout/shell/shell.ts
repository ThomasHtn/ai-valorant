import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Application frame: the routed page, which brings its own header. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  /** Moves focus to the content without changing the URL, which carries the period. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
