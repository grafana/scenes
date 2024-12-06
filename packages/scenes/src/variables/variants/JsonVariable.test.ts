import { lastValueFrom } from 'rxjs';
import { JsonStringOptionPrivider, JsonVariable } from './JsonVariable';

describe('JsonVariable', () => {
  describe('When given a json string', () => {
    it('Should parse out an array of objects', async () => {
      const variable = new JsonVariable({
        name: 'env',
        value: 'prod',
        provider: new JsonStringOptionPrivider({
          json: `[
            { "id": 1, "name": "dev", "cluster": "us-dev-1" } ,
            { "id": 2, "name": "prod", "cluster": "us-prod-2" } 
          ]`,
        }),
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue('cluster')).toBe('us-prod-2');
    });
  });
});
