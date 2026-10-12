// Rewrites every react/react-dom pin in the workspace down to React 18.
//
// The published packages peer-support both React 18 and 19, but the workspace itself
// pins 19, so CI would only ever exercise half of that range. The React 18 CI job runs
// this first to verify the other half still builds and passes.
//
// peerDependencies are deliberately left alone: that range is the contract under test.

const fs = require('fs');
const path = require('path');

const VERSIONS = {
  react: '18.3.1',
  'react-dom': '18.3.1',
  '@types/react': '18.3.29',
  '@types/react-dom': '18.3.7',
};

const MANIFESTS = [
  'package.json',
  'packages/scenes/package.json',
  'packages/scenes-react/package.json',
  'packages/scenes-app/package.json',
  'docusaurus/website/package.json',
];

const SECTIONS = ['dependencies', 'devDependencies', 'resolutions'];

let found = 0;

for (const manifest of MANIFESTS) {
  const file = path.join(__dirname, '..', manifest);
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const changed = [];

  for (const section of SECTIONS) {
    for (const [name, version] of Object.entries(VERSIONS)) {
      if (pkg[section] && pkg[section][name]) {
        found++;
        if (pkg[section][name] !== version) {
          pkg[section][name] = version;
          changed.push(`${section}.${name}`);
        }
      }
    }
  }

  if (changed.length) {
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`${manifest}: ${changed.join(', ')}`);
  }
}

// A silent no-op here would leave the job testing React 19 and reporting success, so
// fail loudly if the pins this script expects to find have moved or been renamed.
if (found === 0) {
  console.error('Found no react pins to rewrite — has the manifest layout changed?');
  process.exit(1);
}

console.log(`Pinned ${found} react dependencies to React 18.`);
