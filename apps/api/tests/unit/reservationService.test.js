const mongoose = require('mongoose');

jest.mock('../../src/models/Reservation');

const Reservation = require('../../src/models/Reservation');
const reservationService = require('../../src/services/reservationService');

const oid = () => new mongoose.Types.ObjectId();

describe('reservationService — aggregation casting (regression)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Reservation.aggregate.mockResolvedValue([]);
  });

  // Mongoose does not cast aggregation pipelines: matching a string productId
  // against ObjectId documents silently returns nothing, which made
  // getAvailability report 0 reserved on the addItem/updateItem paths.
  it('getAvailability casts a string productId to ObjectId in $match', async () => {
    const productId = oid();
    const cartId = oid();
    Reservation.aggregate.mockResolvedValue([{ _id: null, total: 3 }]);

    const total = await reservationService.getAvailability(productId.toString(), cartId);

    expect(total).toBe(3);
    const [pipeline] = Reservation.aggregate.mock.calls[0];
    const matched = pipeline[0].$match.productId;
    expect(matched).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(matched.equals(productId)).toBe(true);
    expect(pipeline[0].$match.cartId).toEqual({ $ne: cartId });
  });

  it('getAvailability passes an ObjectId productId through unchanged', async () => {
    const productId = oid();

    await reservationService.getAvailability(productId, null);

    const [pipeline] = Reservation.aggregate.mock.calls[0];
    expect(pipeline[0].$match.productId).toBe(productId);
    expect(pipeline[0].$match.cartId).toBeUndefined();
  });

  it('getAvailabilityBulk casts string ids and groups totals by productId', async () => {
    const pA = oid();
    const pB = oid();
    const cartId = oid();
    Reservation.aggregate.mockResolvedValue([
      { _id: pA, total: 2 },
      { _id: pB, total: 5 },
    ]);

    const map = await reservationService.getAvailabilityBulk(
      [pA.toString(), pB],
      cartId
    );

    expect(map).toEqual({ [pA.toString()]: 2, [pB.toString()]: 5 });
    const [pipeline] = Reservation.aggregate.mock.calls[0];
    const inList = pipeline[0].$match.productId.$in;
    expect(inList).toHaveLength(2);
    for (const id of inList) {
      expect(id).toBeInstanceOf(mongoose.Types.ObjectId);
    }
    expect(inList[0].equals(pA)).toBe(true);
    expect(inList[1].equals(pB)).toBe(true);
  });

  it('getAvailabilityBulk returns {} for an empty id list without querying', async () => {
    const map = await reservationService.getAvailabilityBulk([], oid());

    expect(map).toEqual({});
    expect(Reservation.aggregate).not.toHaveBeenCalled();
  });
});
