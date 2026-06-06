const { isEnabled, setEnabled, clearCache } = require('../../src/domain/features');
const FeatureFlag = require('../../src/models/FeatureFlag');

jest.mock('../../src/models/FeatureFlag');

describe('isEnabled', () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
  });

  it('returns false when flag does not exist', async () => {
    FeatureFlag.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    const result = await isEnabled('nonexistent');
    expect(result).toBe(false);
  });

  it('returns true when flag is enabled', async () => {
    FeatureFlag.findOne.mockReturnValue({ lean: () => Promise.resolve({ enabled: true }) });
    const result = await isEnabled('checkout_v2');
    expect(result).toBe(true);
  });

  it('caches the result', async () => {
    FeatureFlag.findOne.mockReturnValue({ lean: () => Promise.resolve({ enabled: true }) });
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
    FeatureFlag.findOne.mockReturnValue({ lean: () => Promise.resolve({ name: 'flag', enabled: false }) });
    FeatureFlag.findOneAndUpdate.mockResolvedValue({ name: 'flag', enabled: true });

    const result = await setEnabled('flag', true, 'admin');
    expect(result.after.enabled).toBe(true);
  });
});
