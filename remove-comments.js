const fs = require('fs');
const path = require('path');

const root = __dirname;

const htmlFiles = [
  'dashboard-design.html',
  'admin.html',
  'auth.html',
  '404.html',
  'tools.html',
  'home.html',
  'pair-detail.html',
  'FAQ.html',
  'index.html',
  'pairs.html',
  'market.html',
  'dashboard.html',
  'settings.html',
  'watchlist.html',
  'performance.html',
];

const jsFiles = [
  'data-table.js',
  'pagination.js',
  'admin.js',
  'forex-api.js',
  'utils.js',
  'auth.js',
  'tools-page.js',
  'search-modal.js',
  'pairs.js',
];

const cssFiles = ['forexpulse-styles.css'];

function stripHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, '');
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripJsComments(source) {
  // Remove block comments
  let out = source.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove full-line // comments (but keep URLs and inline code)
  out = out.replace(/^[ \t]*\/\/.*$/gm, '');
  return out;
}

function processFile(file, kind) {
  const full = path.join(root, file);
  let text = fs.readFileSync(full, 'utf8');
  const original = text;
  if (kind === 'html') text = stripHtmlComments(text);
  else if (kind === 'css') text = stripCssComments(text);
  else if (kind === 'js') text = stripJsComments(text);
  if (text !== original) {
    fs.writeFileSync(full, text, 'utf8');
    console.log(`Stripped comments from ${file}`);
  } else {
    console.log(`No changes in ${file}`);
  }
}

htmlFiles.forEach((f) => processFile(f, 'html'));
cssFiles.forEach((f) => processFile(f, 'css'));
jsFiles.forEach((f) => processFile(f, 'js'));

console.log('Done stripping comments.');

