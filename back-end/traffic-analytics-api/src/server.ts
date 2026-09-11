import app from "./app";
import { runMigrations } from './database/migrations';
import { runEurostatSync } from './modules/pipeline/pipeline.service';
import { startIngestionScheduler } from './modules/pipeline/pipeline.scheduler';

const PORT = process.env.PORT || 3000;
const DATABASE_RETRY_DELAY_MS = 2000;
const DATABASE_RETRY_ATTEMPTS = 10;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initializeDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= DATABASE_RETRY_ATTEMPTS; attempt++) {
    try {
      await runMigrations();
      return;
    } catch (err) {
      if (attempt === DATABASE_RETRY_ATTEMPTS) {
        throw err;
      }

      console.error(
        `Database initialization failed (attempt ${attempt}/${DATABASE_RETRY_ATTEMPTS}):`,
        err,
      );
      await wait(DATABASE_RETRY_DELAY_MS);
    }
  }
}

async function bootstrap(): Promise<void> {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const isIngestionWorker = await startIngestionScheduler();
  if (isIngestionWorker) {
    void runEurostatSync().catch((err) => {
      console.error('[pipeline] startup Eurostat sync failed:', err);
    });
  }
}

bootstrap().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
