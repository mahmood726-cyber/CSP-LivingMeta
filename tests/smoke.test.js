#!/usr/bin/env node
/*
 * Minimal dependency-free smoke test for the CSP-LivingMeta dashboard.
 * Run with:  node tests/smoke.test.js
 * Asserts shipped-asset structural integrity (the failure modes that have
 * historically broken single-file HTML dashboards in this portfolio):
 *   - no UTF-8 BOM
 *   - balanced <script> open/close tags (no literal </script> orphan)
 *   - balanced <div> open/close tags
 *   - no unfilled placeholder tokens
 *   - no hardcoded local filesystem paths in the shipped HTML
 *   - core engine hooks are present
 */
'use strict';
const fs = require('fs');
const path = require('path');

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log('  ok - ' + name);
  } else {
    console.error('  FAIL - ' + name);
    failures++;
  }
}

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'CSP_REVIEW.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// BOM
check('CSP_REVIEW.html has no UTF-8 BOM', html.charCodeAt(0) !== 0xfeff);

// script balance
const scriptOpen = (html.match(/<script[\s>]/g) || []).length;
const scriptClose = (html.match(/<\/script>/g) || []).length;
check('script tags balanced (' + scriptOpen + '/' + scriptClose + ')', scriptOpen === scriptClose);

// div balance: count only the static DOM. <div ...> substrings inside JS
// template literals (this app builds a lot of markup dynamically) inflate a
// naive count, so strip <script>...</script> blocks first.
const staticHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '');
const divOpen = (staticHtml.match(/<div[\s>]/g) || []).length;
const divClose = (staticHtml.match(/<\/div>/g) || []).length;
check('static div tags balanced (' + divOpen + '/' + divClose + ')', divOpen === divClose);

// placeholders (note: ${{...}} is a valid JS template expression, so check REPLACE_ME etc.)
check('no REPLACE_ME token', html.indexOf('REPLACE_ME') === -1);
check('no __PLACEHOLDER__ token', html.indexOf('__PLACEHOLDER__') === -1);

// no hardcoded local paths in shipped HTML
check('no C:\\Users path in HTML', html.indexOf('C:\\Users') === -1);
check('no /home/ path in HTML', html.indexOf('/home/') === -1);

// engine hooks present
check('computeCore present', html.indexOf('computeCore') !== -1);
check('RapidMeta present', html.indexOf('RapidMeta') !== -1);
check('AnalysisEngine present', html.indexOf('AnalysisEngine') !== -1);

// index.html redirect intact
const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check('index.html redirects to CSP_REVIEW.html', idx.indexOf('CSP_REVIEW.html') !== -1);

if (failures) {
  console.error('\n' + failures + ' check(s) FAILED');
  process.exit(1);
}
console.log('\nall smoke checks passed');
