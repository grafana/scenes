interface VariableFormatter {
  name: string;
  args: string[];
}

/** Parses a format section from a variable.
 *
 * Should support:
 *  - just format name e.g. `urlencode`
 *  - format name and args e.g. `date:ios`
 *  - format name and multiple args e.g. `date:custom:YYMMDD`
 *  - format name and quoted args e.g. `join:" | "`
 *  - multiple format chains separated by ; e.g. `urlencode;join:arg1`
 *  - multiple format chains separated by ;, with semi colon in quotes e.g. `urlencode;join:"ar;g1"`
 */
export function parseVariableSyntax(input: string): VariableFormatter[] {
  const formatters: VariableFormatter[] = [];
  let index = 0;
  let currentFormatter: VariableFormatter | null = null;

  while (index < input.length) {
    // Start new formatter if needed
    if (!currentFormatter) {
      currentFormatter = {
        name: '',
        args: [],
      };
    }

    // Skip whitespace
    while (index < input.length && input[index] === ' ') {
      index++;
    }

    // Handle quoted arguments. Only arguments can ever be in quotes
    if (input[index] === '"' || input[index] === "'") {
      const quote = input[index];
      let arg = '';
      index++; // Skip opening quote

      while (index < input.length && input[index] !== quote) {
        arg += input[index];
        index++;
      }

      if (index >= input.length) {
        throw new Error(`Unmatched quote (${quote}) in variable syntax`);
      }

      index++; // Skip closing quote

      currentFormatter.args.push(arg); // do not trim whitespace inside quoted arguments
      continue;
    }

    // Handle semicolon - this is after the quotes check, so this is the end of the current formatter
    if (input[index] === ';') {
      if (currentFormatter.name) {
        formatters.push(currentFormatter);
      }
      currentFormatter = null;
      index++;
      continue;
    }

    // Skip colon here - it's handled as the seperator between name + arguments in the following check
    if (input[index] === ':') {
      index++;
      continue;
    }

    // Build format name or argument
    if (currentFormatter.name) {
      // If we already have a name build an argument until the : or ;
      let arg = '';
      while (index < input.length && input[index] !== ':' && input[index] !== ';') {
        if (input[index] !== ' ') {
          arg += input[index];
        }
        index++;
      }

      if (arg) {
        currentFormatter.args.push(arg.trim()); // whitespace on unquoted arguments is insignificant
      }
    } else {
      // If we don't have a name, build a name until the : or ;
      let name = '';
      while (index < input.length && input[index] !== ':' && input[index] !== ';') {
        name += input[index];
        index++;
      }

      if (name) {
        currentFormatter.name = name.trim(); // whitespace on names is insignificant
      }
    }
  }

  // Add final formatter
  if (currentFormatter?.name) {
    formatters.push(currentFormatter);
  }

  return formatters;
}
