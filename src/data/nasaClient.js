const DONKI_URL = 'https://api.nasa.gov/DONKI/notifications?type=all&api_key=DEMO_KEY';

// Intenta traer datos reales de NASA DONKI; si falla (CORS, rate limit, sin red),
// cae a un dataset curado local y lo marca como tal para no engañar al jugador.
export async function fetchSpaceWeather() {
  try {
    const response = await fetch(DONKI_URL);
    if (!response.ok) throw new Error(`DONKI respondió ${response.status}`);
    const data = await response.json();
    return { source: 'NASA DONKI (en vivo)', live: true, data };
  } catch (err) {
    console.warn('Fallback a dataset curado de NASA DONKI:', err.message);
    const curated = await (await fetch('./src/data/curated/sample-donki.json')).json();
    return { source: curated.source, live: false, retrievedAt: curated.retrievedAt, data: curated.events };
  }
}
