import "dotenv/config"
import { defineConfig } from "drizzle-kit"



export default defineConfig({
  out: "./database/drizzle",
  schema: ["./database/schema/schema.ts", "./database/schema/auth-schema.ts"],
  dialect: "sqlite",
  dbCredentials: { url: process.env["DB_FILE_NAME"] || "./database/data/db.sqlite" },
})