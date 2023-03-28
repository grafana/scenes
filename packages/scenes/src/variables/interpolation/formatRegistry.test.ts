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
      '&lt;script&gt;alert(asd)&lt;&#47;script&gt;'
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
    expect(formatValue(VariableFormatID.SQLString, ['test', "test'value2"])).toBe(`'test','test''value2'`);

    expect(formatValue(VariableFormatID.Date, 1594671549254)).toBe('2020-07-13T20:19:09.254Z');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['seconds'])).toBe('1594671549');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['iso'])).toBe('2020-07-13T20:19:09.254Z');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['YYYY-MM'])).toBe('2020-07');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['YYYY-MM', 'ss'])).toBe('2020-07:09');
    expect(formatValue(VariableFormatID.Date, 1594671549254, 'text', ['YYYY', 'MM', 'DD'])).toBe('2020:07:13');
  });
});
