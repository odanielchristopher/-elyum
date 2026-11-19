import { expect } from 'vitest';

export async function jsonResponse(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get('x-request-source')).toBe('evaluation');
  expect(
    response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase(),
  ).toBe('application/json');
  return response.json();
}

export async function applicationError(
  response: Response,
  status: number,
  code: string,
) {
  const body = await jsonResponse(response, status);
  expect(body.code).toBe(code);
  expect(body.message).toEqual(expect.any(String));
  return body;
}

export async function validationError(
  response: Response,
  errors: Array<{ field: string; code: string }>,
) {
  const body = await applicationError(response, 400, 'VALIDATION_ERROR');
  // Messages outside B3 are required, but their text is not normative.
  expect(
    body.errors.map(
      (item: { field: string; code: string; message: string }) => {
        expect(item.message).toEqual(expect.any(String));
        expect(Object.keys(item).sort()).toEqual(['code', 'field', 'message']);
        return { field: item.field, code: item.code };
      },
    ),
  ).toEqual(errors);
}

export function byId<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}
