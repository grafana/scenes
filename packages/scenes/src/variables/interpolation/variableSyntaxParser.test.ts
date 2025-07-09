import { parseVariableSyntax } from './variableSyntaxParser';

describe('parseVariableSyntax', () => {
  it.each`
    input                           | expected
    ${'date'}                       | ${[{ name: 'date', args: [] }]}
    ${'date:iso'}                   | ${[{ name: 'date', args: ['iso'] }]}
    ${'date:custom:YYMMDD'}         | ${[{ name: 'date', args: ['custom', 'YYMMDD'] }]}
    ${'join:" | "'}                 | ${[{ name: 'join', args: [' | '] }]}
    ${'date;join:arg1'}             | ${[{ name: 'date', args: [] }, { name: 'join', args: ['arg1'] }]}
    ${'date:iso;join:arg1'}         | ${[{ name: 'date', args: ['iso'] }, { name: 'join', args: ['arg1'] }]}
    ${'date:iso;join:arg1:arg2'}    | ${[{ name: 'date', args: ['iso'] }, { name: 'join', args: ['arg1', 'arg2'] }]}
    ${'date;join:"ar;g1"'}          | ${[{ name: 'date', args: [] }, { name: 'join', args: ['ar;g1'] }]}
    ${'date:iso;join:"ar;g1":arg2'} | ${[{ name: 'date', args: ['iso'] }, { name: 'join', args: ['ar;g1', 'arg2'] }]}
    ${'join:"ar;g1";date'}          | ${[{ name: 'join', args: ['ar;g1'] }, { name: 'date', args: [] }]}
  `('should parse $input', ({ input, expected }) => {
    expect(parseVariableSyntax(input)).toEqual(expected);
  });

  describe('edge cases and error handling', () => {
    it('should handle empty string', () => {
      expect(parseVariableSyntax('')).toEqual([]);
    });

    it('should handle whitespace-only input', () => {
      expect(parseVariableSyntax('   ')).toEqual([]);
    });

    it('should handle input with only separators', () => {
      expect(parseVariableSyntax('::')).toEqual([]);
      expect(parseVariableSyntax(';;')).toEqual([]);
      expect(parseVariableSyntax('::;;')).toEqual([]);
    });

    it('should handle malformed quotes gracefully', () => {
      expect(() => parseVariableSyntax('formatter:"unclosed')).toThrow(/Unmatched quote/);
      expect(() => parseVariableSyntax("formatter:'unclosed")).toThrow(/Unmatched quote/);
    });

    it('should handle mixed quote types', () => {
      expect(parseVariableSyntax('join:"hello":\'world\'')).toEqual([{ name: 'join', args: ['hello', 'world'] }]);
      expect(parseVariableSyntax('join:\'hello\':"world"')).toEqual([{ name: 'join', args: ['hello', 'world'] }]);
    });
  });

  describe('whitespace handling', () => {
    it('should handle whitespace around formatter names', () => {
      expect(parseVariableSyntax('  date  ')).toEqual([{ name: 'date', args: [] }]);
      expect(parseVariableSyntax('  date  :iso')).toEqual([{ name: 'date', args: ['iso'] }]);
    });

    it('should handle whitespace around arguments', () => {
      expect(parseVariableSyntax('join:  " | "  ')).toEqual([{ name: 'join', args: [' | '] }]);
      expect(parseVariableSyntax('join:  arg1  ')).toEqual([{ name: 'join', args: ['arg1'] }]);
    });

    it('should handle whitespace around separators', () => {
      expect(parseVariableSyntax('date : iso')).toEqual([{ name: 'date', args: ['iso'] }]);
      expect(parseVariableSyntax('date ; join:arg1')).toEqual([
        { name: 'date', args: [] },
        { name: 'join', args: ['arg1'] },
      ]);
    });
  });

  describe('complex quoting scenarios', () => {
    it('should handle empty quoted arguments', () => {
      expect(parseVariableSyntax('join:""')).toEqual([{ name: 'join', args: [''] }]);
      expect(parseVariableSyntax("join:''")).toEqual([{ name: 'join', args: [''] }]);
    });

    it('should handle quotes within unquoted arguments', () => {
      expect(parseVariableSyntax('join:hello"world')).toEqual([{ name: 'join', args: ['hello"world'] }]);
      expect(parseVariableSyntax('join:hello"world:foo')).toEqual([{ name: 'join', args: ['hello"world', 'foo'] }]);
      expect(parseVariableSyntax("join:hello'world")).toEqual([{ name: 'join', args: ["hello'world"] }]);
    });

    it('should handle complex nested scenarios', () => {
      expect(parseVariableSyntax('join:"hello:world";date:iso')).toEqual([
        { name: 'join', args: ['hello:world'] },
        { name: 'date', args: ['iso'] },
      ]);
    });

    it('should handle multiple quoted arguments', () => {
      expect(parseVariableSyntax('join:"arg1":"arg2"')).toEqual([{ name: 'join', args: ['arg1', 'arg2'] }]);
      expect(parseVariableSyntax("join:'arg1':'arg2'")).toEqual([{ name: 'join', args: ['arg1', 'arg2'] }]);
    });
  });

  describe('boundary conditions', () => {
    it('should handle single character formatter names', () => {
      expect(parseVariableSyntax('a')).toEqual([{ name: 'a', args: [] }]);
      expect(parseVariableSyntax('a:b')).toEqual([{ name: 'a', args: ['b'] }]);
    });

    it('should handle single character arguments', () => {
      expect(parseVariableSyntax('formatter:a')).toEqual([{ name: 'formatter', args: ['a'] }]);
      expect(parseVariableSyntax('formatter:"a"')).toEqual([{ name: 'formatter', args: ['a'] }]);
    });

    it('should handle multiple consecutive separators', () => {
      expect(parseVariableSyntax('date:iso:custom:YYMMDD')).toEqual([
        { name: 'date', args: ['iso', 'custom', 'YYMMDD'] },
      ]);
    });

    it('should handle trailing separators', () => {
      expect(parseVariableSyntax('date:')).toEqual([{ name: 'date', args: [] }]);
      expect(parseVariableSyntax('date:iso:')).toEqual([{ name: 'date', args: ['iso'] }]);
      expect(parseVariableSyntax('date;')).toEqual([{ name: 'date', args: [] }]);
    });

    it('should handle leading separators', () => {
      expect(parseVariableSyntax(':date')).toEqual([{ name: 'date', args: [] }]);
      expect(parseVariableSyntax(';date')).toEqual([{ name: 'date', args: [] }]);
    });
  });

  describe('special characters', () => {
    it('should handle special characters in formatter names', () => {
      expect(parseVariableSyntax('formatter-name')).toEqual([{ name: 'formatter-name', args: [] }]);
      expect(parseVariableSyntax('formatter_name')).toEqual([{ name: 'formatter_name', args: [] }]);
      expect(parseVariableSyntax('formatter.name')).toEqual([{ name: 'formatter.name', args: [] }]);
    });

    it('should handle special characters in arguments', () => {
      expect(parseVariableSyntax('join:hello-world')).toEqual([{ name: 'join', args: ['hello-world'] }]);
      expect(parseVariableSyntax('join:hello_world')).toEqual([{ name: 'join', args: ['hello_world'] }]);
      expect(parseVariableSyntax('join:hello.world')).toEqual([{ name: 'join', args: ['hello.world'] }]);
    });

    it('should handle unicode characters', () => {
      expect(parseVariableSyntax('formatter:测试')).toEqual([{ name: 'formatter', args: ['测试'] }]);
      expect(parseVariableSyntax('测试:arg')).toEqual([{ name: '测试', args: ['arg'] }]);
    });

    it('should handle escape sequences', () => {
      expect(parseVariableSyntax('join:"hello\\nworld"')).toEqual([{ name: 'join', args: ['hello\\nworld'] }]);
      expect(parseVariableSyntax('join:"hello\\tworld"')).toEqual([{ name: 'join', args: ['hello\\tworld'] }]);
    });
  });

  describe('empty and invalid cases', () => {
    it('should handle formatter with empty name but arguments', () => {
      expect(parseVariableSyntax(':arg')).toEqual([{ name: 'arg', args: [] }]);
    });

    it('should handle multiple consecutive semicolons', () => {
      expect(parseVariableSyntax('date;;join:arg1')).toEqual([
        { name: 'date', args: [] },
        { name: 'join', args: ['arg1'] },
      ]);
    });

    it('should handle colon without following argument', () => {
      expect(parseVariableSyntax('date:')).toEqual([{ name: 'date', args: [] }]);
      expect(parseVariableSyntax('date:;join:arg1')).toEqual([
        { name: 'date', args: [] },
        { name: 'join', args: ['arg1'] },
      ]);
    });

    it('should handle complex empty scenarios', () => {
      expect(parseVariableSyntax('date:iso:')).toEqual([{ name: 'date', args: ['iso'] }]);
      expect(parseVariableSyntax('date:iso:;join:arg1')).toEqual([
        { name: 'date', args: ['iso'] },
        { name: 'join', args: ['arg1'] },
      ]);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle URL encoding scenarios', () => {
      expect(parseVariableSyntax('urlencode')).toEqual([{ name: 'urlencode', args: [] }]);
      expect(parseVariableSyntax('urlencode;join:&')).toEqual([
        { name: 'urlencode', args: [] },
        { name: 'join', args: ['&'] },
      ]);
    });

    it('should handle date formatting scenarios', () => {
      expect(parseVariableSyntax('date:iso')).toEqual([{ name: 'date', args: ['iso'] }]);
      expect(parseVariableSyntax('date:custom:YYYY-MM-DD')).toEqual([{ name: 'date', args: ['custom', 'YYYY-MM-DD'] }]);
      expect(parseVariableSyntax('date:iso;join:"T"')).toEqual([
        { name: 'date', args: ['iso'] },
        { name: 'join', args: ['T'] },
      ]);
    });

    it('should handle complex multi-formatter chains', () => {
      expect(parseVariableSyntax('date:iso;join:" | ";urlencode')).toEqual([
        { name: 'date', args: ['iso'] },
        { name: 'join', args: [' | '] },
        { name: 'urlencode', args: [] },
      ]);
    });
  });
});
