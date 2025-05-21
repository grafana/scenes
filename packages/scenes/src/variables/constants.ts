export const ALL_VARIABLE_TEXT = 'All';
export const ALL_VARIABLE_VALUE = '$__all';
export const NONE_VARIABLE_TEXT = 'None';
export const NONE_VARIABLE_VALUE = '';
export const AUTO_VARIABLE_TEXT = 'Auto';
export const AUTO_VARIABLE_VALUE = '$__auto';

// Grafana core source: https://github.com/grafana/grafana/blob/main/public/app/features/variables/utils.ts#L23
/*
 * This regex matches 3 types of variable reference with an optional format specifier
 * \$(\w+)                          $var1
 * \[\[(\w+?)(?::(\w+))?\]\]        [[var2]] or [[var2:fmt2]]
 * \${(\w+)(?::(\w+))?}             ${var3} or ${var3:fmt3}
 */
export const VARIABLE_REGEX = /\$(\w+)|\[\[(\w+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/g;
export const SEARCH_FILTER_VARIABLE = '__searchFilter';
export const SCOPES_VARIABLE_NAME = '__scopes';
