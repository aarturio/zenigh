import knex from "knex";

const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 2000,
  },
});

// Handle connection errors
db.on("query-error", (error) => {
  console.error("Database query error:", error);
});

export default db;
