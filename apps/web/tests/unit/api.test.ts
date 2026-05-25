import { apiClient, generateCorrelationId } from '../../src/lib/api';

describe('generateCorrelationId', () => {
  it('returns a string id', () => {
    const id = generateCorrelationId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique ids', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    expect(id1).not.toBe(id2);
  });
});

describe('apiClient', () => {
  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    });

    await expect(apiClient('/health')).rejects.toThrow('Server error');
  });
});
