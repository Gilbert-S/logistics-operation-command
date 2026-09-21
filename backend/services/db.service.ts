import "dotenv/config"
import { drizzle } from "drizzle-orm/node-sqlite"
import { authRelations } from "../database/schema/auth-schema.ts"


import Debug from "debug"
const debug = Debug("loc:service:db")
debug("loading database service module")


debug(`using database file: ${process.env["DB_FILE_NAME"] || "./database/data/db.sqlite"}`)

export const db = drizzle(
  process.env["DB_FILE_NAME"] || "./database/data/db.sqlite",
  { relations: { ...authRelations } },
)
export default db