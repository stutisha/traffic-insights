/**
 * Pipeline starts here
 */

import { fetchEurostatTrafficData } from './eurostat.client';
import {
  extractSourceUpdated,
  parseEurostatTrafficData,
} from './eurostat.parser';
import {
  finishIngestionRunError,
  finishIngestionRunSuccess,
  saveTrafficObservations,
  startIngestionRun,
} from './pipeline.repository';

const DATASET = 'road_tf_vehmov';

export interface SyncResult {
  ingestionRunId: number;
  rowsSeen: number;
  rowsWritten: number;
  inserted: number;
  updated: number;
  sourceUpdated: string | null;
  durationMs: number;
}

export async function runEurostatSync(): Promise<SyncResult> {
  const startedAt = Date.now();
  const ingestionRunId = await startIngestionRun(DATASET);
  console.log(`[pipeline] Eurostat sync started (run #${ingestionRunId})`);

  try {
    const raw = await fetchEurostatTrafficData();

    const observations = parseEurostatTrafficData(raw);
    const sourceUpdated = extractSourceUpdated(raw);
    console.log(
      `[pipeline] parsed ${observations.length} observation(s), ` +
        `source updated ${sourceUpdated ?? 'unknown'}`,
    );

    const { rowsSeen, rowsWritten, inserted, updated } =
      await saveTrafficObservations(observations, sourceUpdated);

    await finishIngestionRunSuccess(ingestionRunId, {
      sourceUpdated,
      rowsSeen,
      rowsWritten,
    });

    const durationMs = Date.now() - startedAt;
    console.log(
      `[pipeline] Eurostat sync finished (run #${ingestionRunId}): ` +
        `${inserted} inserted, ${updated} updated, ${rowsSeen} seen in ${durationMs}ms`,
    );

    return {
      ingestionRunId,
      rowsSeen,
      rowsWritten,
      inserted,
      updated,
      sourceUpdated,
      durationMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishIngestionRunError(ingestionRunId, message);
    console.error(
      `[pipeline] Eurostat sync failed (run #${ingestionRunId}): ${message}`,
    );
    throw err;
  }
}
