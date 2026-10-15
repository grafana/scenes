// Fail-closed check on a release PR, run immediately before the release job
// approves it with the approver app's token.
//
// The org ruleset requires one approving review from someone other than the last
// pusher, so the release job cannot approve its own PR and a second identity signs
// off instead. That approval is only defensible if it is narrow: this asserts the PR
// is the one the job just produced and that it changes nothing but changelogs and
// version numbers.
//
// Checking the file list is not sufficient on its own. `publish` runs `lerna publish`
// from this tree against npm trusted publishing, so a `scripts.prepublishOnly` or a
// `files` entry smuggled into a package.json would execute with the release job's
// credentials and ship in the tarball. Every JSON manifest is therefore compared
// key-by-key, and `version` is the only key allowed to differ.
//
// Everything is read back from the API rather than from the local tree: the API is
// what a reviewer and the merge will see, and reading the tree we just wrote would
// only confirm the job agrees with itself.
//
// Exiting non-zero blocks the approval but leaves the PR open with auto-merge armed,
// so the failure mode is the pre-existing one - a human approves the release.

const { execFileSync } = require('child_process');
const { isDeepStrictEqual } = require('util');

const repo = env('GITHUB_REPOSITORY');
const prNumber = env('PR_NUMBER');
const version = env('VERSION');
const releaseBot = env('RELEASE_BOT');
const expectedSha = env('EXPECTED_SHA');
const expectedParent = env('EXPECTED_PARENT');

const problems = [];

function env(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set`);
    process.exit(1);
  }
  return value;
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function ghJson(args) {
  return JSON.parse(gh(args));
}

function check(ok, message) {
  if (!ok) {
    problems.push(message);
  }
}

function report() {
  if (problems.length) {
    console.error(`Refusing to approve PR #${prNumber}:`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exit(1);
  }
}

// `gh` spells an app two ways: `app/<slug>` for a PR author, `<slug>[bot]` for a commit
// author. Compare on the slug so neither form has to be guessed at the call site.
function appSlug(login) {
  return (login || '').replace(/^app\//, '').replace(/\[bot\]$/, '');
}

// Reads a file at a specific commit. Blobs are fetched rather than diffed because a
// patch only shows the lines git chose to show; the parsed objects show every key.
function readJsonAt(path, ref) {
  const { content, encoding } = ghJson(['api', `repos/${repo}/contents/${path}?ref=${ref}`]);
  if (encoding !== 'base64') {
    throw new Error(`${path}@${ref} came back as ${encoding}, expected base64`);
  }
  return JSON.parse(Buffer.from(content, 'base64').toString('utf8'));
}

// Compares each top-level key as a whole value rather than flattening the manifest to
// dotted leaf paths. Flattening is unsound here: a key whose name itself contains a dot
// collides with the path of a nested key, so a tampered `scripts.prepack` could be
// concealed by adding a top-level key literally named "scripts.prepack" holding the
// original value. Flattening also emits nothing at all for `{}` and `[]`, which hides
// both an added empty container and a retype between the two.
//
// `isDeepStrictEqual` has neither hole: it distinguishes `{}` from `[]` by prototype, and
// a dotted key name is just a key. A key present on one side only compares against
// `undefined`, which JSON can never produce, so additions and removals always differ.
function differingKeys(before, after) {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return keys.filter((key) => !isDeepStrictEqual(before[key], after[key]));
}

const pr = ghJson([
  'pr',
  'view',
  prNumber,
  '--repo',
  repo,
  '--json',
  'number,title,state,baseRefName,headRefName,headRefOid,author,commits,isCrossRepository',
]);

check(pr.state === 'OPEN', `PR state is ${pr.state}, expected OPEN`);
check(pr.baseRefName === 'main', `base branch is ${pr.baseRefName}, expected main`);
check(pr.headRefName === `release/v${version}`, `head branch is ${pr.headRefName}, expected release/v${version}`);
check(pr.title === `Release v${version}`, `title is "${pr.title}", expected "Release v${version}"`);
check(appSlug(pr.author.login) === releaseBot, `PR was opened by ${pr.author.login}, expected ${releaseBot}`);
check(pr.isCrossRepository === false, 'PR head is in a different repository');

// The head has to be the commit this run created, not merely a commit that passes the
// checks below. Everything after this is a statement about `expectedSha`, and the review
// is submitted against that same sha, so a push landing between here and the approval
// cannot inherit an approval made for different content.
//
// Reported immediately rather than collected: every later check reads these shas, so
// carrying on would bury the one problem that matters under API errors about a commit
// that is not the one under review.
if (pr.headRefOid !== expectedSha) {
  problems.push(
    `PR head is ${pr.headRefOid.slice(0, 8)}, expected the commit this run created (${expectedSha.slice(0, 8)})`
  );
  report();
}

// One commit, by the release app, with a signature GitHub verifies. The signature is
// what makes the author claim worth checking at all - the name in a commit is
// otherwise just a string the pusher chose.
check(pr.commits.length === 1, `PR has ${pr.commits.length} commits, expected exactly 1`);
for (const commit of pr.commits) {
  const authors = [...new Set((commit.authors || []).map((a) => appSlug(a.login)))];
  check(
    authors.length === 1 && authors[0] === releaseBot,
    `commit ${commit.oid.slice(0, 8)} is authored by ${authors.join(', ') || 'nobody'}, expected ${releaseBot}`
  );
  const detail = ghJson(['api', `repos/${repo}/commits/${commit.oid}`]);
  check(
    detail.commit.verification.verified === true,
    `commit ${commit.oid.slice(0, 8)} signature is not verified (${detail.commit.verification.reason})`
  );
  // Sits directly on the main tip this run built from. Without this, a release branch
  // cut from some other commit would still satisfy every check above while carrying
  // whatever else that commit contained.
  const parents = (detail.parents || []).map((parent) => parent.sha);
  check(
    parents.length === 1 && parents[0] === expectedParent,
    `commit ${commit.oid.slice(0, 8)} has parents [${parents
      .map((p) => p.slice(0, 8))
      .join(', ')}], expected only ${expectedParent.slice(0, 8)}`
  );
}

// Derived from the repo rather than hardcoded, so adding a package does not silently
// drop it from the manifests that have to be present.
const packageDirs = gh([
  'api',
  `repos/${repo}/contents/packages?ref=${expectedParent}`,
  '--jq',
  '.[] | select(.type=="dir") | .name',
])
  .split('\n')
  .filter(Boolean);

const manifests = ['lerna.json', ...packageDirs.map((dir) => `packages/${dir}/package.json`)];
const changelogs = ['CHANGELOG.md', ...packageDirs.map((dir) => `packages/${dir}/CHANGELOG.md`)];
const allowed = new Set([...manifests, ...changelogs]);

// The two exact commits, rather than the PR's live file list, which always describes
// whatever the head is at the moment of the call.
const files = ghJson(['api', `repos/${repo}/compare/${expectedParent}...${expectedSha}`]).files || [];

for (const file of files) {
  if (!allowed.has(file.filename)) {
    problems.push(`${file.filename} is not a changelog or a version manifest`);
    continue;
  }
  if (file.status !== 'modified') {
    problems.push(`${file.filename} has status ${file.status}, expected modified`);
  }
  // `auto changelog` only ever prepends a section. A deletion means something edited
  // release notes that were already published.
  if (changelogs.includes(file.filename) && file.deletions !== 0) {
    problems.push(`${file.filename} deletes ${file.deletions} lines, expected additions only`);
  }
}

const touched = new Set(files.map((file) => file.filename));
for (const manifest of manifests) {
  if (!touched.has(manifest)) {
    problems.push(`${manifest} was not bumped`);
  }
}

for (const manifest of manifests.filter((m) => touched.has(m))) {
  const before = readJsonAt(manifest, expectedParent);
  const after = readJsonAt(manifest, expectedSha);
  const changed = differingKeys(before, after);
  if (changed.length !== 1 || changed[0] !== 'version') {
    problems.push(`${manifest} changes ${changed.join(', ') || 'nothing'}, expected version only`);
  }
  if (after.version !== version) {
    problems.push(`${manifest} is at version ${after.version}, expected ${version}`);
  }
}

report();

console.log(
  `PR #${prNumber} at ${expectedSha.slice(0, 8)} bumps ${manifests.length} manifests to ${version} and appends to ${
    files.filter((f) => changelogs.includes(f.filename)).length
  } changelogs, and changes nothing else.`
);
