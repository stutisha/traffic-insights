import { runEurostatSync } from "./pipeline.service";
import pool from "../../database/connection";

async function testPipeline() {
  try {
    console.log("Starting Eurostat pipeline test...");

    const result = await runEurostatSync();

    console.log("Pipeline completed successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("Pipeline failed:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

testPipeline();