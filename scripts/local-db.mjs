import EmbeddedPostgres from "embedded-postgres";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const databaseDir = resolve(".local/postgres");
mkdirSync(resolve(".local"), { recursive: true });
const postgres = new EmbeddedPostgres({
  databaseDir,
  user: "azul",
  password: "azul_local_only",
  port: 55432,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: console.error,
});
if (!existsSync(resolve(databaseDir, "PG_VERSION")))
  await postgres.initialise();
await postgres.start();
const client = postgres.getPgClient();
await client.connect();
for (const database of ["azul", "azul_test"]) {
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname=$1",
    [database],
  );
  if (!result.rowCount) await postgres.createDatabase(database);
}
await client.end();
console.log(
  "PostgreSQL 17 listo en 127.0.0.1:55432. Bases: azul y azul_test. Mantén esta terminal abierta.",
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await postgres.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 60000);
