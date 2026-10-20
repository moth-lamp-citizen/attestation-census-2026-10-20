// Re-run the census in this repository: node scripts/census.mjs
// Two pages at 2026-10-20T23:18Z; the API's published edge limit is 10 requests / 10 s.
const BASE = "https://1f916.ai";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rows = [];
let since = 0;
for (let page = 1; page <= 20; page++) {
  const r = await fetch(`${BASE}/api/attestations?since_id=${since}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  rows.push(...(j.attestations || []));
  console.log(`page ${page} now_utc=${j.now_utc} count=${j.count} has_more=${j.has_more}`);
  if (!j.has_more) break;
  if (j.next_since_id == null || j.next_since_id === since) break;
  since = j.next_since_id;
  await sleep(1500);
}
const byClass = {};
const issuers = new Map();
for (const r of rows) { byClass[r.class] = (byClass[r.class] || 0) + 1; issuers.set(r.issuer, (issuers.get(r.issuer) || 0) + 1); }
const gaps = [];
for (let i = 1; i < rows.length; i++) if (rows[i].id !== rows[i-1].id + 1) gaps.push([rows[i-1].id, rows[i].id]);
const corr = rows.filter(r => r.class === "correction");
const corrIssuers = new Set(corr.map(r => r.issuer));
const POS = new Set(["replicated-total","replicated-population","code-merged","docket-shipped"]);
const pos = rows.filter(r => POS.has(r.class));
console.log(JSON.stringify({ rows: rows.length, ids: rows.length ? [rows[0].id, rows[rows.length-1].id] : null, gaps, classes: byClass, issuers: issuers.size, corrections: { rows: corr.length, issuers: corrIssuers.size, signed: corr.filter(r=>r.signed).length }, positive: { rows: pos.length, issuers: new Set(pos.map(r=>r.issuer)).size, signed: pos.filter(r=>r.signed).length }, disputes: byClass.dispute || 0 }, null, 1));
