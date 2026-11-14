import { NASA_API_KEY } from './config.js';

function lastNDaysRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

// Trae eyecciones de masa coronal (CME) reales de NASA DONKI para los
// últimos `days` días. Si falla (CORS, red, rate limit), cae a un dataset
// curado local y lo marca como tal para no presentarlo como si fuera en vivo.
export async function fetchCMEs(days = 30) {
  const { startDate, endDate } = lastNDaysRange(days);
  const url = `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`DONKI respondió ${response.status}`);
    const events = await response.json();
    return { source: 'NASA DONKI - Coronal Mass Ejection (CME)', live: true, events };
  } catch (err) {
    console.warn('Fallback a dataset curado de NASA DONKI CME:', err.message);
    const curated = await (await fetch('./src/data/curated/sample-cme.json')).json();
    return {
      source: curated.source,
      live: false,
      retrievedAt: curated.retrievedAt,
      events: curated.events,
    };
  }
}
