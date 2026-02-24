// This script is run before the package is packed.
// It modifies package.json in order to point to correct types definition file (.d.ts) in the published package.

const fs = require('fs');
const TMP_DIR = './.tmp';
const PACKAGE_JSON = './package.json';
const TMP_PACKAGE_JSON = './.tmp/package.json';
const COMPILED_TYPES = 'dist/index.d.ts';

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR);
}

fs.copyFileSync(PACKAGE_JSON, TMP_PACKAGE_JSON);

const pkg = fs.readFileSync(PACKAGE_JSON, 'utf8');
const parsed = JSON.parse(pkg);
parsed.types = COMPILED_TYPES;
if (parsed.exports && parsed.exports['.']) {
  parsed.exports['.'].types = COMPILED_TYPES;
}

fs.writeFileSync(PACKAGE_JSON, JSON.stringify(parsed, null, 2));
