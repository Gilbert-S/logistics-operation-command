import { Routes } from "@angular/router"
import { AppRoot } from "./components/app-root/app-root"
import { ErrorPage } from "./components/error-page/error-page"

export const routes: Routes = [
  { component: AppRoot, path: "" },
  { component: ErrorPage, path: "error" },
]
