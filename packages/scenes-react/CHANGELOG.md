# v8.6.0 (Fri Jun 26 2026)

### Release Notes

#### chore(deps): update dependency rimraf to v6 ([#1534](https://github.com/grafana/scenes/pull/1534))

<details>
<summary>isaacs/rimraf (rimraf)</summary>

#### chore(deps): update dependency jest to v30 ([#1530](https://github.com/grafana/scenes/pull/1530))

<details>
<summary>jestjs/jest (jest)</summary>

### [`v30.4.2`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3042)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.4.1...v30.4.2)

##### Fixes

- `[jest-runtime]` Fix named imports from CJS modules whose `module.exports` is a function with own-property exports ([#&#8203;16150](https://redirect.github.com/jestjs/jest/pull/16150))

### [`v30.4.1`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3041)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.4.0...v30.4.1)

##### Features

- `[jest-config, jest-core, jest-runner, jest-schemas, jest-types]` Allow custom runner configuration options via tuple format `['runner-path', {options}]` ([#&#8203;16141](https://redirect.github.com/jestjs/jest/pull/16141))

##### Fixes

- `[jest-runtime]` Align CJS-from-ESM default export with Node: `module.exports` is always the ESM default, `__esModule` unwrapping is no longer applied ([#&#8203;16143](https://redirect.github.com/jestjs/jest/pull/16143))

### [`v30.4.0`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3040)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.3.0...v30.4.0)

##### Features

- `[babel-jest]` Support collecting coverage from `.mts`, `.cts` (and other) files ([#&#8203;15994](https://redirect.github.com/jestjs/jest/pull/15994))
- `[jest-circus, jest-cli, jest-config, jest-core, jest-jasmine2, jest-types]` Add `--collect-tests` flag to discover and list tests without executing them ([#&#8203;16006](https://redirect.github.com/jestjs/jest/pull/16006))
- `[jest-config, jest-runner, jest-worker]` Add `workerGracefulExitTimeout` config option to control how long workers are given to exit before being force-killed ([#&#8203;15984](https://redirect.github.com/jestjs/jest/pull/15984))
- `[jest-config]` Add support for `jest.config.mts` as a valid configuration file ([#&#8203;16005](https://redirect.github.com/jestjs/jest/pull/16005))
- `[jest-config, jest-core, jest-reporters, jest-runner]` `verbose` and `silent` can now be set per-project; the project-level value overrides the global value for that project's tests ([#&#8203;16133](https://redirect.github.com/jestjs/jest/pull/16133))
- `[@jest/fake-timers]` Accept `Temporal.Duration` in `jest.advanceTimersByTime()` and `jest.advanceTimersByTimeAsync()` ([#&#8203;16128](https://redirect.github.com/jestjs/jest/pull/16128))
- `[@jest/fake-timers]` Accept `Temporal.Instant` and `Temporal.ZonedDateTime` in `jest.setSystemTime()` and `useFakeTimers({now})` ([#&#8203;16128](https://redirect.github.com/jestjs/jest/pull/16128))
- `[@jest/fake-timers]` Support faking `Temporal.Now.*` ([#&#8203;16131](https://redirect.github.com/jestjs/jest/pull/16131))
- `[jest-mock]` Add `clearMocksOnScope(scope)` on `ModuleMocker` for clearing every mock function exposed on a scope object ([#&#8203;16088](https://redirect.github.com/jestjs/jest/pull/16088))
- `[jest-resolve]` Add `canResolveSync()` on `Resolver` so callers can detect when a user-configured resolver only exports an `async` hook ([#&#8203;16064](https://redirect.github.com/jestjs/jest/pull/16064))
- `[jest-runtime]` Use synchronous `evaluate()` for ES modules without top-level `await` on Node versions that support it (v24.9+), and prefer the synchronous transform path when a sync transformer is configured ([#&#8203;16062](https://redirect.github.com/jestjs/jest/pull/16062))
- `[jest-runtime]` Support `require()` of ES modules on Node v24.9+ ([#&#8203;16074](https://redirect.github.com/jestjs/jest/pull/16074))
- `[jest-runtime]` Validate TC39 import attributes (`with { type: 'json' }`) on ESM imports ([#&#8203;16127](https://redirect.github.com/jestjs/jest/pull/16127))
- `[@jest/transform]` Add `canTransformSync(filename)` on `ScriptTransformer` so callers can pick the sync vs async transform path ([#&#8203;16062](https://redirect.github.com/jestjs/jest/pull/16062))
- `[jest-util]` Add `isError` helper ([#&#8203;16076](https://redirect.github.com/jestjs/jest/pull/16076))
- `[pretty-format]` Support React 19 ([#&#8203;16123](https://redirect.github.com/jestjs/jest/pull/16123))

##### Fixes

- `[expect-utils]` Fix `toStrictEqual` failing on `structuredClone` results due to cross-realm constructor mismatch ([#&#8203;15959](https://redirect.github.com/jestjs/jest/pull/15959))
- `[@jest/expect-utils]` Prevent `toMatchObject`/subset matching from throwing when encountering exotic iterables ([#&#8203;15952](https://redirect.github.com/jestjs/jest/pull/15952))
- `[fake-timers]` Convert `Date` to milliseconds before passing to `@sinonjs/fake-timers` ([#&#8203;16029](https://redirect.github.com/jestjs/jest/pull/16029))
- `[jest]` Export `GlobalConfig` and `ProjectConfig` TypeScript types ([#&#8203;16132](https://redirect.github.com/jestjs/jest/pull/16132))
- `[jest-circus]` Prevent crash when `asyncError` is undefined for non-Error throws ([#&#8203;16003](https://redirect.github.com/jestjs/jest/pull/16003))
- `[jest-circus, jest-jasmine2]` Include `Error.cause` in JSON `failureMessages` output ([#&#8203;15967](https://redirect.github.com/jestjs/jest/pull/15967))
- `[jest-config]` Fix preset path resolution on Windows when the preset uses subpath `exports` ([#&#8203;15961](https://redirect.github.com/jestjs/jest/pull/15961))
- `[jest-config]` Allow `collectCoverage` and `coverageProvider` in project config without a validation warning ([#&#8203;16132](https://redirect.github.com/jestjs/jest/pull/16132))
- `[jest-config]` Project config validator now emits "is not supported in an individual project configuration" instead of "probably a typing mistake" for known global-only options ([#&#8203;16132](https://redirect.github.com/jestjs/jest/pull/16132))
- `[jest-environment-node]` Fix `--localstorage-file` warning on Node 25+ ([#&#8203;16086](https://redirect.github.com/jestjs/jest/pull/16086))
- `[jest-reporters]` Apply global coverage threshold to unmatched pattern files in addition to glob/path thresholds ([#&#8203;16137](https://redirect.github.com/jestjs/jest/pull/16137))
- `[jest-reporters, jest-runner, jest-runtime, jest-transform]` Fix coverage report not showing correct code coverage when using `projects` config option ([#&#8203;16140](https://redirect.github.com/jestjs/jest/pull/16140))
- `[jest-runtime]` Resolve `expect` and `@jest/expect` from the internal module registry so test-file imports share the same `JestAssertionError` as the global `expect` ([#&#8203;16130](https://redirect.github.com/jestjs/jest/pull/16130))
- `[jest-runtime]` Improve CJS-from-ESM interop: `__esModule`/Babel default unwrap, broader named-export coverage, and shared CJS singleton across importers ([#&#8203;16050](https://redirect.github.com/jestjs/jest/pull/16050))
- `[jest-runtime]` Load `.js` files with ESM syntax but no `"type":"module"` marker as native ESM ([#&#8203;16050](https://redirect.github.com/jestjs/jest/pull/16050))
- `[jest-runtime]` Extend the `.js`-with-ESM-syntax fallback to `require()` on Node v24.9+ - falls back to `require(esm)` when the CJS parser rejects ESM syntax ([#&#8203;16078](https://redirect.github.com/jestjs/jest/pull/16078))
- `[jest-runtime]` Fix deadlocks and double-evaluation in concurrent ESM and wasm imports ([#&#8203;16050](https://redirect.github.com/jestjs/jest/pull/16050))
- `[jest-runtime]` Fix error when `require()` is called after the Jest environment has been torn down ([#&#8203;15951](https://redirect.github.com/jestjs/jest/pull/15951))
- `[jest-runtime]` Fix missing error when `import()` is called after the Jest environment has been torn down ([#&#8203;16080](https://redirect.github.com/jestjs/jest/pull/16080))
- `[jest-runtime]` Fix virtual `unstable_mockModule` registrations not respected in ESM ([#&#8203;16081](https://redirect.github.com/jestjs/jest/pull/16081))
- `[jest-runtime]` Apply `moduleNameMapper` when resolving modules with `require.resolve()` and the `paths` option ([#&#8203;16135](https://redirect.github.com/jestjs/jest/pull/16135))

##### Chore & Maintenance

- `[@jest/fake-timers]` Upgrade `@sinonjs/fake-timers` ([#&#8203;16139](https://redirect.github.com/jestjs/jest/pull/16139))
- `[jest-runtime]` Use synchronous `linkRequests` / `instantiate` for ESM linking on Node v24.9+ ([#&#8203;16063](https://redirect.github.com/jestjs/jest/pull/16063))

### [`v30.3.0`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3030)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.2.0...v30.3.0)

##### Features

- `[jest-config]` Add `defineConfig` and `mergeConfig` helpers for type-safe Jest config ([#&#8203;15844](https://redirect.github.com/jestjs/jest/pull/15844))
- `[jest-fake-timers]` Add `setTimerTickMode` to configure how timers advance
- `[*]` Reduce token usage when run through LLMs ([`3f17932`](https://redirect.github.com/jestjs/jest/commit/3f17932061c0203999451e5852664093de876709))

##### Fixes

- `[jest-config]` Keep CLI coverage output when using `--json` with `--outputFile` ([#&#8203;15918](https://redirect.github.com/jestjs/jest/pull/15918))
- `[jest-mock]` Use `Symbol` from test environment ([#&#8203;15858](https://redirect.github.com/jestjs/jest/pull/15858))
- `[jest-reporters]` Fix issue where console output not displayed for GHA reporter even with `silent: false` option ([#&#8203;15864](https://redirect.github.com/jestjs/jest/pull/15864))
- `[jest-runtime]` Fix issue where user cannot utilize dynamic import despite specifying `--experimental-vm-modules` Node option ([#&#8203;15842](https://redirect.github.com/jestjs/jest/pull/15842))
- `[jest-test-sequencer]` Fix issue where failed tests due to compilation errors not getting re-executed even with `--onlyFailures` CLI option ([#&#8203;15851](https://redirect.github.com/jestjs/jest/pull/15851))
- `[jest-util]` Make sure `process.features.require_module` is `false` ([#&#8203;15867](https://redirect.github.com/jestjs/jest/pull/15867))

##### Chore & Maintenance

- `[*]` Replace remaining micromatch uses with picomatch
- `[deps]` Update to sinon/fake-timers v15
- `[docs]` Update V30 migration guide to notify users on `jest.mock()` work with case-sensitive path ([#&#8203;15849](https://redirect.github.com/jestjs/jest/pull/15849))
- Updated Twitter icon to match the latest brand guidelines ([#&#8203;15869](https://redirect.github.com/jestjs/jest/pull/15869))

### [`v30.2.0`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3020)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.1.3...v30.2.0)

##### Chore & Maintenance

- `[*]` Update example repo for testing React Native projects ([#&#8203;15832](https://redirect.github.com/jestjs/jest/pull/15832))
- `[*]` Update `jest-watch-typeahead` to v3 ([#&#8203;15830](https://redirect.github.com/jestjs/jest/pull/15830))

### [`v30.1.3`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3013)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.1.2...v30.1.3)

##### Fixes

- Fix `unstable_mockModule` with `node:` prefixed core modules.

### [`v30.1.2`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3012)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.1.1...v30.1.2)

##### Fixes

- `[jest-snapshot-utils]` Correct snapshot header regexp to work with newline across OSes ([#&#8203;15803](https://redirect.github.com/jestjs/jest/pull/15803))

### [`v30.1.1`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3011)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.1.0...v30.1.1)

##### Fixes

- `[jest-snapshot-utils]` Fix deprecated goo.gl snapshot warning not handling Windows end-of-line sequences ([#&#8203;15800](https://redirect.github.com/jestjs/jest/pull/15800))
- `[jest-snapshot-utils]` Improve messaging about goo.gl snapshot link change ([#&#8203;15821](https://redirect.github.com/jestjs/jest/pull/15821))

### [`v30.1.0`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3010)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.0.5...v30.1.0)

### [`v30.0.5`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3005)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.0.4...v30.0.5)

##### Features

- `[jest-config]` Allow `testMatch` to take a string value
- `[jest-worker]` Let `workerIdleMemoryLimit` accept 0 to always restart worker child processes

##### Fixes

- `[expect]` Fix `bigint` error ([#&#8203;15702](https://redirect.github.com/jestjs/jest/pull/15702))

### [`v30.0.4`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3004)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.0.3...v30.0.4)

##### Features

- `[expect]` The `Inverse` type is now exported ([#&#8203;15714](https://redirect.github.com/jestjs/jest/pull/15714))
- `[expect]` feat: support `async functions` in `toBe` ([#&#8203;15704](https://redirect.github.com/jestjs/jest/pull/15704))

##### Fixes

- `[jest]` jest --onlyFailures --listTests now correctly lists only failed tests ([#&#8203;15700](https://redirect.github.com/jestjs/jest/issues/15700))
- `[jest-snapshot]` Handle line endings in snapshots ([#&#8203;15708](https://redirect.github.com/jestjs/jest/pull/15708))

### [`v30.0.3`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3003)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.0.2...v30.0.3)

##### Fixes

- `[jest-config]` Fix ESM TS config loading in a CJS project ([#&#8203;15694](https://redirect.github.com/jestjs/jest/pull/15694))
- `[jest-core]` jest --onlyFailures --listTests now correctly lists only failed tests([#&#8203;15700](https://redirect.github.com/jestjs/jest/pull/15700))

##### Features

- `[jest-diff]` Show non-printable control characters to diffs ([#&#8203;15696](https://redirect.github.com/jestjs/jest/pull/15696))

### [`v30.0.2`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3002)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.0.1...v30.0.2)

##### Fixes

- `[jest-matcher-utils]` Make 'deepCyclicCopyObject' safer by setting descriptors to a null-prototype object ([#&#8203;15689](https://redirect.github.com/jestjs/jest/pull/15689))
- `[jest-util]` Make garbage collection protection property writable ([#&#8203;15689](https://redirect.github.com/jestjs/jest/pull/15689))

### [`v30.0.1`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3001)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v30.0.0...v30.0.1)

##### Features

- `[jest-resolver]` Implement the `defaultAsyncResolver` ([#&#8203;15679](https://redirect.github.com/jestjs/jest/pull/15679))

##### Fixes

- `[jest-resolver]` Resolve builtin modules correctly ([#&#8203;15683](https://redirect.github.com/jestjs/jest/pull/15683))
- `[jest-environment-node, jest-util]` Avoid setting globals cleanup protection symbol when feature is off ([#&#8203;15684](https://redirect.github.com/jestjs/jest/pull/15684))

##### Chore & Maintenance

- `[*]` Remove and deprecate `jest-repl` package ([#&#8203;15673](https://redirect.github.com/jestjs/jest/pull/15673))
- `[jest-resolver]` Replace custom `isBuiltinModule` with node's `isBuiltin` ([#&#8203;15685](https://redirect.github.com/jestjs/jest/pull/15685))

### [`v30.0.0`](https://redirect.github.com/jestjs/jest/blob/HEAD/CHANGELOG.md#3000)

[Compare Source](https://redirect.github.com/jestjs/jest/compare/v29.7.0...v30.0.0)

##### Features

- `[*]` Renamed `globalsCleanupMode` to `globalsCleanup` and `--waitNextEventLoopTurnForUnhandledRejectionEvents` to `--waitForUnhandledRejections`
- `[expect]` Add `ArrayOf` asymmetric matcher for validating array elements. ([#&#8203;15567](https://redirect.github.com/jestjs/jest/pull/15567))
- `[babel-jest]` Add option `excludeJestPreset` to allow opting out of `babel-preset-jest` ([#&#8203;15164](https://redirect.github.com/jestjs/jest/pull/15164))
- `[expect]` Revert [#&#8203;15038](https://redirect.github.com/jestjs/jest/pull/15038) to fix `expect(fn).toHaveBeenCalledWith(expect.objectContaining(...))` when there are multiple calls ([#&#8203;15508](https://redirect.github.com/jestjs/jest/pull/15508))
- `[jest-circus, jest-cli, jest-config]` Add `waitNextEventLoopTurnForUnhandledRejectionEvents` flag to minimise performance impact of correct detection of unhandled promise rejections introduced in [#&#8203;14315](https://redirect.github.com/jestjs/jest/pull/14315) ([#&#8203;14681](https://redirect.github.com/jestjs/jest/pull/14681))
- `[jest-circus]` Add a `waitBeforeRetry` option to `jest.retryTimes` ([#&#8203;14738](https://redirect.github.com/jestjs/jest/pull/14738))
- `[jest-circus]` Add a `retryImmediately` option to `jest.retryTimes` ([#&#8203;14696](https://redirect.github.com/jestjs/jest/pull/14696))
- `[jest-circus, jest-jasmine2]` Allow `setupFilesAfterEnv` to export an async function ([#&#8203;14749](https://redirect.github.com/jestjs/jest/pull/14749))
- `[jest-circus, jest-test-result]` Add `startedAt` timestamp in `TestCaseResultObject` within `onTestCaseResult` ([#&#8203;15145](https://redirect.github.com/jestjs/jest/pull/15145))
- `[jest-cli]` Export `buildArgv` ([#&#8203;15310](https://redirect.github.com/jestjs/jest/pull/15310))
- `[jest-config]` \[**BREAKING**] Add `mts` and `cts` to default `moduleFileExtensions` config ([#&#8203;14369](https://redirect.github.com/jestjs/jest/pull/14369))
- `[jest-config]` \[**BREAKING**] Update `testMatch` and `testRegex` default option for supporting `mjs`, `cjs`, `mts`, and `cts` ([#&#8203;14584](https://redirect.github.com/jestjs/jest/pull/14584))
- `[jest-config]` Loads config file from provided path in `package.json` ([#&#8203;14044](https://redirect.github.com/jestjs/jest/pull/14044))
- `[jest-config]` Allow loading `jest.config.cts` files ([#&#8203;14070](https://redirect.github.com/jestjs/jest/pull/14070))
- `[jest-config]` Show `rootDir` in error message when a `preset` fails to load ([#&#8203;15194](https://redirect.github.com/jestjs/jest/pull/15194))
- `[jest-config]` Support loading TS config files using `esbuild-register` via docblock loader ([#&#8203;15190](https://redirect.github.com/jestjs/jest/pull/15190))
- `[jest-config]` Allow passing TS config loader options via docblock comment ([#&#8203;15234](https://redirect.github.com/jestjs/jest/pull/15234))
- `[jest-config]` If Node is running with type stripping enabled, do not require a TS loader ([#&#8203;15480](https://redirect.github.com/jestjs/jest/pull/15480))
- `[@jest/core]` Group together open handles with the same stack trace ([#&#8203;13417](https://redirect.github.com/jestjs/jest/pull/13417), & [#&#8203;14789](https://redirect.github.com/jestjs/jest/pull/14789))
- `[@jest/core]` Add `perfStats` to surface test setup overhead ([#&#8203;14622](https://redirect.github.com/jestjs/jest/pull/14622))
- `[@jest/core]` \[**BREAKING**] Changed `--filter` to accept an object with shape `{ filtered: Array<string> }` to match [documentation](https://jestjs.io/docs/cli#--filterfile) ([#&#8203;13319](https://redirect.github.com/jestjs/jest/pull/13319))
- `[@jest/core]` Support `--outputFile` option for [`--listTests`](https://jestjs.io/docs/cli#--listtests) ([#&#8203;14980](https://redirect.github.com/jestjs/jest/pull/14980))
- `[@jest/core]` Stringify Errors properly with `--json` flag ([#&#8203;15329](https://redirect.github.com/jestjs/jest/pull/15329))
- `[@jest/core, @&#8203;jest/test-sequencer]` \[**BREAKING**] Exposes `globalConfig` & `contexts` to `TestSequencer` ([#&#8203;14535](https://redirect.github.com/jestjs/jest/pull/14535), & [#&#8203;14543](https://redirect.github.com/jestjs/jest/pull/14543))
- `[jest-each]` Introduce `%$` option to add number of the test to its title ([#&#8203;14710](https://redirect.github.com/jestjs/jest/pull/14710))
- `[@jest/environment]` \[**BREAKING**] Remove deprecated `jest.genMockFromModule()` ([#&#8203;15042](https://redirect.github.com/jestjs/jest/pull/15042))
- `[@jest/environment]` \[**BREAKING**] Remove unnecessary defensive code ([#&#8203;15045](https://redirect.github.com/jestjs/jest/pull/15045))
- `[jest-environment-jsdom]` \[**BREAKING**] Upgrade JSDOM to v22 ([#&#8203;13825](https://redirect.github.com/jestjs/jest/pull/13825))
- `[@jest/environment-jsdom-abstract]` Introduce new package which abstracts over the `jsdom` environment, allowing usage of custom versions of JSDOM ([#&#8203;14717](https://redirect.github.com/jestjs/jest/pull/14717))
- `[jest-environment-node]` Update jest environment with dispose symbols `Symbol` ([#&#8203;14888](https://redirect.github.com/jestjs/jest/pull/14888) & [#&#8203;14909](https://redirect.github.com/jestjs/jest/pull/14909))
- `[expect, @&#8203;jest/expect]` \[**BREAKING**] Add type inference for function parameters in `CalledWith` assertions ([#&#8203;15129](https://redirect.github.com/jestjs/jest/pull/15129))
- `[@jest/expect-utils]` Properly compare all types of `TypedArray`s ([#&#8203;15178](https://redirect.github.com/jestjs/jest/pull/15178))
- `[@jest/fake-timers]` \[**BREAKING**] Upgrade `@sinonjs/fake-timers` to v13 ([#&#8203;14544](https://redirect.github.com/jestjs/jest/pull/14544) & [#&#8203;15470](https://redirect.github.com/jestjs/jest/pull/15470))
- `[@jest/fake-timers]` Exposing new modern timers function `advanceTimersToFrame()` which advances all timers by the needed milliseconds to execute callbacks currently scheduled with `requestAnimationFrame` ([#&#8203;14598](https://redirect.github.com/jestjs/jest/pull/14598))
- `[jest-matcher-utils]` Add `SERIALIZABLE_PROPERTIES` to allow custom serialization of objects ([#&#8203;14893](https://redirect.github.com/jestjs/jest/pull/14893))
- `[jest-mock]` Add support for the Explicit Resource Management proposal to use the `using` keyword with `jest.spyOn(object, methodName)` ([#&#8203;14895](https://redirect.github.com/jestjs/jest/pull/14895))
- `[jest-reporters]` Add support for [DEC mode 2026](https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036) ([#&#8203;15008](https://redirect.github.com/jestjs/jest/pull/15008))
- `[jest-resolver]` Support `file://` URLs as paths ([#&#8203;15154](https://redirect.github.com/jestjs/jest/pull/15154))
- `[jest-resolve,jest-runtime,jest-resolve-dependencies]` Pass the conditions when resolving stub modules ([#&#8203;15489](https://redirect.github.com/jestjs/jest/pull/15489))
- `[jest-runtime]` Exposing new modern timers function `jest.advanceTimersToFrame()` from `@jest/fake-timers` ([#&#8203;14598](https://redirect.github.com/jestjs/jest/pull/14598))
- `[jest-runtime]` Support `import.meta.filename` and `import.meta.dirname` (available from [Node 20.11](https://nodejs.org/en/blog/release/v20.11.0)) ([#&#8203;14854](https://redirect.github.com/jestjs/jest/pull/14854))
- `[jest-runtime]` Support `import.meta.resolve` ([#&#8203;14930](https://redirect.github.com/jestjs/jest/pull/14930))
- `[jest-runtime]` \[**BREAKING**] Make it mandatory to pass `globalConfig` to the `Runtime` constructor ([#&#8203;15044](https://redirect.github.com/jestjs/jest/pull/15044))
- `[jest-runtime]` Add `unstable_unmockModule` ([#&#8203;15080](https://redirect.github.com/jestjs/jest/pull/15080))
- `[jest-runtime]` Add `onGenerateMock` transformer callback for auto generated callbacks ([#&#8203;15433](https://redirect.github.com/jestjs/jest/pull/15433) & [#&#8203;15482](https://redirect.github.com/jestjs/jest/pull/15482))
- `[jest-runtime]` \[**BREAKING**] Use `vm.compileFunction` over `vm.Script` ([#&#8203;15461](https://redirect.github.com/jestjs/jest/pull/15461))
- `[@jest/schemas]` Upgrade `@sinclair/typebox` to v0.34 ([#&#8203;15450](https://redirect.github.com/jestjs/jest/pull/15450))
- `[@jest/types]` `test.each()`: Accept a readonly (`as const`) table properly ([#&#8203;14565](https://redirect.github.com/jestjs/jest/pull/14565))
- `[@jest/types]` Improve argument type inference passed to `test` and `describe` callback functions from `each` tables ([#&#8203;14920](https://redirect.github.com/jestjs/jest/pull/14920))
- `[jest-snapshot]` \[**BREAKING**] Add support for [Error causes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) in snapshots ([#&#8203;13965](https://redirect.github.com/jestjs/jest/pull/13965))
- `[jest-snapshot]` Support Prettier 3 ([#&#8203;14566](https://redirect.github.com/jestjs/jest/pull/14566))
- `[@jest/util-snapshot]` Extract utils used by tooling from `jest-snapshot` into its own package ([#&#8203;15095](https://redirect.github.com/jestjs/jest/pull/15095))
- `[pretty-format]` \[**BREAKING**] Do not render empty string children (`''`) in React plugin ([#&#8203;14470](https://redirect.github.com/jestjs/jest/pull/14470))

##### Fixes

- `[expect]` Show `AggregateError` to display ([#&#8203;15346](https://redirect.github.com/jestjs/jest/pull/15346))
- `[*]` Replace `exit` with `exit-x` ([#&#8203;15399](https://redirect.github.com/jestjs/jest/pull/15399))
- `[babel-plugin-jest-hoist]` Use `denylist` instead of the deprecated `blacklist` for Babel 8 support ([#&#8203;14109](https://redirect.github.com/jestjs/jest/pull/14109))
- `[babel-plugin-jest-hoist]` Do not rely on buggy Babel behaviour ([#&#8203;15415](https://redirect.github.com/jestjs/jest/pull/15415))
- `[expect]` Check error instance type for `toThrow/toThrowError` ([#&#8203;14576](https://redirect.github.com/jestjs/jest/pull/14576))
- `[expect]` Improve diff for failing `expect.objectContaining` ([#&#8203;15038](https://redirect.github.com/jestjs/jest/pull/15038))
- `[expect]` Use `Array.isArray` to check if an array is an `Array` ([#&#8203;15101](https://redirect.github.com/jestjs/jest/pull/15101))
- `[expect]` Fix Error `cause` assertion errors ([#&#8203;15339](https://redirect.github.com/jestjs/jest/pull/15339))
- `[jest-changed-files]` Print underlying errors when VCS commands fail ([#&#8203;15052](https://redirect.github.com/jestjs/jest/pull/15052))
- `[jest-changed-files]` Abort `sl root` call if output resembles a steam locomotive ([#&#8203;15053](https://redirect.github.com/jestjs/jest/pull/15053))
- `[jest-circus]` \[**BREAKING**] Prevent false test failures caused by promise rejections handled asynchronously ([#&#8203;14315](https://redirect.github.com/jestjs/jest/pull/14315))
- `[jest-circus]` Replace recursive `makeTestResults` implementation with iterative one ([#&#8203;14760](https://redirect.github.com/jestjs/jest/pull/14760))
- `[jest-circus]` Omit `expect.hasAssertions()` errors if a test already has errors ([#&#8203;14866](https://redirect.github.com/jestjs/jest/pull/14866))
- `[jest-circus, jest-expect, jest-snapshot]` Pass `test.failing` tests when containing failing snapshot matchers ([#&#8203;14313](https://redirect.github.com/jestjs/jest/pull/14313))
- `[jest-circus]` Concurrent tests now emit jest circus events at the correct point and in the expected order. ([#&#8203;15381](https://redirect.github.com/jestjs/jest/pull/15381))
- `[jest-cli]` \[**BREAKING**] Validate CLI flags that require arguments receives them ([#&#8203;14783](https://redirect.github.com/jestjs/jest/pull/14783))
- `[jest-config]` Make sure to respect `runInBand` option ([#&#8203;14578](https://redirect.github.com/jestjs/jest/pull/14578))
- `[jest-config]` Support `testTimeout` in project config ([#&#8203;14697](https://redirect.github.com/jestjs/jest/pull/14697))
- `[jest-config]` Support `coverageReporters` in project config ([#&#8203;14830](https://redirect.github.com/jestjs/jest/pull/14830))
- `[jest-config]` Allow `reporters` in project config ([#&#8203;14768](https://redirect.github.com/jestjs/jest/pull/14768))
- `[jest-config]` Allow Node16/NodeNext/Bundler `moduleResolution` in project's tsconfig ([#&#8203;14739](https://redirect.github.com/jestjs/jest/pull/14739))
- `[@jest/create-cache-key-function]` Correct the return type of `createCacheKey` ([#&#8203;15159](https://redirect.github.com/jestjs/jest/pull/15159))
- `[jest-each]` Allow `$keypath` templates with `null` or `undefined` values ([#&#8203;14831](https://redirect.github.com/jestjs/jest/pull/14831))
- `[@jest/expect-utils]` Fix comparison of `DataView` ([#&#8203;14408](https://redirect.github.com/jestjs/jest/pull/14408))
- `[@jest/expect-utils]` \[**BREAKING**] exclude non-enumerable in object matching ([#&#8203;14670](https://redirect.github.com/jestjs/jest/pull/14670))
- `[@jest/expect-utils]` Fix comparison of `URL` ([#&#8203;14672](https://redirect.github.com/jestjs/jest/pull/14672))
- `[@jest/expect-utils]` Check `Symbol` properties in equality ([#&#8203;14688](https://redirect.github.com/jestjs/jest/pull/14688))
- `[@jest/expect-utils]` Catch circular references within arrays when matching objects ([#&#8203;14894](https://redirect.github.com/jestjs/jest/pull/14894))
- `[@jest/expect-utils]` Fix not addressing to Sets and Maps as objects without keys ([#&#8203;14873](https://redirect.github.com/jestjs/jest/pull/14873))
- `[jest-haste-map]` Fix errors or clobbering with multiple `hasteImplModulePath`s ([#&#8203;15522](https://redirect.github.com/jestjs/jest/pull/15522))
- `[jest-leak-detector]` Make leak-detector more aggressive when running GC ([#&#8203;14526](https://redirect.github.com/jestjs/jest/pull/14526))
- `[jest-runtime]` Properly handle re-exported native modules in ESM via CJS ([#&#8203;14589](https://redirect.github.com/jestjs/jest/pull/14589))
- `[jest-runtime]` Refactor `_importCoreModel` so required core module is consistent if modified while loading ([#&#8203;15517](https://redirect.github.com/jestjs/jest/pull/15517))
- `[jest-schemas, jest-types]` \[**BREAKING**] Fix type of `testFailureExitCode` config option([#&#8203;15232](https://redirect.github.com/jestjs/jest/pull/15232))
- `[jest-util]` Make sure `isInteractive` works in a browser ([#&#8203;14552](https://redirect.github.com/jestjs/jest/pull/14552))
- `[pretty-format]` \[**BREAKING**] Print `ArrayBuffer` and `DataView` correctly ([#&#8203;14290](https://redirect.github.com/jestjs/jest/pull/14290))
- `[pretty-format]` Fixed a bug where "anonymous custom elements" were not being printed as expected. ([#&#8203;15138](https://redirect.github.com/jestjs/jest/pull/15138))
- `[jest-cli]` When specifying paths on the command line, only match against the relative paths of the test files ([#&#8203;12519](https://redirect.github.com/jestjs/jest/pull/12519))
  - \[**BREAKING**] Changes `testPathPattern` configuration option to `testPathPatterns`, which now takes a list of patterns instead of the regex.
  - \[**BREAKING**] `--testPathPattern` is now `--testPathPatterns`
  - \[**BREAKING**] Specifying `testPathPatterns` when programmatically calling `watch` must be specified as `new TestPathPatterns(patterns)`, where `TestPathPatterns` can be imported from `@jest/pattern`
- `[jest-reporters, jest-runner]` Unhandled errors without stack get correctly logged to console ([#&#8203;14619](https://redirect.github.com/jestjs/jest/pull/14619))
- `[jest-util]` Always load `mjs` files with `import` ([#&#8203;15447](https://redirect.github.com/jestjs/jest/pull/15447))
- `[jest-worker]` Properly handle a circular reference error when worker tries to send an assertion fails where either the expected or actual value is circular ([#&#8203;15191](https://redirect.github.com/jestjs/jest/pull/15191))
- `[jest-worker]` Properly handle a BigInt when worker tries to send an assertion fails where either the expected or actual value is BigInt ([#&#8203;15191](https://redirect.github.com/jestjs/jest/pull/15191))
- `[expect]` Resolve issue where `ObjectContaining` matched non-object values. [#&#8203;15463](https://redirect.github.com/jestjs/jest/pull/15463).
  - Adds a `conditional/check` to ensure the argument passed to `expect` is an object.
  - Add unit tests for new `ObjectContaining` behavior.
  - Remove `invalid/wrong` test case assertions for `ObjectContaining`.
- `[jest-worker]` Addresses incorrect state on exit ([#&#8203;15610](https://redirect.github.com/jestjs/jest/pull/15610))

##### Performance

- `[*]` \[**BREAKING**] Bundle all of Jest's modules into `index.js` ([#&#8203;12348](https://redirect.github.com/jestjs/jest/pull/12348), [#&#8203;14550](https://redirect.github.com/jestjs/jest/pull/14550) & [#&#8203;14661](https://redirect.github.com/jestjs/jest/pull/14661))
- `[jest-haste-map]` Only spawn one process to check for `watchman` installation ([#&#8203;14826](https://redirect.github.com/jestjs/jest/pull/14826))
- `[jest-runner]` Better cleanup `source-map-support` after test to resolve (minor) memory leak ([#&#8203;15233](https://redirect.github.com/jestjs/jest/pull/15233))
- `[jest-resolver]` Migrate `resolve` and `resolve.exports` to `unrs-resolver` ([#&#8203;15619](https://redirect.github.com/jestjs/jest/pull/15619))
- `[jest-circus, jest-environment-node, jest-repl, jest-runner, jest-util]` Cleanup global variables on environment teardown to reduce memory leaks ([#&#8203;15215](https://redirect.github.com/jestjs/jest/pull/15215) & [#&#8203;15636](https://redirect.github.com/jestjs/jest/pull/15636) & [#&#8203;15643](https://redirect.github.com/jestjs/jest/pull/15643))

##### Chore & Maintenance

- `[jest-environment-jsdom, jest-environment-jsdom-abstract]` Increased version of jsdom to `^26.0.0` ([#&#8203;15473](https://redirect.github.com/jestjs/jest/pull/15473))
- `[*]` Increase version of `micromatch` to `^4.0.7` ([#&#8203;15082](https://redirect.github.com/jestjs/jest/pull/15082))
- `[*]` \[**BREAKING**] Drop support for Node.js versions 14, 16, 19, 21 and 23 ([#&#8203;14460](https://redirect.github.com/jestjs/jest/pull/14460), [#&#8203;15118](https://redirect.github.com/jestjs/jest/pull/15118), [#&#8203;15623](https://redirect.github.com/jestjs/jest/pull/15623), [#&#8203;15640](https://redirect.github.com/jestjs/jest/pull/15640))
- `[*]` \[**BREAKING**] Drop support for `typescript@4.3`, minimum version is now `5.4` ([#&#8203;14542](https://redirect.github.com/jestjs/jest/pull/14542), [#&#8203;15621](https://redirect.github.com/jestjs/jest/pull/15621))
- `[*]` Depend on exact versions of monorepo dependencies instead of `^` range ([#&#8203;14553](https://redirect.github.com/jestjs/jest/pull/14553))
- `[*]` \[**BREAKING**] Add ESM wrapper for all of Jest's modules ([#&#8203;14661](https://redirect.github.com/jestjs/jest/pull/14661))
- `[*]` \[**BREAKING**] Upgrade to `glob@10` ([#&#8203;14509](https://redirect.github.com/jestjs/jest/pull/14509))
- `[*]` Use `TypeError` over `Error` where appropriate ([#&#8203;14799](https://redirect.github.com/jestjs/jest/pull/14799))
- `[docs]` Fix typos in `CHANGELOG.md` and `packages/jest-validate/README.md` ([#&#8203;14640](https://redirect.github.com/jestjs/jest/pull/14640))
- `[docs]` Don't use alias matchers in docs ([#&#8203;14631](https://redirect.github.com/jestjs/jest/pull/14631))
- `[babel-jest, babel-preset-jest]` \[**BREAKING**] Increase peer dependency of `@babel/core` to `^7.11` ([#&#8203;14109](https://redirect.github.com/jestjs/jest/pull/14109))
- `[babel-jest, @&#8203;jest/transform]` Update `babel-plugin-istanbul` to v6 ([#&#8203;15156](https://redirect.github.com/jestjs/jest/pull/15156))
- `[babel-plugin-jest-hoist]` Move unnecessary `dependencies` to `devDependencies` ([#&#8203;15010](https://redirect.github.com/jestjs/jest/pull/15010))
- `[expect]` \[**BREAKING**] Remove `.toBeCalled()`, `.toBeCalledTimes()`, `.toBeCalledWith()`, `.lastCalledWith()`, `.nthCalledWith()`, `.toReturn()`, `.toReturnTimes()`, `.toReturnWith()`, `.lastReturnedWith()`, `.nthReturnedWith()` and `.toThrowError()` matcher aliases ([#&#8203;14632](https://redirect.github.com/jestjs/jest/pull/14632))
- `[jest-cli, jest-config, @&#8203;jest/types]` \[**BREAKING**] Remove deprecated `--init` argument ([#&#8203;14490](https://redirect.github.com/jestjs/jest/pull/14490))
- `[jest-config, @&#8203;jest/core, jest-util]` Upgrade `ci-info` ([#&#8203;14655](https://redirect.github.com/jestjs/jest/pull/14655))
- `[jest-mock]` \[**BREAKING**] Remove `MockFunctionMetadataType`, `MockFunctionMetadata` and `SpyInstance` types ([#&#8203;14621](https://redirect.github.com/jestjs/jest/pull/14621))
- `[@jest/reporters]` Upgrade `istanbul-lib-source-maps` ([#&#8203;14924](https://redirect.github.com/jestjs/jest/pull/14924))
- `[jest-schemas]` Upgrade `@sinclair/typebox` ([#&#8203;14775](https://redirect.github.com/jestjs/jest/pull/14775))
- `[jest-transform]` Upgrade `write-file-atomic` ([#&#8203;14274](https://redirect.github.com/jestjs/jest/pull/14274))
- `[jest-util]` Upgrade `picomatch` to v4 ([#&#8203;14653](https://redirect.github.com/jestjs/jest/pull/14653) & [#&#8203;14885](https://redirect.github.com/jestjs/jest/pull/14885))
- `[docs] Append to NODE_OPTIONS, not overwrite ([#&#8203;14730](https://redirect.github.com/jestjs/jest/pull/14730))`
- `[docs]` Updated `.toHaveBeenCalled()` documentation to correctly reflect its functionality ([#&#8203;14842](https://redirect.github.com/jestjs/jest/pull/14842))
- `[docs]` Link NestJS documentation on testing with Jest ([#&#8203;14940](https://redirect.github.com/jestjs/jest/pull/14940))
- `[docs]` `Revised documentation for .toHaveBeenCalled()` to accurately depict its functionality. ([#&#8203;14853](https://redirect.github.com/jestjs/jest/pull/14853))
- `[docs]` Removed ExpressJS reference link from documentation due to dead link ([#&#8203;15270](https://redirect.github.com/jestjs/jest/pull/15270))
- `[docs]` Correct broken links in docs ([#&#8203;15359](https://redirect.github.com/jestjs/jest/pull/15359))

</details>

---

#### fix(deps): update emotion monorepo ([#1511](https://github.com/grafana/scenes/pull/1511))

<details>
<summary>emotion-js/emotion (@&#8203;emotion/css)</summary>

#### fix(deps): update react monorepo ([#1512](https://github.com/grafana/scenes/pull/1512))

<details>
<summary>facebook/react (react)</summary>

### [`v18.3.1`](https://redirect.github.com/facebook/react/blob/HEAD/CHANGELOG.md#1831-April-26-2024)

[Compare Source](https://redirect.github.com/facebook/react/compare/v18.3.0...v18.3.1)

- Export `act` from `react` [f1338f](https://redirect.github.com/facebook/react/commit/f1338f8080abd1386454a10bbf93d67bfe37ce85)

### [`v18.3.0`](https://redirect.github.com/facebook/react/blob/HEAD/CHANGELOG.md#1830-April-25-2024)

[Compare Source](https://redirect.github.com/facebook/react/compare/v18.2.0...v18.3.0)

This release is identical to 18.2 but adds warnings for deprecated APIs and other changes that are needed for React 19.

Read the [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) for more info.

##### React

- Allow writing to `this.refs` to support string ref codemod [909071](https://redirect.github.com/facebook/react/commit/9090712fd3ca4e1099e1f92e67933c2cb4f32552)
- Warn for deprecated `findDOMNode` outside StrictMode [c3b283](https://redirect.github.com/facebook/react/commit/c3b283964108b0e8dbcf1f9eb2e7e67815e39dfb)
- Warn for deprecated `test-utils` methods [d4ea75](https://redirect.github.com/facebook/react/commit/d4ea75dc4258095593b6ac764289f42bddeb835c)
- Warn for deprecated Legacy Context outside StrictMode [415ee0](https://redirect.github.com/facebook/react/commit/415ee0e6ea0fe3e288e65868df2e3241143d5f7f)
- Warn for deprecated string refs outside StrictMode [#&#8203;25383](https://redirect.github.com/facebook/react/pull/25383)
- Warn for deprecated `defaultProps` for function components [#&#8203;25699](https://redirect.github.com/facebook/react/pull/25699)
- Warn when spreading `key` [#&#8203;25697](https://redirect.github.com/facebook/react/pull/25697)
- Warn when using `act` from `test-utils` [d4ea75](https://redirect.github.com/facebook/react/commit/d4ea75dc4258095593b6ac764289f42bddeb835c)

##### React DOM

- Warn for deprecated `unmountComponentAtNode` [8a015b](https://redirect.github.com/facebook/react/commit/8a015b68cc060079878e426610e64e86fb328f8d)
- Warn for deprecated `renderToStaticNodeStream` [#&#8203;28874](https://redirect.github.com/facebook/react/pull/28874)

</details>

---

#### chore(deps): update dependency rxjs to v7.8.2 ([#1474](https://github.com/grafana/scenes/pull/1474))

<details>
<summary>reactivex/rxjs (rxjs)</summary>

#### chore(deps): update dependency @rollup/plugin-eslint to ^9.2.0 ([#1490](https://github.com/grafana/scenes/pull/1490))

<details>
<summary>rollup/plugins (@&#8203;rollup/plugin-eslint)</summary>

### [`v9.2.0`](https://redirect.github.com/rollup/plugins/blob/HEAD/packages/eslint/CHANGELOG.md#v920)

*2025-10-28*

##### Features

- feat: add support for ESLint v9 ([#&#8203;1905](https://redirect.github.com/rollup/plugins/issues/1905))

### [`v9.1.0`](https://redirect.github.com/rollup/plugins/blob/HEAD/packages/eslint/CHANGELOG.md#v910)

*2025-10-04*

##### Features

- feat: add support for flat configs ([#&#8203;1898](https://redirect.github.com/rollup/plugins/issues/1898))

</details>

---

---

#### 🐛 Bug Fix

- Bump version to: v8.5.0 \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- Update CHANGELOG.md \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- chore(deps): update dependency rimraf to v6 [#1534](https://github.com/grafana/scenes/pull/1534) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- Bump version to: v8.4.0 \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- chore: run prettier on main [#1539](https://github.com/grafana/scenes/pull/1539) ([@gtk-grafana](https://github.com/gtk-grafana))
- Bump version to: v8.3.0 \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- chore(deps): update dependency jest to v30 [#1530](https://github.com/grafana/scenes/pull/1530) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- fix(deps): update emotion monorepo [#1511](https://github.com/grafana/scenes/pull/1511) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- fix(deps): update react monorepo [#1512](https://github.com/grafana/scenes/pull/1512) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency rxjs to v7.8.2 [#1474](https://github.com/grafana/scenes/pull/1474) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- chore(deps): update dependency @types/node to v20.19.41 [#1493](https://github.com/grafana/scenes/pull/1493) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/lodash to v4.17.24 [#1492](https://github.com/grafana/scenes/pull/1492) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @rollup/plugin-eslint to ^9.2.0 [#1490](https://github.com/grafana/scenes/pull/1490) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-grid-layout to v1.3.6 [#1479](https://github.com/grafana/scenes/pull/1479) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-virtualized-auto-sizer to v1.0.8 [#1472](https://github.com/grafana/scenes/pull/1472) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- security: bump uuid ^9.0.0 → ^11.0.0 (CVE-2026-41907) [#1468](https://github.com/grafana/scenes/pull/1468) ([@moxious](https://github.com/moxious))

#### Authors: 5

- [@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot])
- David Allen ([@moxious](https://github.com/moxious))
- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Grot (@grafanabot) ([@grafanabot](https://github.com/grafanabot))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v8.5.0 (Thu Jun 18 2026)

#### 🐛 Bug Fix

- chore(deps): update dependency rimraf to v6 [#1534](https://github.com/grafana/scenes/pull/1534) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- Bump version to: v8.4.0 \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- Update CHANGELOG.md \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- chore: run prettier on main [#1539](https://github.com/grafana/scenes/pull/1539) ([@gtk-grafana](https://github.com/gtk-grafana))
- Bump version to: v8.3.0 \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- chore(deps): update dependency jest to v30 [#1530](https://github.com/grafana/scenes/pull/1530) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- fix(deps): update emotion monorepo [#1511](https://github.com/grafana/scenes/pull/1511) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- fix(deps): update react monorepo [#1512](https://github.com/grafana/scenes/pull/1512) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency rxjs to v7.8.2 [#1474](https://github.com/grafana/scenes/pull/1474) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- chore(deps): update dependency @types/node to v20.19.41 [#1493](https://github.com/grafana/scenes/pull/1493) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/lodash to v4.17.24 [#1492](https://github.com/grafana/scenes/pull/1492) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @rollup/plugin-eslint to ^9.2.0 [#1490](https://github.com/grafana/scenes/pull/1490) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-grid-layout to v1.3.6 [#1479](https://github.com/grafana/scenes/pull/1479) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-virtualized-auto-sizer to v1.0.8 [#1472](https://github.com/grafana/scenes/pull/1472) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- security: bump uuid ^9.0.0 → ^11.0.0 (CVE-2026-41907) [#1468](https://github.com/grafana/scenes/pull/1468) ([@moxious](https://github.com/moxious))

#### Authors: 5

- [@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot])
- David Allen ([@moxious](https://github.com/moxious))
- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Grot (@grafanabot) ([@grafanabot](https://github.com/grafanabot))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v8.4.0 (Fri Jun 12 2026)

#### 🐛 Bug Fix

- chore: run prettier on main [#1539](https://github.com/grafana/scenes/pull/1539) ([@gtk-grafana](https://github.com/gtk-grafana))
- Bump version to: v8.3.0 \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- Update CHANGELOG.md \[skip ci\] ([@grafanabot](https://github.com/grafanabot))
- chore(deps): update dependency jest to v30 [#1530](https://github.com/grafana/scenes/pull/1530) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- fix(deps): update emotion monorepo [#1511](https://github.com/grafana/scenes/pull/1511) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- fix(deps): update react monorepo [#1512](https://github.com/grafana/scenes/pull/1512) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency rxjs to v7.8.2 [#1474](https://github.com/grafana/scenes/pull/1474) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- chore(deps): update dependency @types/node to v20.19.41 [#1493](https://github.com/grafana/scenes/pull/1493) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/lodash to v4.17.24 [#1492](https://github.com/grafana/scenes/pull/1492) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @rollup/plugin-eslint to ^9.2.0 [#1490](https://github.com/grafana/scenes/pull/1490) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-grid-layout to v1.3.6 [#1479](https://github.com/grafana/scenes/pull/1479) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-virtualized-auto-sizer to v1.0.8 [#1472](https://github.com/grafana/scenes/pull/1472) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- security: bump uuid ^9.0.0 → ^11.0.0 (CVE-2026-41907) [#1468](https://github.com/grafana/scenes/pull/1468) ([@moxious](https://github.com/moxious))

#### Authors: 5

- [@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot])
- David Allen ([@moxious](https://github.com/moxious))
- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Grot (@grafanabot) ([@grafanabot](https://github.com/grafanabot))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v8.3.0 (Fri Jun 05 2026)

#### 🐛 Bug Fix

- chore(deps): update dependency jest to v30 [#1530](https://github.com/grafana/scenes/pull/1530) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- fix(deps): update emotion monorepo [#1511](https://github.com/grafana/scenes/pull/1511) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- fix(deps): update react monorepo [#1512](https://github.com/grafana/scenes/pull/1512) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency rxjs to v7.8.2 [#1474](https://github.com/grafana/scenes/pull/1474) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]) [@mdvictor](https://github.com/mdvictor))
- chore(deps): update dependency @types/node to v20.19.41 [#1493](https://github.com/grafana/scenes/pull/1493) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/lodash to v4.17.24 [#1492](https://github.com/grafana/scenes/pull/1492) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @rollup/plugin-eslint to ^9.2.0 [#1490](https://github.com/grafana/scenes/pull/1490) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-grid-layout to v1.3.6 [#1479](https://github.com/grafana/scenes/pull/1479) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- chore(deps): update dependency @types/react-virtualized-auto-sizer to v1.0.8 [#1472](https://github.com/grafana/scenes/pull/1472) ([@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot]))
- security: bump uuid ^9.0.0 → ^11.0.0 (CVE-2026-41907) [#1468](https://github.com/grafana/scenes/pull/1468) ([@moxious](https://github.com/moxious))

#### Authors: 3

- [@renovate-sh-app[bot]](https://github.com/renovate-sh-app[bot])
- David Allen ([@moxious](https://github.com/moxious))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v8.0.0 (Mon Apr 27 2026)

#### 💥 Breaking Change

- Fundamentals: No more flickering with render before activation global default option [#1345](https://github.com/grafana/scenes/pull/1345) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v7.3.10 (Tue Apr 07 2026)

#### 🐛 Bug Fix

- adHoc: remove wide-input prop [#1421](https://github.com/grafana/scenes/pull/1421) ([@kristinademeshchik](https://github.com/kristinademeshchik))

#### Authors: 1

- Kristina Demeshchik ([@kristinademeshchik](https://github.com/kristinademeshchik))

---

# v7.0.1 (Thu Feb 26 2026)

#### 🐛 Bug Fix

- fix: make rxjs a peer dep due to its brittle types [#1375](https://github.com/grafana/scenes/pull/1375) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v7.0.0 (Thu Feb 26 2026)

### Release Notes

#### fix esm builds ([#1368](https://github.com/grafana/scenes/pull/1368))

`@grafana/scenes` and `@grafana/scenes-react` now ship with exports defined in package.json, allowing only specific files to be exposed while blocking access to the packages internals. We consider this a breaking change.

---

#### 💥 Breaking Change

- fix esm builds [#1368](https://github.com/grafana/scenes/pull/1368) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v6.54.0 (Wed Feb 18 2026)

#### 🚀 Enhancement

- scenes react: ad hoc filters, groupby, localvalue [#1353](https://github.com/grafana/scenes/pull/1353) ([@L2D2Grafana](https://github.com/L2D2Grafana))

#### 🐛 Bug Fix

- chore!: update peer dependencies of scenes packages [#1213](https://github.com/grafana/scenes/pull/1213) ([@NWRichmond](https://github.com/NWRichmond))

#### Authors: 2

- Liza Detrick ([@L2D2Grafana](https://github.com/L2D2Grafana))
- Nick Richmond ([@NWRichmond](https://github.com/NWRichmond))

---

# v6.52.15 (Wed Feb 11 2026)

#### 🐛 Bug Fix

- ScenesReact: Add allValue to variables [#1254](https://github.com/grafana/scenes/pull/1254) ([@slaughtlaught](https://github.com/slaughtlaught))

#### Authors: 1

- Bogdan Tiet ([@slaughtlaught](https://github.com/slaughtlaught))

---

# v6.52.5 (Mon Jan 19 2026)

#### 🐛 Bug Fix

- feat: add requestIdPrefix option to SceneQueryRunner [#1336](https://github.com/grafana/scenes/pull/1336) ([@svennergr](https://github.com/svennergr))

#### Authors: 1

- Sven Grossmann ([@svennergr](https://github.com/svennergr))

---

# v6.42.1 (Thu Oct 30 2025)

#### 🐛 Bug Fix

- Data Layers: Add `placement` property [#1289](https://github.com/grafana/scenes/pull/1289) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v6.35.0 (Wed Sep 10 2025)

#### 🚀 Enhancement

- useQueryRunner: Add minInterval option [#1183](https://github.com/grafana/scenes/pull/1183) ([@krevedkokun](https://github.com/krevedkokun))

#### Authors: 1

- Nikita Domnitskii ([@krevedkokun](https://github.com/krevedkokun))

---

# v6.30.0 (Wed Aug 20 2025)

#### 🐛 Bug Fix

- ScenesReact: Add skipUrlSync to variables [#1182](https://github.com/grafana/scenes/pull/1182) ([@krevedkokun](https://github.com/krevedkokun))

#### Authors: 1

- Nikita Domnitskii ([@krevedkokun](https://github.com/krevedkokun))

---

# v6.27.2 (Wed Jul 09 2025)

#### 🐛 Bug Fix

- chore: unify license change in #327 [#1137](https://github.com/grafana/scenes/pull/1137) ([@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 1

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))

---

# v6.21.0 (Wed Jun 18 2025)

#### 🚀 Enhancement

- Internationalisation: Add markup for translations [#1151](https://github.com/grafana/scenes/pull/1151) ([@joshhunt](https://github.com/joshhunt))

#### 🐛 Bug Fix

- Update eslint to v9 [#1150](https://github.com/grafana/scenes/pull/1150) ([@joshhunt](https://github.com/joshhunt))

#### Authors: 1

- Josh Hunt ([@joshhunt](https://github.com/joshhunt))

---

# v6.6.1 (Tue Apr 01 2025)

#### 🐛 Bug Fix

- Bump rollup and related deps [#1077](https://github.com/grafana/scenes/pull/1077) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v6.0.0 (Fri Feb 07 2025)

#### 💥 Breaking Change

- Update to `react-router@6` [#979](https://github.com/grafana/scenes/pull/979) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v5.41.2 (Tue Feb 04 2025)

#### 🐛 Bug Fix

- Dependencies: Bump Grafana packages to v11.5 [#1040](https://github.com/grafana/scenes/pull/1040) ([@tskarhed](https://github.com/tskarhed))

#### Authors: 1

- Tobias Skarhed ([@tskarhed](https://github.com/tskarhed))

---

# v5.31.0 (Thu Dec 12 2024)

#### 🚀 Enhancement

- feat: (scenes-react) - VizPanel add missing props and tests [#998](https://github.com/grafana/scenes/pull/998) ([@L2D2Grafana](https://github.com/L2D2Grafana) [@gtk-grafana](https://github.com/gtk-grafana))

#### Authors: 2

- Galen Kistler ([@gtk-grafana](https://github.com/gtk-grafana))
- Liza Detrick ([@L2D2Grafana](https://github.com/L2D2Grafana))

---

# v5.29.0 (Thu Dec 05 2024)

#### 🐛 Bug Fix

- Prettier/lint: Add prettier and lint check to CI , format all files with prettier [#988](https://github.com/grafana/scenes/pull/988) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.28.0 (Fri Nov 29 2024)

#### 🐛 Bug Fix

- Chore: Bump grafana dependencies [#965](https://github.com/grafana/scenes/pull/965) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.25.0 (Wed Nov 13 2024)

#### 🚀 Enhancement

- Chore: Relax dependencies and move e2e-selectors to peerDeps [#940](https://github.com/grafana/scenes/pull/940) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v5.23.2 (Fri Nov 08 2024)

#### 🐛 Bug Fix

- ScenesReact: Cache SceneQueryRunners and other scene object by a key / hashing string [#788](https://github.com/grafana/scenes/pull/788) ([@torkelo](https://github.com/torkelo) [@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.21.0 (Tue Oct 29 2024)

#### 🐛 Bug Fix

- ScenesReact: Add useQueryVariable hook [#822](https://github.com/grafana/scenes/pull/822) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.20.1 (Mon Oct 14 2024)

#### 🐛 Bug Fix

- SceneContextObject: Export context object [#925](https://github.com/grafana/scenes/pull/925) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.18.1 (Mon Oct 07 2024)

#### 🐛 Bug Fix

- VizPanel: Fixes issue with viz panel when passing it SceneDataTransformer [#928](https://github.com/grafana/scenes/pull/928) ([@torkelo](https://github.com/torkelo) [@mdvictor](https://github.com/mdvictor))

#### Authors: 2

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))
- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.16.1 (Mon Sep 30 2024)

#### 🐛 Bug Fix

- useQueryRunner: Add more option props [#924](https://github.com/grafana/scenes/pull/924) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.15.0 (Wed Sep 25 2024)

#### 🐛 Bug Fix

- DataProviderProxy: Rename and fix imports [#911](https://github.com/grafana/scenes/pull/911) ([@torkelo](https://github.com/torkelo))
- DataProvideSharer: Add and export DataProviderSharer [#903](https://github.com/grafana/scenes/pull/903) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.13.0 (Wed Sep 04 2024)

### Release Notes

#### UrlSync: Support browser history steps, remove singleton ([#878](https://github.com/grafana/scenes/pull/878))

getUrlSyncManager is no longer exported as UrlSyncManager is now no longer global singleton but local to the UrlSyncContextProvider.
If you called getUrlSyncManager().getUrlState that util function is available via the exported object sceneUtils.

---

#### 🚀 Enhancement

- UrlSync: Support browser history steps, remove singleton [#878](https://github.com/grafana/scenes/pull/878) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.10.2 (Wed Aug 28 2024)

#### 🐛 Bug Fix

- ScenesReact: Add datasource variable [#820](https://github.com/grafana/scenes/pull/820) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.10.1 (Tue Aug 20 2024)

#### 🐛 Bug Fix

- Add query variable in react-scenes [#818](https://github.com/grafana/scenes/pull/818) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.6.2 (Wed Jul 24 2024)

#### 🐛 Bug Fix

- ScenesReact: Add useVariableValue for single values [#821](https://github.com/grafana/scenes/pull/821) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.3.8 (Wed Jul 10 2024)

#### 🐛 Bug Fix

- Add more props + tests to CustomVariable [#817](https://github.com/grafana/scenes/pull/817) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.3.7 (Thu Jul 04 2024)

#### 🐛 Bug Fix

- Dependencies: Bump grafana packages to v11 [#802](https://github.com/grafana/scenes/pull/802) ([@Sergej-Vlasov](https://github.com/Sergej-Vlasov))

#### Authors: 1

- [@Sergej-Vlasov](https://github.com/Sergej-Vlasov)

---

# v5.3.5 (Wed Jul 03 2024)

#### 🐛 Bug Fix

- React scenes: Annotations support [#782](https://github.com/grafana/scenes/pull/782) ([@mdvictor](https://github.com/mdvictor))

#### Authors: 1

- Victor Marin ([@mdvictor](https://github.com/mdvictor))

---

# v5.1.0 (Fri Jun 14 2024)

#### 🐛 Bug Fix

- ScenesReact: Use new react components and hooks from inside existing EmbeddedScenes [#777](https://github.com/grafana/scenes/pull/777) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v5.0.0 (Wed Jun 12 2024)

#### 💥 Breaking Change

- UrlSync: Major refactoring to simplify and make it work better across page routes (for scenes-react use case) [#765](https://github.com/grafana/scenes/pull/765) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.30.0 (Tue Jun 11 2024)

#### 🐛 Bug Fix

- React scenes: Add useDataTransformer hook [#775](https://github.com/grafana/scenes/pull/775) ([@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 1

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))

---

# v4.29.0 (Fri Jun 07 2024)

#### 🐛 Bug Fix

- ScenesReact: Make useVariableValues generic and rename VariableSelect to VariableControl [#778](https://github.com/grafana/scenes/pull/778) ([@torkelo](https://github.com/torkelo))

#### Authors: 1

- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

# v4.24.4 (Wed Jun 05 2024)

#### 🐛 Bug Fix

- PlainReact: Expose scene features through contexts and hooks and normal react components [#734](https://github.com/grafana/scenes/pull/734) ([@torkelo](https://github.com/torkelo) [@oscarkilhed](https://github.com/oscarkilhed))

#### Authors: 2

- Oscar Kilhed ([@oscarkilhed](https://github.com/oscarkilhed))
- Torkel Ödegaard ([@torkelo](https://github.com/torkelo))

---

Work in progress
