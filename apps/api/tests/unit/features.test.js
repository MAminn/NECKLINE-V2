const { isEnabled, setEnabled, clearCache } = require('../../src/domain/features');
const FeatureFlag = require('../../src/models/FeatureFlag');

jest.mock('../../src/models/FeatureFlag');

const leanResolving = (value) => ({ lean: () => Promise.resolve(value) });

describe('isEnabled', () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
  });

  it('returns false when flag does not exist', async () => {
    FeatureFlag.findOne.mockReturnValue(leanResolving(null));
    const result = await isEnabled('nonexistent');
    expect(result).toBe(false);
  });

  it('returns true when flag is enabled', async () => {
    FeatureFlag.findOne.mockReturnValue(leanResolving({ enabled: true }));
    const result = await isEnabled('checkout_v2');
    expect(result).toBe(true);
  });

  it('caches the result', async () => {
    FeatureFlag.findOne.mockReturnValue(leanResolving({ enabled: true }));
    await isEnabled('cached_flag');
    await isEnabled('cached_flag');
    expect(FeatureFlag.findOne).toHaveBeenCalledTimes(1);
  });
});

describe('setEnabled', () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
  });

  it('updates flag and invalidates cache', async () => {
    FeatureFlag.findOne.mockReturnValue(leanResolving({ name: 'flag', enabled: false }));
    FeatureFlag.findOneAndUpdate.mockResolvedValue({ name: 'flag', enabled: true });

    const result = await setEnabled('flag', true, 'admin');
    expect(result.after.enabled).toBe(true);
  });
});
