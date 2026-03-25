// MS Math Lab — standalone server for browsing PhET math simulations.
// This is the legacy lab-only server. The tutor/server.js includes lab + tutor.

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const LAB_ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',       '.css': 'text/css',
  '.js':   'text/javascript',  '.mjs': 'text/javascript',
  '.ts':   'text/javascript',
  '.json': 'application/json', '.png': 'image/png',
  '.jpg':  'image/jpeg',       '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',        '.svg': 'image/svg+xml',
  '.ico':  'image/x-icon',     '.webp': 'image/webp',
  '.mp3':  'audio/mpeg',       '.wav': 'audio/wav',
  '.ogg':  'audio/ogg',        '.woff': 'font/woff',
  '.woff2':'font/woff2',       '.ttf':  'font/ttf',
};

const categoryDirs = {
  'numbers': [
    'arithmetic','build-a-fraction','counting-common','fractions-common',
    'fractions-equality','fractions-intro','fractions-mixed-numbers',
    'make-a-ten','number-compare','number-line-common','number-line-distance',
    'number-line-integers','number-line-operations','number-pairs',
    'number-play','number-suite-common',
  ],
  'algebra': [
    'calculus-grapher','equality-explorer','equality-explorer-basics',
    'equality-explorer-two-variables','expression-exchange',
    'function-builder','function-builder-basics','graphing-lines',
    'graphing-quadratics','graphing-slope-intercept',
  ],
  'geometry': [
    'area-builder','area-model-algebra','area-model-common',
    'area-model-decimals','area-model-introduction','area-model-multiplication',
    'quadrilateral','trig-tour','vector-addition','vector-addition-equations',
  ],
  'ratios': [
    'proportion-playground','ratio-and-proportion','unit-rates',
  ],
  'data-probability': [
    'center-and-variability','estimation','least-squares-regression',
    'mean-share-and-balance','plinko-probability',
  ],
  'framework': [
    'alpenglow','aqua','assert','axon','babel','bamboo','binder','blast','brand',
    'chains','chipper','community','decaf','description-demo','dot','example-sim',
    'fenster','griddle','joist','kite','mobius','perennial','perennial-alias',
    'phet-core','phet-info','phet-lib','phetcommon','phetmarks','qa','quake',
    'query-string-machine','rosetta','scenery','scenery-lab-demo','scenery-phet',
    'nitroglycerin','sherpa','simula-rasa','skiffle','sun','tambo','tandem','tangible','tappi',
    'tasks','twixt','utterance-queue','vegas','vibe','wilder',
    'inverse-square-law-common',
  ],
};

const slugToCategory = {};
for (const [cat, slugs] of Object.entries(categoryDirs)) {
  for (const s of slugs) slugToCategory[s] = cat;
}

app.use((req, res, next) => {
  const segments = req.path.split('/').filter(Boolean);
  if (segments.length >= 1) {
    const first = segments[0];
    const cat = slugToCategory[first];
    if (cat) {
      const rest = segments.slice(1).join('/');
      const filePath = path.join(LAB_ROOT, cat, first, rest);
      return serveLabFile(filePath, res, next);
    }
  }
  next();
});

function serveLabFile(filePath, res, next) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(LAB_ROOT)) { res.status(403).send('Forbidden'); return; }
  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) { res.status(404).send('Not found'); return; }
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.set({ 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(resolved).pipe(res);
  });
}

const PORT = process.env.PORT || 3901;
app.listen(PORT, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────────┐');
  console.log('  │                                                  │');
  console.log('  │   📐  MS Math Lab                               │');
  console.log('  │                                                  │');
  console.log(`  │   ➜  http://localhost:${PORT}                       │`);
  console.log('  │                                                  │');
  console.log('  └──────────────────────────────────────────────────┘');
  console.log('');
});
