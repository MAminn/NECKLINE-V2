const IdempotencyKey = require('../../src/models/IdempotencyKey');
const env = require('../../src/config/env');

/**
 * Locks in the two-tier TTL design on idempotency_keys (AD-3):
 *  - completed records live IDEMPOTENCY_TTL_HOURS so replays work for the full window
 *  - in_progress records expire on a short fuse so an orphaned reservation
 *    (failed cleanup, process death mid-request) can't 409 its key for hours
 */
describe('IdempotencyKey schema TTL indexes', () => {
  const indexes = IdempotencyKey.schema.indexes();

  it('expires all records after IDEMPOTENCY_TTL_HOURS via the createdAt path option', () => {
    expect(IdempotencyKey.schema.path('createdAt').options.expires).toBe(
      env.IDEMPOTENCY_TTL_HOURS * 3600
    );
  });

  it('expires in_progress records early via a partial TTL index', () => {
    const partial = indexes.find(([, options]) => options.name === 'in_progress_ttl');

    expect(partial).toBeDefined();
    const [keys, options] = partial;
    expect(keys).toEqual({ createdAt: 1 });
    expect(options.expireAfterSeconds).toBe(env.IDEMPOTENCY_IN_PROGRESS_TTL_MINUTES * 60);
    expect(options.partialFilterExpression).toEqual({ status: 'in_progress' });
  });

  it('keeps the in_progress fuse shorter than the replay window', () => {
    expect(env.IDEMPOTENCY_IN_PROGRESS_TTL_MINUTES * 60).toBeLessThan(
      env.IDEMPOTENCY_TTL_HOURS * 3600
    );
  });
});
