import { VARIABLE_REGEX } from './constants';

interface ParsedVariableMatch {
  match: string;
  var1?: string;
  var2?: string;
  fmt2?: string;
  var3?: string;
  fieldPath?: string;
  fmt3?: string;
}

function matchOne(input: string): ParsedVariableMatch | null {
  VARIABLE_REGEX.lastIndex = 0;
  const result = VARIABLE_REGEX.exec(input);

  if (!result) {
    return null;
  }

  const [match, var1, var2, fmt2, var3, fieldPath, fmt3] = result;
  return { match, var1, var2, fmt2, var3, fieldPath, fmt3 };
}

describe('VARIABLE_REGEX', () => {
  it('matches legacy $var form', () => {
    expect(matchOne('$var')).toMatchObject({ match: '$var', var1: 'var' });
  });

  it('matches legacy [[var]] form', () => {
    expect(matchOne('[[var]]')).toMatchObject({ match: '[[var]]', var2: 'var' });
  });

  it('matches legacy [[var:fmt]] form', () => {
    expect(matchOne('[[var:fmt]]')).toMatchObject({ match: '[[var:fmt]]', var2: 'var', fmt2: 'fmt' });
  });

  it('matches whole-variable ${var} form', () => {
    expect(matchOne('${var}')).toMatchObject({ match: '${var}', var3: 'var', fieldPath: '' });
  });

  it('matches dot-path ${var.field} keeping the leading dot in the capture', () => {
    expect(matchOne('${var.field}')).toMatchObject({ match: '${var.field}', var3: 'var', fieldPath: '.field' });
  });

  it('matches numeric dot-path ${var.1}', () => {
    expect(matchOne('${var.1}')).toMatchObject({ match: '${var.1}', var3: 'var', fieldPath: '.1' });
  });

  it('matches chained dot-path ${var.a.b}', () => {
    expect(matchOne('${var.a.b}')).toMatchObject({ match: '${var.a.b}', var3: 'var', fieldPath: '.a.b' });
  });

  it('matches double-quoted bracket key ${filters["env"]}', () => {
    expect(matchOne('${filters["env"]}')).toMatchObject({
      match: '${filters["env"]}',
      var3: 'filters',
      fieldPath: '["env"]',
    });
  });

  it("matches single-quoted bracket key ${filters['env']}", () => {
    expect(matchOne("${filters['env']}")).toMatchObject({
      match: "${filters['env']}",
      var3: 'filters',
      fieldPath: "['env']",
    });
  });

  it('matches bracket key with dots and spaces ${filters["a.b c"]}', () => {
    expect(matchOne('${filters["a.b c"]}')).toMatchObject({
      match: '${filters["a.b c"]}',
      var3: 'filters',
      fieldPath: '["a.b c"]',
    });
  });

  it('matches bracket key with operator accessor ${filters["env"].operator}', () => {
    expect(matchOne('${filters["env"].operator}')).toMatchObject({
      match: '${filters["env"].operator}',
      var3: 'filters',
      fieldPath: '["env"].operator',
    });
  });

  it('matches bracket key with a formatter ${filters["env"]:json}', () => {
    expect(matchOne('${filters["env"]:json}')).toMatchObject({
      match: '${filters["env"]:json}',
      var3: 'filters',
      fieldPath: '["env"]',
      fmt3: 'json',
    });
  });

  it('matches chained bracket keys ${filters["a"]["b"]}', () => {
    expect(matchOne('${filters["a"]["b"]}')).toMatchObject({
      match: '${filters["a"]["b"]}',
      var3: 'filters',
      fieldPath: '["a"]["b"]',
    });
  });

  it('matches legacy unquoted bracket index in a dot-path ${__data.fields[1]}', () => {
    expect(matchOne('${__data.fields[1]}')).toMatchObject({
      match: '${__data.fields[1]}',
      var3: '__data',
      fieldPath: '.fields[1]',
    });
  });

  it('matches mixed dot, unquoted index and quoted key ${__data.fields["CoolNumber"].text}', () => {
    expect(matchOne('${__data.fields["CoolNumber"].text}')).toMatchObject({
      match: '${__data.fields["CoolNumber"].text}',
      var3: '__data',
      fieldPath: '.fields["CoolNumber"].text',
    });
  });

  it('resolves long repeated bracket / dot field paths in bounded time (no catastrophic backtracking)', () => {
    const longBracket = `\${filters${'["x"]'.repeat(2000)}}`;
    const longDot = `\${filters${'.x'.repeat(2000)}}`;

    const start = Date.now();
    expect(matchOne(longBracket)).toMatchObject({ var3: 'filters' });
    expect(matchOne(longDot)).toMatchObject({ var3: 'filters' });
    // Bounded-time guard: linear matching completes near-instantly. 1s is a generous ceiling.
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
