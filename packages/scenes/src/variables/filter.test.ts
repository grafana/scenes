import { fuzzyFind } from './filter';

describe('filter', () => {
  it('should properly rank by match quality', () => {
    const needle = 'C';

    const stringOptions = ['A', 'AA', 'AB', 'AC', 'BC', 'C', 'CD'];
    const options = stringOptions.map((value) => ({ value }));

    const matches = fuzzyFind(options, stringOptions, needle);

    expect(matches.map((m) => m.value)).toEqual(['C', 'CD', 'AC', 'BC']);
  });

  it('orders by match quality and case sensitivity', () => {
    const stringOptions = [
      'client_service_namespace',
      'namespace',
      'alert_namespace',
      'container_namespace',
      'Namespace',
      'client_k8s_namespace_name',
      'foobar',
    ];
    const options = stringOptions.map((value) => ({ value }));

    const matches = fuzzyFind(options, stringOptions, 'Names');

    expect(matches.map((m) => m.value)).toEqual([
      'Namespace',
      'namespace',
      'alert_namespace',
      'container_namespace',
      'client_k8s_namespace_name',
      'client_service_namespace',
    ]);
  });

  describe('non-ascii', () => {
    it('should do substring match when needle is non-latin', () => {
      const needle = '水';

      const stringOptions = ['A水', 'AA', 'AB', 'AC', 'BC', 'C', 'CD'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      expect(matches.map((m) => m.value)).toEqual(['A水']);
    });

    it('second case for non-latin characters', () => {
      const stringOptions = ['台灣省', '台中市', '台北市', '台南市', '南投縣', '高雄市', '台中第一高級中學'];

      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, '南');

      expect(matches.map((m) => m.value)).toEqual(['台南市', '南投縣']);
    });
  });

  describe('operators', () => {
    it('should do substring match when needle is only symbols', () => {
      const needle = '=';

      const stringOptions = ['=', '<=', '>', '!~'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      expect(matches.map((m) => m.value)).toEqual(['=', '<=']);
    });
  });

  describe('special characters in needle', () => {
    it('should fall back to substring match when needle contains @ symbol', () => {
      const needle = 'foo@bar';

      const stringOptions = ['foo@bar.com', 'foobar', 'foo@baz', 'test@bar', 'other'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      // Should only match strings that contain the exact substring 'foo@bar'
      expect(matches.map((m) => m.value)).toEqual(['foo@bar.com']);
    });

    it('should fall back to substring match when needle contains # symbol', () => {
      const needle = 'issue#123';

      const stringOptions = ['issue#123', 'issue#1234', 'issue123', 'issue#12', 'other'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      // Should match strings containing 'issue#123'
      expect(matches.map((m) => m.value)).toEqual(['issue#123', 'issue#1234']);
    });

    it('should fall back to substring match when needle contains / symbol', () => {
      const needle = 'src/components';

      const stringOptions = ['src/components/Button', 'src/components', 'srccomponents', 'src/utils', 'other'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      // Should match strings containing 'src/components'
      expect(matches.map((m) => m.value)).toEqual(['src/components/Button', 'src/components']);
    });

    it('should fall back to substring match when needle contains $ symbol', () => {
      const needle = '$var';

      const stringOptions = ['$variable', '$var', 'var', '$other', 'some$var'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      // Should match strings containing '$var'
      expect(matches.map((m) => m.value)).toEqual(['$variable', '$var', 'some$var']);
    });

    it('should still do fuzzy match when needle has no special characters', () => {
      const needle = 'foobar';

      const stringOptions = ['foobar', 'foo_bar', 'foobarbaz', 'fo_ob_ar', 'other'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      // Fuzzy matching should find matches with characters in order
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.map((m) => m.value)).toContain('foobar');
    });

    it('should handle mixed special characters in needle', () => {
      const needle = 'user@example.com';

      const stringOptions = ['user@example.com', 'userexamplecom', 'user@example.org', 'other'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      // Should only match exact substring
      expect(matches.map((m) => m.value)).toEqual(['user@example.com']);
    });

    it('should fall back to substring match when needle contains backslash', () => {
      const needle = 'path\\to';

      const stringOptions = ['path\\to\\file', 'path\\to', 'pathto', 'other\\path'];
      const options = stringOptions.map((value) => ({ value }));

      const matches = fuzzyFind(options, stringOptions, needle);

      // Should match strings containing 'path\to'
      expect(matches.map((m) => m.value)).toEqual(['path\\to\\file', 'path\\to']);
    });
  });
});
