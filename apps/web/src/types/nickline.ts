/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Scent {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  longDescription: string;
  price: number;
  currency: string;
  originalPrice?: number;
  image: string;
  galleryImages?: string[];
  notes: { top: string; heart: string; base: string; };
  intensity: number;
  vibe: string;
  ingredients: string[];
  tag?: string;
  category?: string;
  bgProfileLabel?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  product: string;
  verified: boolean;
  date: string;
}

export interface CartItem { scent: Scent; quantity: number; }

export interface HeaderSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  linkTo: string;
}

export interface Testimonial {
  id: string;
  name: string;
  product: string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
  deletedAt?: string | null;
}

export interface HowToApplyStep {
  num: string;
  title: string;
  desc: string;
  iconType: 'preset' | 'custom';
  presetName?: string;
  customIconUrl?: string;
}

export interface HowToApply { color: string; steps: HowToApplyStep[]; }

export interface AdminMetrics {
  revenueToday: number;
  totalRevenue: number;
  ordersCount: number;
  todayOrdersCount: number;
  conversionRate: number;
  returningRate: number;
  newCustomers: number;
  pendingCount: number;
  processingCount: number;
  averageOrderValue: number;
  liveSessions: number;
  visitsHistory: { date: string; visits: number; checkouts: number }[];
  productShare: { name: string; share: number; color: string }[];
  forecast: { increase: number; recommendedStock: number; topProduct: string; projectedRevenue: number; };
}

export interface ActivityEvent {
  id: string;
  iconType: 'order' | 'cart' | 'ship' | 'alert' | 'user';
  user: string;
  text: string;
  sub: string;
  time: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  currency: string;
  stockOnHand: number;
  status: string;
  views: number;
  sales: number;
  image: string;
  images?: string[];
  galleryImages: string[];
  subtitle: string;
  description: string;
  purchasable: boolean;
  deletedAt?: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemsSummary: string;
  itemCount: number;
  total: number;
  currency: string;
  status: string;
  fulfillmentStatus: string;
  trackingNumber: string | null;
  createdAt: string;
  shippingAddress: { city: string; governorate: string };
}

export type CustomerTag = 'VIP' | 'NEW' | 'ACTIVE';

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  role: string;
  ordersCount: number;
  lifetimeValue: number;
  currency: string;
  createdAt: string;
  lastOrderAt?: string | null;
  /** Server-computed tier (see apps/api/.../admin/customers.js computeCustomerTag). */
  tag: CustomerTag;
}

export interface AdminPromoCode {
  id: string;
  code?: string;
  type: string;
  value: number;
  minOrderAmount: number;
  usageLimit?: number | null;
  usageCount: number;
  endDate?: string | null;
  active: boolean;
  isAutomatic: boolean;
  description?: string;
  createdAt: string;
}

export interface AdminHeaderSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  linkTo: string;
  order: number;
  active: boolean;
}

export interface AuditEventRecord {
  id: string;
  actor: string;
  action: string;
  target: string;
  targetType: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: string;
  requestId: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: { label: string; value: string; description: string; }[];
}
