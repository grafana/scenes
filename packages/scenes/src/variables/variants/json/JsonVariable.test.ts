import { lastValueFrom } from 'rxjs';
import { JsonVariable } from './JsonVariable';
import { JsonVariableOptionProviders } from './JsonVariableOptionProviders';

describe('JsonVariable', () => {
  describe('fromString', () => {
    it('Should parse out an array of objects', async () => {
      const variable = new JsonVariable({
        name: 'env',
        value: 'prod',
        provider: JsonVariableOptionProviders.fromString({
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

  describe('fromObjectArray', () => {
    it('Should get options', async () => {
      const variable = new JsonVariable({
        name: 'env',
        value: 'prod',
        provider: JsonVariableOptionProviders.fromObjectArray({
          options: [
            { id: 1, name: 'dev', cluster: 'us-dev-1' },
            { id: 2, name: 'prod', cluster: 'us-prod-2' },
          ],
        }),
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue('cluster')).toBe('us-prod-2');
    });
  });
});
