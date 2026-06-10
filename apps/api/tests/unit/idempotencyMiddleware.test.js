jest.mock('../../src/models/IdempotencyKey');
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const IdempotencyKey = require('../../src/models/IdempotencyKey');
const idempotencyMiddleware = require('../../src/middleware/idempotency');

function flushAsync() {
  return new Promise((resolve) => setImmediate(resolve));
}

function makeReqRes(key = 'test-key-1') {
  const req = {
    id: 'req-1',
    get: (name) => (name.toLowerCase() === 'idempotency-key' ? key : undefined),
  };
  const sent = { body: undefined, statusCode: undefined };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      sent.statusCode = code;
      return this;
    },
    json(body) {
      sent.body = body;
      sent.statusCode = this.statusCode;
      return this;
    },
  };
  return { req, res, sent };
}

describe('idempotency middleware response persistence (AD-3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: we win the reservation.
    IdempotencyKey.create.mockResolvedValue({});
  });

  it('awaits the completed write before sending a 2xx response', async () => {
    let resolvePersist;
    IdempotencyKey.findOneAndUpdate.mockReturnValue(
      new Promise((resolve) => {
        resolvePersist = resolve;
      })
    );

    const { req, res, sent } = makeReqRes();
    await idempotencyMiddleware(req, res, jest.fn());

    res.json({ ok: true });
    await flushAsync();
    expect(sent.body).toBeUndefined(); // persistence still pending — nothing sent yet

    resolvePersist({});
    await flushAsync();
    expect(sent.body).toEqual({ ok: true });
    expect(IdempotencyKey.findOneAndUpdate).toHaveBeenCalledWith(
      { key: { $eq: 'test-key-1' } },
      { status: 'completed', statusCode: 200, response: { ok: true } }
    );
    expect(IdempotencyKey.deleteOne).not.toHaveBeenCalled();
  });

  it('releases the reservation and still responds when the completed write fails', async () => {
    IdempotencyKey.findOneAndUpdate.mockRejectedValue(new Error('db down'));
    IdempotencyKey.deleteOne.mockResolvedValue({});

    const { req, res, sent } = makeReqRes();
    await idempotencyMiddleware(req, res, jest.fn());

    res.json({ ok: true });
    await flushAsync();

    expect(IdempotencyKey.deleteOne).toHaveBeenCalledWith({ key: { $eq: 'test-key-1' } });
    expect(sent.body).toEqual({ ok: true }); // client still gets the success response
  });

  it('still responds when both the completed write and the release fail (TTL backstop)', async () => {
    IdempotencyKey.findOneAndUpdate.mockRejectedValue(new Error('db down'));
    IdempotencyKey.deleteOne.mockRejectedValue(new Error('db still down'));

    const { req, res, sent } = makeReqRes();
    await idempotencyMiddleware(req, res, jest.fn());

    res.json({ ok: true });
    await flushAsync();

    expect(sent.body).toEqual({ ok: true });
  });

  it('releases the reservation before sending a non-2xx response', async () => {
    IdempotencyKey.deleteOne.mockResolvedValue({});

    const { req, res, sent } = makeReqRes();
    await idempotencyMiddleware(req, res, jest.fn());

    res.status(500).json({ error: true });
    await flushAsync();

    expect(IdempotencyKey.deleteOne).toHaveBeenCalledWith({ key: { $eq: 'test-key-1' } });
    expect(IdempotencyKey.findOneAndUpdate).not.toHaveBeenCalled();
    expect(sent.statusCode).toBe(500);
    expect(sent.body).toEqual({ error: true });
  });

  it('rejects a concurrent duplicate with 409 while the original is in flight', async () => {
    const duplicateErr = Object.assign(new Error('dup'), { code: 11000 });
    IdempotencyKey.create.mockRejectedValue(duplicateErr);
    IdempotencyKey.findOne.mockReturnValue({
      lean: () => Promise.resolve({ key: 'test-key-1', status: 'in_progress' }),
    });

    const next = jest.fn();
    const { req, res, sent } = makeReqRes();
    await idempotencyMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sent.statusCode).toBe(409);
    expect(sent.body.code).toBe('IDEMPOTENCY_IN_PROGRESS');
  });

  it('replays the stored response once the original has completed', async () => {
    const duplicateErr = Object.assign(new Error('dup'), { code: 11000 });
    IdempotencyKey.create.mockRejectedValue(duplicateErr);
    IdempotencyKey.findOne.mockReturnValue({
      lean: () =>
        Promise.resolve({
          key: 'test-key-1',
          status: 'completed',
          statusCode: 201,
          response: { orderId: 'abc' },
        }),
    });

    const next = jest.fn();
    const { req, res, sent } = makeReqRes();
    await idempotencyMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sent.statusCode).toBe(201);
    expect(sent.body).toEqual({ orderId: 'abc' });
  });
});
