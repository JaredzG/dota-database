import { sql } from "drizzle-orm";
import { createPool, connectDB } from "../db";

const pool = await createPool();
const db = await connectDB(pool);

// Check that each table id sequence last value matches the count of rows in the corresponding table.
const rowCountsResult = await db.execute(
  sql`SELECT relname AS table_name, n_live_tup AS row_count FROM pg_stat_user_tables`
);
const lastSequenceValuesResult = await db.execute(
  sql`SELECT sequencename, last_value FROM pg_sequences`
);
for (const table of rowCountsResult.rows) {
  const { table_name: tableName, row_count: rowCount } = table;
  const { sequencename: sequenceName, last_value: lastValue } =
    lastSequenceValuesResult.rows.filter(
      (sequence) =>
        (sequence.sequencename as string).slice(0, -7) === (tableName as string)
    )[0];
  if (rowCount !== lastValue) {
    console.log(
      `Error: Unequal values -- ${tableName as string} (${
        rowCount as string
      }) | ${sequenceName as string} (${lastValue as string})`
    );
  } else {
    console.log(
      `Success: Equal values -- ${tableName as string} (${
        rowCount as string
      }) | ${sequenceName as string} (${lastValue as string})`
    );
  }
}

await pool.end();
