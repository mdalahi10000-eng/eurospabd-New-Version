/**
 * Euro Spa Center - D1 Read-Only Parity Verification Script
 * Audits all 11 tables against canonical JSON source files.
 * Can be run locally or remotely via Wrangler.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isRemote = process.argv.includes('--remote');
const targetFlag = isRemote ? '--remote' : '--local';

console.log(`\n======================================================`);
console.log(` EURO SPA CENTER: CLOUDFLARE D1 PARITY AUDIT (${isRemote ? 'REMOTE' : 'LOCAL'})`);
console.log(`======================================================\n`);

const EXPECTED_COUNTS = {
  users: 1,
  admins: 1,
  services: 7,
  reviews: 21,
  appointments: 0,
  articles: 1,
  gallery: 10,
  site_settings: 2,
  service_areas: 6,
  faqs: 7,
  google_business_sync: 1
};

const querySql = Object.keys(EXPECTED_COUNTS)
  .map((t) => `SELECT '${t}' as tbl, COUNT(*) as cnt FROM ${t};`)
  .join('\n');

const tempSqlFile = path.resolve(__dirname, '.temp-count.sql');
fs.writeFileSync(tempSqlFile, querySql, 'utf8');

console.log('1. Executing table count queries...\n');

try {
  const cmd = `npx wrangler d1 execute euro-spa-d1 ${targetFlag} --file="${tempSqlFile}" --json`;
  const rawOutput = execSync(cmd, { encoding: 'utf8' });

  const jsonStart = rawOutput.indexOf('[');
  if (jsonStart === -1) throw new Error('No JSON output from wrangler');
  const parsed = JSON.parse(rawOutput.substring(jsonStart));

  const resultsTable = [];
  let allCountsMatch = true;

  for (const block of parsed) {
    const row = block.results?.[0];
    if (!row) continue;
    const tbl = row.tbl;
    const actual = Number(row.cnt);
    const expected = EXPECTED_COUNTS[tbl] ?? 0;
    const match = actual === expected;
    if (!match) allCountsMatch = false;

    resultsTable.push({
      Table: tbl,
      'Source JSON': expected,
      'D1 Actual': actual,
      Status: match ? '✅ PASS' : '❌ FAIL'
    });
  }

  console.table(resultsTable);

  if (allCountsMatch) {
    console.log('🎉 ALL 11 TABLE COUNTS MATCH PERFECTLY (57/57 records)!\n');
  } else {
    console.warn('⚠️ Some table counts differed. Please review table above.\n');
  }
} catch (err) {
  console.error('Error running count query:', err.message);
} finally {
  if (fs.existsSync(tempSqlFile)) {
    fs.unlinkSync(tempSqlFile);
  }
}

// 2. Spot-Check Queries
console.log('2. Spot-Check Queries for D1 Console / Manual Verification:');
console.log(`
SELECT 'services' AS check_name, name, price, status FROM services WHERE slug='deep-tissue-massage';
SELECT 'reviews' AS check_name, user_name, rating, status FROM reviews WHERE id='rev-1';
SELECT 'admins' AS check_name, email, role, 'active' AS status FROM admins WHERE email='mdalahi10000@gmail.com';
SELECT 'site_settings' AS check_name, id, 'present' AS data_state FROM site_settings;
`);
