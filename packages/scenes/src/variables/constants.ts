export const ALL_VARIABLE_TEXT = 'All';
export const ALL_VARIABLE_VALUE = '$__all';
export const NONE_VARIABLE_TEXT = 'None';
export const NONE_VARIABLE_VALUE = '';
export const AUTO_VARIABLE_TEXT = 'Auto';
export const AUTO_VARIABLE_VALUE = '$__auto';

// Grafana core source: https://github.com/grafana/grafana/blob/main/public/app/features/variables/utils.ts#L23
/*
 * This regex matches 3 types of variable reference with an optional field path and format specifier
 * \$(\w+)                          $var1
 * \[\[(\w+?)(?::(\w+))?\]\]        [[var2]] or [[var2:fmt2]]
 * \${(\w+)(fieldPath)?(:fmt3)?}    ${var3}, ${var3.field}, ${var3["key"]}, ${var3["key"].operator}, ${var3:fmt3}
 *
 * The fieldPath capture (group 5) is a `*`-repeated sequence of four mutually exclusive,
 * first-character-anchored alternatives:
 *   \.[^:^{}\[\]]+   a legacy dot segment (.field, .1, .a.b). Excludes { } [ ] so it can never
 *                    swallow a bracket segment or a brace; it still includes the leading dot.
 *   \["[^"]*"\]      a double-quoted bracket key. The body allows dots, spaces, =, |, etc.
 *   \['[^']*'\]      the single-quoted variant.
 *   \[[^\]"']*\]     an unquoted bracket index/key (`[0]`, `[1]`). Preserves the legacy data-macro
 *                    forms (`${__data.fields[1]}`, `${__data.fields[0].text}`) that the old regex
 *                    matched as part of a permissive dot segment.
 * Because the dot alternative keeps its leading `.`, the captured fieldPath for the legacy
 * `${var.field}` form is `.field` (not `field`); sceneInterpolator strips one leading `.` so
 * downstream consumers (getValue / getFieldAccessor) see the same string as before. Bracket
 * keys (`["env"]`, `["env"].operator`) are passed through untouched.
 */
export const VARIABLE_REGEX =
  /\$(\w+)|\[\[(\w+?)(?::(\w+))?\]\]|\${(\w+)((?:\.[^:^{}\[\]]+|\["[^"]*"\]|\['[^']*'\]|\[[^\]"']*\])*)(?::([^}]+))?}/g;
export const SEARCH_FILTER_VARIABLE = '__searchFilter';
export const SCOPES_VARIABLE_NAME = '__scopes';
