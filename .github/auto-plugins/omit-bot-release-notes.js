// Local `auto` plugin.
//
// `auto` already strips the (often huge) "Release Notes" section out of PRs
// authored by known bots — see `changelog.hooks.omitReleaseNotes` and the
// built-in "Bots" tap in @auto-it/core. That bot list does NOT include
// Grafana's central Renovate app (`renovate-sh-app[bot]`), so its PR bodies —
// which embed entire upstream changelogs in <details> blocks — get hoisted
// verbatim into both CHANGELOG.md and the GitHub Release body. That overflows
// GitHub's 125,000 character limit on release bodies and fails `auto release`
// with a 422 (and bloats the changelog file by thousands of lines).
//
// This plugin teaches `auto` to treat our bots the same way it treats the
// built-in ones: omit their Release Notes section (the changelog still gets a
// one-line entry for the PR, just not the giant upstream dump).
const OMIT_RELEASE_NOTES_BOTS = [
  'renovate-sh-app[bot]',
  'renovate-sh-app',
  'grafana-pr-automation[bot]',
  'grafana-pr-automation',
];

module.exports = class OmitBotReleaseNotesPlugin {
  name = 'omit-bot-release-notes';

  apply(auto) {
    auto.hooks.onCreateChangelog.tap(this.name, (changelog) => {
      changelog.hooks.omitReleaseNotes.tap(this.name, (commit) => {
        const isBot = commit.authors.some(
          (author) =>
            (author.name && OMIT_RELEASE_NOTES_BOTS.includes(author.name)) ||
            (author.username && OMIT_RELEASE_NOTES_BOTS.includes(author.username))
        );

        if (isBot) {
          return true;
        }
      });
    });
  }
};
