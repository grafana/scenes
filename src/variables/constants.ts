export const ALL_VARIABLE_TEXT = 'All';
export const ALL_VARIABLE_VALUE = '$__all';
export const NONE_VARIABLE_TEXT = 'None';
export const NONE_VARIABLE_VALUE = '';

// Grafana core source: https://github.com/grafana/grafana/blob/main/public/app/features/variables/utils.ts#L23
/*
 * This regex matches 3 types of variable reference with an optional format specifier
 * \$(\w+)                          $var1
 * \[\[(\w+?)(?::(\w+))?\]\]        [[var2]] or [[var2:fmt2]]
 * \${(\w+)(?::(\w+))?}             ${var3} or ${var3:fmt3}
 */
export const VARIABLE_REGEX = /\$(\w+)|\[\[(\w+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/g;
