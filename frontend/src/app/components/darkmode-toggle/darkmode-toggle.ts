import { Component, effect, signal } from "@angular/core"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucideMoon, lucideSun } from "@ng-icons/lucide"
import { BrnTooltipImports } from "@spartan-ng/brain/tooltip"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmToggleImports } from "@spartan-ng/helm/toggle"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"

@Component({

  imports: [
    BrnTooltipImports,
    HlmButtonImports,
    HlmIconImports,
    HlmToggleImports,
    HlmTooltipImports,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideSun,
      lucideMoon,
    }),
  ],
  selector: "app-darkmode-toggle",
  styles: ``,
  template: `
        <button hlmToggle variant="outline"
          class=""
          hlmTooltip="toggle between light and dark mode"
          [showDelay]="5000"
          [(state)]="darkMode"
        >
          @if(darkMode() === 'on') {
            <ng-icon hlm name="lucideSun" class="[&_svg]:stroke-neutral-100"/>
          } @else {
            <ng-icon hlm name="lucideMoon" class="[&_svg]:stroke-neutral-500"/>
          }
        </button>
  `,
})
export class DarkmodeToggle
{
  readonly darkMode = signal<"on" | "off">("on")

  constructor()
  {
    const prefersDarkColorScheme =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches

    this.darkMode.set(prefersDarkColorScheme ? "on" : "off")

    effect(() =>
    {
      if (this.darkMode() === "on")
        document.documentElement.classList.add("dark")
      else
        document.documentElement.classList.remove("dark")
    })
  }

}
