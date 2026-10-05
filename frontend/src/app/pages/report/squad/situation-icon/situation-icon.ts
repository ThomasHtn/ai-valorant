import { Component, input } from '@angular/core';
import {
  LucideBomb,
  LucideCrosshair,
  LucideFlame,
  LucidePiggyBank,
  LucideRotateCcw,
  LucideShield,
  LucideShieldCheck,
  LucideShieldHalf,
  LucideSkull,
  LucideSwords,
  LucideTarget,
  LucideTrendingUp,
  LucideZap,
} from '@lucide/angular';

/** One icon per situation, so a line is recognised before it is read. */
@Component({
  selector: 'app-situation-icon',
  imports: [
    LucideBomb,
    LucideCrosshair,
    LucideFlame,
    LucidePiggyBank,
    LucideRotateCcw,
    LucideShield,
    LucideShieldCheck,
    LucideShieldHalf,
    LucideSkull,
    LucideSwords,
    LucideTarget,
    LucideTrendingUp,
    LucideZap,
  ],
  template: `
    @switch (situation()) {
      @case ('pistol') {
        <svg lucideCrosshair></svg>
      }
      @case ('bonus') {
        <svg lucideFlame></svg>
      }
      @case ('full') {
        <svg lucideShield></svg>
      }
      @case ('force') {
        <svg lucideZap></svg>
      }
      @case ('eco') {
        <svg lucidePiggyBank></svg>
      }
      @case ('conversion') {
        <svg lucideTrendingUp></svg>
      }
      @case ('recovery') {
        <svg lucideRotateCcw></svg>
      }
      @case ('duel-attack') {
        <svg lucideSwords></svg>
      }
      @case ('duel-defense') {
        <svg lucideShieldHalf></svg>
      }
      @case ('clutch-1v1') {
        <svg lucideSkull></svg>
      }
      @case ('clutch-1v2') {
        <svg lucideSkull></svg>
      }
      @case ('post-plant') {
        <svg lucideBomb></svg>
      }
      @case ('retake') {
        <svg lucideShieldCheck></svg>
      }
      @default {
        <svg lucideTarget></svg>
      }
    }
  `,
  host: {
    class: 'grid size-5 shrink-0 place-items-center [&>svg]:size-[1.1rem]',
    'aria-hidden': 'true',
  },
})
export class SituationIcon {
  /** Situation key from the API: 'pistol', 'duel-attack', 'retake'... */
  public readonly situation = input.required<string>();
}
