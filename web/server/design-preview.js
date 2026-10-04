// Preview can read only these public endpoints. Credentials are never forwarded.
const publicReads = new Set([
  '/.netlify/functions/markets-search', '/.netlify/functions/get-market',
  '/.netlify/functions/markets-charts', '/.netlify/functions/market-chart',
  '/.netlify/functions/get-pnl-leaderboard', '/.netlify/functions/get-airdrop-leaderboard',
  '/.netlify/functions/get-market-pnl-leaderboard', '/.netlify/functions/get-market-events',
  '/.netlify/functions/get-portfolio', '/.netlify/functions/get-portfolio-value',
  '/.netlify/functions/get-portfolio-pl', '/.netlify/functions/get-portfolio-identity',
  '/.netlify/functions/get-airdrop-data-by-user', '/.netlify/functions/get-transactions',
]);

export async function designPreviewProxy(req, res) {
  const publicCommentsRead = req.path === '/.netlify/functions/market-comments' && req.method === 'GET';
  const publicProfileRead = req.path === '/.netlify/functions/users' && req.method === 'GET' && (req.query.address || req.query.username);
  if ((!publicReads.has(req.path) && !publicProfileRead && !publicCommentsRead) || !['GET', 'POST'].includes(req.method)) {
    return res.status(403).json({ error: 'This endpoint is unavailable in the read-only design preview.' });
  }
  try {
    const response = await fetch(`https://app.seer.pm${req.originalUrl}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body ?? {}) : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    res.status(response.status).type(response.headers.get('Content-Type') || 'application/json').send(await response.text());
  } catch {
    res.status(502).json({ error: 'Public data is unavailable. Please retry.' });
  }
}
