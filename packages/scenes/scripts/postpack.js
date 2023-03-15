const fs = require('fs');
const TMP_DIR = './.tmp';
const PACKAGE_JSON = './package.json';
const TMP_PACKAGE_JSON = './.tmp/package.json';

if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(PACKAGE_JSON);
  fs.copyFileSync(TMP_PACKAGE_JSON, PACKAGE_JSON);
  fs.rmdirSync(TMP_DIR, { recursive: true });
}
