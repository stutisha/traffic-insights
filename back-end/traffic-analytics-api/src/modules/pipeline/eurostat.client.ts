
 export const EUROSTAT_TRAFFIC_ENDPOINT =
 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/road_tf_vehmov?format=JSON&lang=EN';

export async function fetchEurostatTrafficData(): Promise<unknown> {
 let response: Response;

 try {
   response = await fetch(EUROSTAT_TRAFFIC_ENDPOINT, {
     method: 'GET',
     headers: { Accept: 'application/json' },
   });
 } catch (cause) {
   throw new Error(
     `Failed to reach Eurostat at ${EUROSTAT_TRAFFIC_ENDPOINT}: ${
       cause instanceof Error ? cause.message : String(cause)
     }`,
   );
 }

 if (!response.ok) {
   throw new Error(
     `Eurostat request failed with HTTP ${response.status} ${response.statusText} for ${EUROSTAT_TRAFFIC_ENDPOINT}`,
   );
 }

 try {
   return await response.json();
 } catch (cause) {
   throw new Error(
     `Failed to parse Eurostat JSON response: ${
       cause instanceof Error ? cause.message : String(cause)
     }`,
   );
 }
}
