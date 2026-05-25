const { createAuditEvent } = require('../../src/domain/audit');
const AuditEvent = require('../../src/models/AuditEvent');

jest.mock('../../src/models/AuditEvent');

describe('createAuditEvent', () => {
  it('creates an audit event with diff', async () => {
    const before = { name: 'Old', price: 100 };
    const after = { name: 'New', price: 150 };

    AuditEvent.create.mockResolvedValue({ _id: 'audit123' });

    const event = await createAuditEvent({
      actor: 'admin@neckline.com',
      action: 'product_updated',
      target: 'product-1',
      targetType: 'Product',
      before,
      after,
      requestId: 'req-1',
    });

    expect(AuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'admin@neckline.com',
        action: 'product_updated',
        diff: expect.objectContaining({
          name: { before: 'Old', after: 'New' },
          price: { before: 100, after: 150 },
        }),
      })
    );
    expect(event._id).toBe('audit123');
  });
});
