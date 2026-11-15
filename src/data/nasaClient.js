import { NASA_API_KEY } from './config.js';

function lastNDaysRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

// Fetches real Coronal Mass Ejection (CME) events from NASA DONKI for the
// last `days` days. On failure (CORS, network, rate limit), falls back to a
// local curated dataset and marks it as such instead of passing it off as live.
export async function fetchCMEs(days = 30) {
  const { startDate, endDate } = lastNDaysRange(days);
  const url = `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`DONKI respondió ${response.status}`);
    const events = await response.json();
    return { source: 'NASA DONKI - Coronal Mass Ejection (CME)', live: true, events };
  } catch (err) {
    console.warn('Falling back to curated NASA DONKI CME dataset:', err.message);
    const curated = await (await fetch('./src/data/curated/sample-cme.json')).json();
    return {
      source: curated.source,
      live: false,
      retrievedAt: curated.retrievedAt,
      events: curated.events,
    };
  }
}
