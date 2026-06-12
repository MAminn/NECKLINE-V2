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

function mockResponse({
  ok = true,
  status = 200,
  contentLength = null,
  body = '{}',
  text,
}: {
  ok?: boolean;
  status?: number;
  contentLength?: string | null;
  body?: string;
  text?: jest.Mock;
}) {
  return {
    ok,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-length' ? contentLength : null,
    },
    text: text ?? (async () => body),
  };
}

describe('apiClient', () => {
  it('throws on non-ok response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        status: 500,
        body: '{"message":"Server error"}',
      })
    );

    await expect(apiClient('/health')).rejects.toThrow('Server error');
  });

  it('returns null for 204 responses without reading the body', async () => {
    const text = jest.fn();
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockResponse({ status: 204, text })
    );

    await expect(apiClient('/health')).resolves.toBeNull();
    expect(text).not.toHaveBeenCalled();
  });

  it('returns null for empty-body responses (content-length 0)', async () => {
    const text = jest.fn();
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockResponse({ contentLength: '0', text })
    );

    await expect(apiClient('/health')).resolves.toBeNull();
    expect(text).not.toHaveBeenCalled();
  });

  it('returns null for empty-body responses without a content-length header', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockResponse({ body: '' }));

    await expect(apiClient('/health')).resolves.toBeNull();
  });

  it('throws a descriptive error when a successful response has malformed JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockResponse({ body: '<!DOCTYPE html>' })
    );

    const promise = apiClient('/health');
    await expect(promise).rejects.toThrow(
      'Invalid JSON in response from /health (HTTP 200): <!DOCTYPE html>'
    );
    await promise.catch((error) => {
      expect(error.status).toBe(200);
      expect(error.code).toBe('INVALID_JSON');
      expect(error.data).toBe('<!DOCTYPE html>');
    });
  });

  it('throws the HTTP error when an error response has a non-JSON body', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockResponse({ ok: false, status: 502, body: '<html>Bad Gateway</html>' })
    );

    await expect(apiClient('/health')).rejects.toThrow('HTTP 502');
  });
});
