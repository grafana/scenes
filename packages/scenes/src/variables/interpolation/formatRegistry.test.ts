import { AdHocFiltersVariable } from '../adhoc/AdHocFiltersVariable';
import { VariableValue } from '../types';
import { TestVariable } from '../variants/TestVariable';

import { formatRegistry } from './formatRegistry';
import { VariableFormatID } from '@grafana/schema';

function formatValue<T extends VariableValue>(
  formatId: VariableFormatID,
  value: T,
  text?: string,
  args: string[] = []
): string {
  const variable = new TestVariable({ name: 'server', value, text });
  return formatRegistry.get(formatId).formatter(value, args, variable);
}

describe('formatRegistry', () => {
  it('Can format values according to format', () => {
    expect(formatValue(VariableFormatID.Lucene, 'foo bar')).toBe('foo\\ bar');
    expect(formatValue(VariableFormatID.Lucene, '-1')).toBe('-1');
    expect(formatValue(VariableFormatID.Lucene, '-test')).toBe('\\-test');
    expect(formatValue(VariableFormatID.Lucene, ['foo bar', 'baz'])).toBe('("foo\\ bar" OR "baz")');
    expect(formatValue(VariableFormatID.Lucene, [])).toBe('__empty__');

    expect(formatValue(VariableFormatID.Glob, 'foo')).toBe('foo');
    expect(formatValue(VariableFormatID.Glob, ['AA', 'BB', 'C.*'])).toBe('{AA,BB,C.*}');

    expect(formatValue(VariableFormatID.Text, 'v', 'display text')).toBe('display text');

    expect(formatValue(VariableFormatID.Raw, [12, 13])).toBe('12,13');
    expect(formatValue(VariableFormatID.Raw, '#Æ³ ̇¹"Ä1"#!"#!½')).toBe('#Æ³ ̇¹"Ä1"#!"#!½');

    expect(formatValue(VariableFormatID.Regex, 'test.')).toBe('test\\.');
    expect(formatValue(VariableFormatID.Regex, ['test.'])).toBe('test\\.');
    expect(formatValue(VariableFormatID.Regex, ['test.', 'test2'])).toBe('(test\\.|test2)');

    expect(formatValue(VariableFormatID.Pipe, ['test', 'test2'])).toBe('test|test2');

    expect(formatValue(VariableFormatID.Distributed, ['test'])).toBe('test');
    expect(formatValue(VariableFormatID.Distributed, ['test', 'test2'])).toBe('test,server=test2');

    expect(formatValue(VariableFormatID.CSV, 'test')).toBe('test');
    expect(formatValue(VariableFormatID.CSV, ['test', 'test2'])).toBe('test,test2');

    expect(formatValue(VariableFormatID.HTML, '<script>alert(asd)</script>')).toBe(
      '&lt;script&gt;alert(asd)&lt;/script&gt;'
    );

    expect(formatValue(VariableFormatID.JSON, ['test', 12])).toBe('["test",12]');
    expect(formatValue(VariableFormatID.JSON, 'test')).toBe('test');

    expect(formatValue(VariableFormatID.PercentEncode, ['foo()bar BAZ', 'test2'])).toBe(
      '%7Bfoo%28%29bar%20BAZ%2Ctest2%7D'
    );

    expect(formatValue(VariableFormatID.SingleQuote, 'test')).toBe(`'test'`);
    expect(formatValue(VariableFormatID.SingleQuote, ['test', `test'2`])).toBe("'test','test\\'2'");

    expect(formatValue(VariableFormatID.DoubleQuote, 'test')).toBe(`"test"`);
    expect(formatValue(VariableFormatID.DoubleQuote, ['test', `test"2`])).toBe('"test","test\\"2"');

    expect(formatValue(VariableFormatID.SQLString, "test'value")).toBe(`'test''value'`);
    expect(formatValue(VariableFormatID.SQLString, 'test"value')).toBe(`'test\\"value'`);
    expect(formatValue(VariableFormatID.SQLString, ['test', "test'value2"])).toBe(`'test','test''value2'`);
    expect(formatValue(VariableFormatID.SQLString, ['test', "test'value2", 'test"value3'])).toBe(
      `'test','test''value2','test\\"value3'`
    );

    expect(formatValue(VariableFormatID.Date, 1594671549254)).toBe('2020-07-13T20:19:09.254Z');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['seconds'])).toBe('1594671549');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['iso'])).toBe('2020-07-13T20:19:09.254Z');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['YYYY-MM'])).toBe('2020-07');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['YYYY-MM', 'ss'])).toBe('2020-07:09');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['YYYY', 'MM', 'DD'])).toBe('2020:07:13');

    // @ts-expect-error join not in depended @grafana/schema yet
    expect(formatValue('join', 'hello', 'text', undefined)).toBe('hello'); // handles non-arrays
    // @ts-expect-error
    expect(formatValue('join', ['hello'], 'text', undefined)).toBe('hello'); // handles arrays of 1 length
    // @ts-expect-error
    expect(formatValue('join', ['hello', 'world'], 'text', undefined)).toBe('hello,world'); // has a default separator
    // @ts-expect-error
    expect(formatValue('join', ['hello', 'world'], 'text', [' | '])).toBe('hello | world'); // has a custom separator

    // customqueryparam - multi-array values
    // @ts-expect-error customqueryparam not in depended @grafana/schema yet
    expect(formatValue('customqueryparam', ['api', 'database'], 'text', undefined)).toBe('server=api&server=database'); // default name
    // @ts-expect-error
    expect(formatValue('customqueryparam', ['api', 'database'], 'text', ['p-server'])).toBe(
      'p-server=api&p-server=database'
    ); // custom name
    // @ts-expect-error
    expect(formatValue('customqueryparam', ['api', 'database'], 'text', ['p-server', 'v-'])).toBe(
      'p-server=v-api&p-server=v-database'
    ); // value prefix

    // customqueryparam - multi-array values
    // @ts-expect-error
    expect(formatValue('customqueryparam', ['api'], 'text', undefined)).toBe('server=api'); // default name
    // @ts-expect-error
    expect(formatValue('customqueryparam', ['api'], 'text', ['p-server'])).toBe('p-server=api'); // custom name, optional value
    // @ts-expect-error
    expect(formatValue('customqueryparam', ['api'], 'text', ['p-server', 'v-'])).toBe('p-server=v-api'); // value prefix

    // customqueryparam - string values
    // @ts-expect-error
    expect(formatValue('customqueryparam', 'api', 'text', undefined)).toBe('server=api'); // default name
    // @ts-expect-error
    expect(formatValue('customqueryparam', 'api', 'text', ['p-server'])).toBe('p-server=api'); // custom name, optional value
    // @ts-expect-error
    expect(formatValue('customqueryparam', 'api', 'text', ['p-server', 'v-'])).toBe('p-server=v-api'); // value prefix

    // customqueryparam - url encoding
    // @ts-expect-error
    expect(formatValue('customqueryparam', ['mysql&postgres', 'databases!'], 'text', ['p-server', 'v-'])).toBe(
      'p-server=v-mysql%26postgres&p-server=v-databases%21'
    ); // variable value encoded
    expect(
      // @ts-expect-error
      formatValue('customqueryparam', ['mysql&postgres', 'databases!'], 'text', ['space & ampersand!', 'v& '])
    ).toBe('space%20%26%20ampersand%21=v%26%20mysql%26postgres&space%20%26%20ampersand%21=v%26%20databases%21'); // custom name + prefix encoded

    expect(formatValue(VariableFormatID.UriEncode, '/any-path/any-second-path?query=foo()bar BAZ')).toBe(
      '/any-path/any-second-path?query=foo%28%29bar%20BAZ'
    );
  });

  describe('queryparam', () => {
    it('should url encode value', () => {
      const result = formatValue(VariableFormatID.QueryParam, 'helloAZ%=');
      expect(result).toBe('var-server=helloAZ%25%3D');
    });

    it('should use fieldPath when provided', () => {
      const variable = new AdHocFiltersVariable({});

      const result = formatRegistry
        .get(VariableFormatID.QueryParam)
        .formatter(['key1=val1', 'key5=val5'], [], variable, 'originFilters');
      expect(result).toBe('var-Filters=key1%3Dval1&var-Filters=key5%3Dval5');
    });

    it('should use variable url sync handler', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [
          { key: 'key1', operator: '=', value: 'val1' },
          { key: 'key2', operator: '=~', value: 'val2' },
        ],
      });

      const result = formatRegistry.get(VariableFormatID.QueryParam).formatter('asd', [], variable);
      expect(result).toBe('var-Filters=key1%7C%3D%7Cval1&var-Filters=key2%7C%3D~%7Cval2');
    });
  });
});
