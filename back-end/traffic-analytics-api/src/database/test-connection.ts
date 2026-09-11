import pool from "./connection";

async function testConnection() {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time, current_database() AS database"
    );

    console.log("PostgreSQL connected successfully!");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("PostgreSQL connection failed:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

testConnection();