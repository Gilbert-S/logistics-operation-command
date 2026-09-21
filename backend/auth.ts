/**
 * this is the config entry point for the better auth cli.
 * by default, the CLI will search for an auth.ts file in ./, ./utils, ./lib,
 * or any of these directories under the src directory.
 *
 * the actual auth service is implemented in backend/services/auth.service.ts,
 * and this file is just a re-export of that service for convenience.
 *
 *
 * run this to see if the config is ok:
 * `npx auth@latest info`
 */
export * from "./services/auth.service.ts"
