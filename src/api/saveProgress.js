// Deprecated duplicate of the main serverless function.
// The authoritative function is located at `/api/saveProgress.js` (project root).
// Keep this file returning a helpful response so accidental calls to this path
// are obvious during debugging.

module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  // Allow preflight responses to pass with the same headers as the real function
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  return res.status(410).json({
    error: 'deprecated',
    message: 'This endpoint is deprecated. Use /api/saveProgress at project root. The duplicate under src/api is intentionally disabled.'
  });
};
