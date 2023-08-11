const grafanaPrismTheme = {
  plain: {
    color: '#F8F8F2',
    backgroundColor: '#22252b',
  },
  styles: [
    {
      types: ['prolog', 'constant', 'builtin'],
      style: {
        color: '#6E9FFF',
      },
    },
    {
      types: ['inserted', 'function'],
      style: {
        color: '#6CCF8E',
      },
    },
    {
      types: ['deleted'],
      style: {
        color: '#FF5286',
      },
    },
    {
      types: ['changed'],
      style: {
        color: '#fbad37',
      },
    },
    {
      types: ['punctuation', 'symbol'],
      style: {
        color: 'rgb(204, 204, 220)',
      },
    },
    {
      types: ['string', 'char', 'tag', 'selector'],
      style: {
        color: '#FF5286',
      },
    },
    {
      types: ['keyword', 'variable'],
      style: {
        color: '#fbad37',
        fontStyle: 'italic',
      },
    },
    {
      types: ['comment'],
      style: {
        color: 'rgba(204, 204, 220, 0.65)',
      },
    },
    {
      types: ['attr-name'],
      style: {
        color: 'rgb(204, 204, 220)',
      },
    },
  ],
};

module.exports = {
  grafanaPrismTheme,
};
