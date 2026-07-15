import { PanelProps } from '@grafana/data';
import type { VizPanel } from './VizPanel';

/**
 * A bidirectional type test that asserts that the `onFieldConfigChange` definition from grafana/data matches the implementation in scenes
 * Is this maintainable? or folly ravings of a madman??
 * No, and probably, but I'm hoping it can lead to finding a better way to prevent drift between scenes and grafana.
 *
 * Problem:
 * Scenes has the implementation, but @grafana/data has the types, there's currently nothing preventing drift.
 * i.e. @grafana/data doesn't import scenes, so scenes cannot expose VizPanel from the runtime definitions for PanelProps to consume.
 * Although the inverse, having Scenes' VizPanel implement an interface to conform to the @grafana/data PanelProps would "work",
 * it wouldn't catch bugs like https://github.com/grafana/grafana/pull/128438, because a widening of types is always allowed under TypeScript's assignability rules
 * (see https://github.com/microsoft/TypeScript-New-Handbook/blob/master/reference/Assignability.md if you're that type of sicko)
 *
 * So armed with a naive idealism and overeagerness to not just ignore the problem, we use a bit of ts magic to create a
 * test that asserts that this specific function's implementation will not drift from its definition.
 *
 */

// Boolean that evaluates if A is identical to B
type Expect<T extends true> = T;
// Boolean that evaluates if A is assignable to B
type Assignable<A, B> = A extends B ? true : false;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
// Type assertion that will throw a type error if T evaluates to false

// @todo remove the following lines before this is ready for review
// Replace GrafanaOnFieldConfigChange with TestUpdatedGrafanaOnFieldConfigChange and this file should no longer throw a type error
// type TestUpdatedGrafanaOnFieldConfigChange = (config: FieldConfigSource, replace?: boolean) => void;
// type GrafanaOnFieldConfigChange = TestUpdatedGrafanaOnFieldConfigChange;

type GrafanaOnFieldConfigChange = PanelProps['onFieldConfigChange'];
type SceneOnFieldConfigChange = VizPanel['onFieldConfigChange'];

type GrafanaOnFieldConfigChangeParams = Parameters<GrafanaOnFieldConfigChange>;
type SceneOnFieldConfigChangeParams = Parameters<SceneOnFieldConfigChange>;

type GrafanaOnFieldConfigChangeReplaceArg = GrafanaOnFieldConfigChangeParams[1];
type SceneOnFieldConfigChangeReplaceArg = SceneOnFieldConfigChangeParams[1];

// Exported so `noUnusedLocals` treats them as used; they exist purely to fail typecheck on drift.
export type OnFieldConfigChangeContract = [
  // Arity must match: both are (config, replace?) => void.
  Expect<Equal<GrafanaOnFieldConfigChangeParams['length'], SceneOnFieldConfigChangeParams['length']>>,
  // Return type parity.
  Expect<Equal<ReturnType<GrafanaOnFieldConfigChange>, ReturnType<SceneOnFieldConfigChange>>>,

  // arg0 (config) is intentionally not exact-checked: scenes accepts a generic variant
  // while PanelProps uses FieldConfigSource. Instead we assert only that what a plugin may pass is accepted by the runtime
  Expect<Assignable<Parameters<GrafanaOnFieldConfigChange>[0], Parameters<SceneOnFieldConfigChange>[0]>>,

  // Assert that the `replace` flag is in sync (this is what drifted in #128438).
  // @todo This is expected to fail until https://github.com/grafana/grafana/pull/128438 is merged
  Expect<Equal<GrafanaOnFieldConfigChangeReplaceArg, SceneOnFieldConfigChangeReplaceArg>>
];

test('onFieldConfigChange type contract compiles', () => {
  // Add an assertion to keep empty test linting rules from complaining about this test
  expect(true).toBe(true);
});
