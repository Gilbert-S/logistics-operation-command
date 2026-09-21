import { Component, inject, signal } from "@angular/core"
import { ActivatedRoute, Router, RouterLink } from "@angular/router"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmCardImports } from "@spartan-ng/helm/card"

@Component({
  selector: "app-error",
  imports: [HlmCardImports, HlmButtonImports, RouterLink],
  template: `

    <hlm-card class="w-full max-w-md rounded-sm bg-background/70 shadow-lg shadow-black">
      <hlm-card-header>
        @if (error())
        {
          <h3 hlmCardTitle class="text-xl text-red-300 uppercase">{{ error() }}</h3>
        }
        @else
        {
          <h3 hlmCardTitle class="text-xl text-red-300">ERROR</h3>
        }
      </hlm-card-header>

      <div hlmCardContent class="min-h-23 border-t py-(--card-spacing) text-base/relaxed">
        @if (errorDescription())
        {
          <p>{{ errorDescription() }}</p>
        }
        @else
        {
          <p class="self-center text-muted-foreground">No error description.</p>
        }
      </div>

      <hlm-card-footer class="justify-center border-t-0 bg-transparent">
        <a hlmBtn variant="outline" class="rounded-xs px-10" [routerLink]="['/']">BACK</a>
      </hlm-card-footer>
    </hlm-card>
  `,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;

      background-color: #333;
      background-image: url("/images/WarMachinePromo_NoLogo.jpg");
      background-size: cover;
      background-position: center;
      background-blend-mode: overlay;
    }
  `,
})
export class ErrorPage
{
  private activatedRoute = inject(ActivatedRoute)
  private router = inject(Router)

  readonly error = signal<string | null>(null)
  readonly errorDescription = signal<string | null>(null)

  constructor()
  {
    this.error.set(this.activatedRoute.snapshot.queryParamMap.get("error"))
    this.errorDescription.set(this.activatedRoute.snapshot.queryParamMap.get("error_description"))

    this.router.navigate([], { queryParams: {}, replaceUrl: true, relativeTo: this.activatedRoute })
      .catch((err) => console.error(err))
  }

}
