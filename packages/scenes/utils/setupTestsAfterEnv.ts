import '@testing-library/jest-dom';

import { toEmitValues } from './test/toEmitValues';
import { toEmitValuesWith } from './test/toEmitValuesWith';

expect.extend({
  toEmitValues,
  toEmitValuesWith,
});
