const { z } = require('zod');
const validate = require('../../src/middleware/validate');

function run(schema, req) {
  const next = jest.fn();
  validate(schema)(req, {}, next);
  return next;
}

describe('validate middleware', () => {
  const bodySchema = z.object({
    body: z.object({
      name: z.string(),
      role: z.string().default('viewer'),
    }),
  });

  it('replaces req.body with parsed output, stripping undeclared fields', () => {
    const req = {
      body: { name: 'a', usageCount: 9999, isAdmin: true },
      query: {},
      params: {},
    };
    const next = run(bodySchema, req);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'a', role: 'viewer' });
  });

  it('leaves req.query and req.params untouched when the schema does not declare them', () => {
    const req = {
      body: { name: 'a' },
      query: { page: '2' },
      params: { id: 'abc' },
    };
    run(bodySchema, req);

    expect(req.query).toEqual({ page: '2' });
    expect(req.params).toEqual({ id: 'abc' });
  });

  it('replaces req.query with parsed output when the schema declares it', () => {
    const schema = z.object({
      query: z.object({ email: z.string().email().optional() }),
    });
    const req = {
      body: {},
      query: { email: 'A@B.com', $where: 'sleep(1000)' },
      params: {},
    };
    run(schema, req);

    expect(req.query).toEqual({ email: 'A@B.com' });
  });

  it('rejects invalid input with a 400 error and does not mutate the request', () => {
    const req = {
      body: { name: 123, extra: true },
      query: {},
      params: {},
    };
    const next = run(bodySchema, req);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(req.body).toEqual({ name: 123, extra: true });
  });
});
