import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, symlinkSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const baseline = '60423441a71dd4eead5a026a4cff93fbd4c6f4f3';
const runtime = mkdtempSync(join(tmpdir(), 'seer-baseline-'));
execFileSync('tar', ['-x', '-C', runtime], { input: execFileSync('git', ['archive', baseline], { cwd: root, maxBuffer: 128 * 1024 * 1024 }) });
symlinkSync(join(root, 'node_modules'), join(runtime, 'node_modules'), 'dir');
for (const folder of ['generated', 'dist']) {
  const source = join(root, 'packages/seer-pm-sdk', folder);
  if (existsSync(source)) symlinkSync(source, join(runtime, 'packages/seer-pm-sdk', folder), 'dir');
}
// Runtime-only adapters: read-only public data and no wallet connection. Original navigation and layout remain intact.
for (const file of ['web/server/index.js', 'web/server/design-preview.js', 'web/src/wagmi.ts', 'web/src/wagmiConfig.ts', 'web/src/lib/design-preview.ts', 'web/src/components/Layout/comparison-bridge.ts', 'scripts/comparison/vite-plugin.ts']) {
  mkdirSync(dirname(join(runtime, file)), { recursive: true });
  copyFileSync(join(root, file), join(runtime, file));
}
// The comparison uses identical frozen depth, with the original cumulative-share total.
for (const name of ['PoolTab.tsx', 'OrderBookPreview.tsx', 'order-book-preview.css', 'brazilOrderBookPreview.ts', 'cumulativeCostRows.ts']) {
  const file = 'web/src/components/Market/PoolDetails/' + name;
  let source = readFileSync(join(root, file), 'utf8');
  if (name === 'PoolTab.tsx') source = source.replace('outcome={outcome}', 'outcome={outcome} totalMode="shares"');
  writeFileSync(join(runtime, file), source);
}
const wallet = join(runtime, 'web/src/components/ConnectWallet/index.tsx');
copyFileSync(join(root, "web/src/components/ConnectWallet/index.tsx"), wallet);
const vite = join(runtime, 'web/vite.config.ts');
let config = readFileSync(vite, 'utf8');
config = 'import { comparisonBridge } from "../scripts/comparison/vite-plugin";\n' + config;
config = config.replace('plugins: [', 'plugins: [comparisonBridge(),');
config = config.replace('server: {', 'server: { hmr: { port: 24679 },');
config = config.replace('allow: [".."]', `allow: ["..", ${JSON.stringify(root)}]`);
writeFileSync(vite, config);
const children = [];
function start(cwd, command, port, functionsPort) {
  const child = spawn('npx', ['--yes', 'netlify-cli@27.10.2', 'dev', '--offline', '--framework', '#custom', '--command', command, '--target-port', String(port), '--port', String(functionsPort), '--functions', 'netlify/functions'], { cwd, env: { ...process.env, VITE_DESIGN_PREVIEW: 'true', VITE_WEBSITE_URL: `http://localhost:${port}`, X_REDIRECT_URI: `http://localhost:${port}`, PORT: String(port), NETLIFY_FUNCTIONS_ORIGIN: `http://localhost:${functionsPort}` }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', data => process.stdout.write(`[${port}] ${data}`));
  child.stderr.on('data', data => process.stderr.write(`[${port}] ${data}`));
  child.on('exit', code => { if (code) console.error(`Preview on ${port} exited (${code}).`); });
  children.push(child);
}
async function running(port) { try { return (await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; } }
if (!(await running(3000))) start(join(root, 'web'), 'node ./server', 3000, 8888);
start(join(runtime, 'web'), 'node ./server', 3001, 8889);
const server = createServer((req, res) => {
  const file = req.url?.split('?')[0] === '/comparison.js' ? 'comparison.js' : 'index.html';
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/html');
  res.setHeader('Cache-Control', 'no-store');
  res.end(readFileSync(join(here, file)));
});
server.listen(3002, '127.0.0.1', () => console.log(`Comparison: http://localhost:3002\nBaseline snapshot: ${runtime}`));
function stop() {
  for (const child of children) {
    try { if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM'); else child.kill('SIGTERM'); } catch {}
  }
  server.close();
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
