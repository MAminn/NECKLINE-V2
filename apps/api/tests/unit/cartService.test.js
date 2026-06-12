const mongoose = require('mongoose');

jest.mock('../../src/models/Cart');
jest.mock('../../src/models/Product');
jest.mock('../../src/services/reservationService');
jest.mock('../../src/services/discountService');
jest.mock('../../src/services/shippingService');
jest.mock('../../src/domain/audit', () => ({
  createAuditEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const Cart = require('../../src/models/Cart');
const Product = require('../../src/models/Product');
const reservationService = require('../../src/services/reservationService');
const discountService = require('../../src/services/discountService');
const shippingService = require('../../src/services/shippingService');
const cartService = require('../../src/services/cartService');

const oid = () => new mongoose.Types.ObjectId().toString();
const sortResolving = (value) => ({ sort: jest.fn().mockResolvedValue(value) });
const leanResolving = (value) => ({ lean: jest.fn().mockResolvedValue(value) });

function mockCart({ id, userId = null, items = [] }) {
  return {
    _id: id,
    userId,
    items,
    appliedPromoCode: null,
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    markModified: jest.fn(),
    isModified: jest.fn().mockReturnValue(false),
  };
}

function mockProduct(id) {
  return {
    _id: id,
    name: 'Necklace',
    sku: 'NL-1',
    images: ['img.jpg'],
    price: 500,
    currency: 'EGP',
    stockOnHand: 10,
    purchasable: true,
    deletedAt: null,
  };
}

describe('cartService — cartId ownership enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Sensible async defaults for the collaborators.
    Product.find.mockReturnValue(leanResolving([]));
    reservationService.getAvailability.mockResolvedValue(0);
    reservationService.getAvailabilityBulk.mockResolvedValue({});
    reservationService.findForCart.mockResolvedValue([]);
    reservationService.extend.mockResolvedValue(undefined);
    reservationService.release.mockResolvedValue(undefined);
    reservationService.releaseAll.mockResolvedValue(undefined);
    reservationService.reserve.mockResolvedValue(undefined);
    discountService.findBestDiscount.mockResolvedValue(null);
    shippingService.getDefaultShippingMethod.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not let a user read another user\'s cart via the cartId fallback', async () => {
    const userA = oid();
    const userB = oid();
    const foreignCartId = oid();

    // Requesting user (B) has no cart of their own...
    Cart.findOne.mockReturnValue(sortResolving(null));
    // ...and the supplied cartId belongs to user A.
    Cart.findById.mockResolvedValue(mockCart({ id: foreignCartId, userId: userA }));

    const result = await cartService.getCart(foreignCartId, userB);

    expect(result).toBeNull();
  });

  it('throws 404 when a user tries to mutate another user\'s cart by id', async () => {
    const userA = oid();
    const userB = oid();
    const foreignCartId = oid();
    const productId = oid();
    const cartA = mockCart({
      id: foreignCartId,
      userId: userA,
      items: [{ productId, quantity: 1 }],
    });

    Cart.findOne.mockReturnValue(sortResolving(null));
    Cart.findById.mockResolvedValue(cartA);

    await expect(
      cartService.removeItem(foreignCartId, productId, { userId: userB })
    ).rejects.toMatchObject({ statusCode: 404 });

    // The victim's cart must not have been touched.
    expect(cartA.save).not.toHaveBeenCalled();
    expect(reservationService.release).not.toHaveBeenCalled();
  });

  it('still resolves an unowned guest cart by id (fallback preserved)', async () => {
    const guestCartId = oid();
    Cart.findById.mockResolvedValue(mockCart({ id: guestCartId, userId: null }));

    const result = await cartService.getCart(guestCartId);

    expect(result).not.toBeNull();
    expect(result.cartId).toBe(guestCartId);
    expect(result.items).toEqual([]);
  });

  it('does not adopt another user\'s cart when a guest adds an item — creates a fresh cart', async () => {
    const ownerId = oid();
    const ownedCartId = oid();
    const newCartId = oid();
    const productId = oid();

    const ownedCart = mockCart({ id: ownedCartId, userId: ownerId });
    const newCart = mockCart({ id: newCartId, userId: null });

    Product.findById.mockReturnValue(leanResolving(mockProduct(productId)));
    Product.find.mockReturnValue(leanResolving([mockProduct(productId)]));
    // Guest passes a cartId that actually belongs to ownerId.
    Cart.findById.mockResolvedValue(ownedCart);
    Cart.create.mockResolvedValue(newCart);

    const result = await cartService.addItem(ownedCartId, productId, 1, {});

    // A brand-new cart was created instead of reusing the owned one.
    expect(Cart.create).toHaveBeenCalledWith({ items: [] });
    expect(result.cartId).toBe(newCartId);
    expect(newCart.items).toHaveLength(1);
    // The owner's cart was never written to.
    expect(ownedCart.save).not.toHaveBeenCalled();
  });
});

describe('cartService — availability math (AD-2: stockOnHand − Σ active reservations)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    discountService.findBestDiscount.mockResolvedValue(null);
    shippingService.getDefaultShippingMethod.mockResolvedValue(null);
  });

  const cartItem = (productId, quantity) => ({
    productId,
    name: 'Necklace',
    sku: 'NL-1',
    image: 'img.jpg',
    quantity,
    unitPrice: { amount: 500, currency: 'EGP' },
  });

  it('computes per-item availability for a multi-item cart with batched queries', async () => {
    const cartId = oid();
    const [pA, pB, pC] = [oid(), oid(), oid()];
    const cart = mockCart({
      id: cartId,
      items: [cartItem(pA, 2), cartItem(pB, 5), cartItem(pC, 1)],
    });
    Cart.findById.mockResolvedValue(cart);

    // pA: stock 10, others reserve 0 → 10 ≥ 2 → available.
    // pB: stock 6, others reserve 2 → 6 − 2 = 4 < 5 → NOT available.
    // pC: product missing (deleted) → NOT available.
    Product.find.mockReturnValue(
      leanResolving([
        { ...mockProduct(pA), stockOnHand: 10 },
        { ...mockProduct(pB), stockOnHand: 6 },
      ])
    );
    reservationService.getAvailabilityBulk.mockResolvedValue({ [pB]: 2 });
    // pA has a live reservation for this cart; pB's has expired; pC has none.
    reservationService.findForCart.mockResolvedValue([
      { productId: pA, expiresAt: new Date(Date.now() + 60_000) },
      { productId: pB, expiresAt: new Date(Date.now() - 60_000) },
    ]);

    const result = await cartService.getCart(cartId);

    const byId = Object.fromEntries(result.items.map((i) => [i.productId, i]));
    expect(byId[pA]).toMatchObject({ available: true, reserved: true });
    expect(byId[pB]).toMatchObject({ available: false, reserved: false });
    expect(byId[pC]).toMatchObject({ available: false, reserved: false });

    // Batched: exactly one product fetch, one reservation-sum aggregation,
    // and one own-reservation lookup — regardless of cart size.
    expect(Product.find).toHaveBeenCalledTimes(1);
    expect(Product.find).toHaveBeenCalledWith({ _id: { $in: [pA, pB, pC] } });
    expect(reservationService.getAvailabilityBulk).toHaveBeenCalledTimes(1);
    expect(reservationService.getAvailabilityBulk).toHaveBeenCalledWith([pA, pB, pC], cartId);
    expect(reservationService.findForCart).toHaveBeenCalledTimes(1);
    expect(Product.findById).not.toHaveBeenCalled();
    expect(reservationService.getAvailability).not.toHaveBeenCalled();
  });

  it('skips all queries for an empty cart', async () => {
    const cart = mockCart({ id: oid(), items: [] });
    Cart.findById.mockResolvedValue(cart);

    const result = await cartService.getCart(cart._id);

    expect(result.items).toEqual([]);
    expect(Product.find).not.toHaveBeenCalled();
    expect(reservationService.getAvailabilityBulk).not.toHaveBeenCalled();
    expect(reservationService.findForCart).not.toHaveBeenCalled();
  });
});
