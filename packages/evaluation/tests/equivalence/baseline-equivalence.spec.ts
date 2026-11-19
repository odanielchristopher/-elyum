import { describe, expect, it } from 'vitest';

import {
  B2_BODY,
  B2_INPUT,
  B3_BODY,
  B3_INPUT,
  VARIANTS,
} from '../fixtures/baseline.fixture';
import { request, withApplication } from '../helpers/application.helper';

const cases = [
  {
    name: 'B1',
    method: 'GET',
    route: '/health',
    input: undefined,
    status: 200,
    body: { status: 'ok', version: '0.1.0' },
  },
  {
    name: 'B2',
    method: 'POST',
    route: '/orders/preview',
    input: B2_INPUT,
    status: 200,
    body: B2_BODY,
  },
  {
    name: 'B3',
    method: 'POST',
    route: '/orders/preview',
    input: B3_INPUT,
    status: 400,
    body: B3_BODY,
  },
];

describe('baseline raw HTTP equivalence', () => {
  it.each(cases)(
    'should return identical normative bytes and headers for $name',
    async (scenario) => {
      const responses: Array<{
        status: number;
        contentType: string | undefined;
        source: string | null;
        body: string;
      }> = [];
      for (const variant of VARIANTS) {
        await withApplication(variant, async (url) => {
          const response = await request(
            url,
            scenario.route,
            scenario.method,
            scenario.input,
          );
          const result = {
            status: response.status,
            contentType: response.headers
              .get('content-type')
              ?.split(';')[0]
              ?.trim()
              .toLowerCase(),
            source: response.headers.get('x-request-source'),
            body: await response.text(),
          };
          expect(result).toEqual({
            status: scenario.status,
            contentType: 'application/json',
            source: 'evaluation',
            body: JSON.stringify(scenario.body),
          });
          responses.push(result);
        });
      }
      for (const response of responses) expect(response).toEqual(responses[0]);
    },
  );
});
