'use client';

import { apiClient, refreshAccessToken } from './api';
import { getCsrfToken, invalidateCsrfToken } from './csrf';
import type {
  AdminMetrics,
  ActivityEvent,
  AdminProduct,
  AdminOrder,
  AdminCustomer,
  AdminPromoCode,
  AdminHeaderSlide,
  Testimonial,
} from '../types/nickline';

// Dashboard
export async function getMetrics(): Promise<AdminMetrics> {
  const data = await apiClient('/admin/metrics');
  return data;
}

export async function getActivities(): Promise<ActivityEvent[]> {
  const data = await apiClient('/admin/activities');
  return data;
}

// Products
export async function getAdminProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}): Promise<{ products: AdminProduct[]; total: number; page: number; totalPages: number; kpis: Record<string, number> }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  if (params?.category) q.set('category', params.category);
  if (params?.status) q.set('status', params.status);
  return apiClient(`/admin/products${q.toString() ? `?${q}` : ''}`);
}

export async function createAdminProduct(body: Partial<AdminProduct>): Promise<AdminProduct> {
  return apiClient('/admin/products', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateAdminProduct(id: string, body: Partial<AdminProduct>): Promise<AdminProduct> {
  return apiClient(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteAdminProduct(id: string): Promise<{ success: boolean }> {
  return apiClient(`/admin/products/${id}`, { method: 'DELETE' });
}

// Orders
export async function getAdminOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  fulfillmentStatus?: string;
  status?: string;
}): Promise<{ orders: AdminOrder[]; total: number; page: number; totalPages: number }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  if (params?.fulfillmentStatus) q.set('fulfillmentStatus', params.fulfillmentStatus);
  if (params?.status) q.set('status', params.status);
  return apiClient(`/admin/orders${q.toString() ? `?${q}` : ''}`);
}

export async function updateAdminOrder(
  id: string,
  body: { fulfillmentStatus?: string; trackingNumber?: string }
): Promise<AdminOrder> {
  return apiClient(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteAdminOrder(id: string): Promise<{ success: boolean }> {
  return apiClient(`/admin/orders/${id}`, { method: 'DELETE' });
}

// Customers
export async function getAdminCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ customers: AdminCustomer[]; total: number; page: number; totalPages: number; kpis: Record<string, number> }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  return apiClient(`/admin/customers${q.toString() ? `?${q}` : ''}`);
}

export async function deleteAdminCustomer(email: string): Promise<{ success: boolean }> {
  return apiClient(`/admin/customers/${encodeURIComponent(email)}`, { method: 'DELETE' });
}

// Coupons
export async function getAdminCoupons(): Promise<{ coupons: AdminPromoCode[] }> {
  return apiClient('/admin/coupons');
}

export async function createAdminCoupon(body: {
  code: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  usageLimit?: number;
  endDate?: string;
}): Promise<AdminPromoCode> {
  return apiClient('/admin/coupons', { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteAdminCoupon(id: string): Promise<{ success: boolean }> {
  return apiClient(`/admin/coupons/${id}`, { method: 'DELETE' });
}

// Offers
export async function getAdminOffers(): Promise<{ offers: AdminPromoCode[] }> {
  return apiClient('/admin/offers');
}

export async function createAdminOffer(body: {
  description: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  endDate?: string;
}): Promise<AdminPromoCode> {
  return apiClient('/admin/offers', { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteAdminOffer(id: string): Promise<{ success: boolean }> {
  return apiClient(`/admin/offers/${id}`, { method: 'DELETE' });
}

// Testimonials
export async function getTestimonials(): Promise<Testimonial[]> {
  return apiClient('/testimonials');
}

export async function createTestimonial(body: Omit<Testimonial, 'id' | 'deletedAt'>): Promise<Testimonial> {
  return apiClient('/testimonials', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateTestimonial(id: string, body: Partial<Testimonial>): Promise<Testimonial> {
  return apiClient(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteTestimonial(id: string): Promise<{ success: boolean }> {
  return apiClient(`/testimonials/${id}`, { method: 'DELETE' });
}

// Header Slides
export async function getHeaderSlides(): Promise<AdminHeaderSlide[]> {
  return apiClient('/header-slides');
}

export async function createHeaderSlide(body: Omit<AdminHeaderSlide, 'id'>): Promise<AdminHeaderSlide> {
  return apiClient('/admin/header-slides', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateHeaderSlide(id: string, body: Partial<AdminHeaderSlide>): Promise<AdminHeaderSlide> {
  return apiClient(`/admin/header-slides/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteHeaderSlide(id: string): Promise<{ success: boolean }> {
  return apiClient(`/admin/header-slides/${id}`, { method: 'DELETE' });
}

// Uploads
// Sends a single file to /admin/uploads as multipart/form-data. Uses raw fetch
// (not apiClient) because the body is FormData and CSRF is sent explicitly.
export async function uploadAdminImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/uploads`;
  const doUpload = (csrfToken: string | null) =>
    fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    });
  let res = await doUpload(await getCsrfToken());
  // Expired access token (15 min): refresh once and retry, mirroring api.ts
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doUpload(await getCsrfToken());
  }
  // Stale/missing CSRF token (e.g. cookie expired): fetch a fresh one and retry once
  if (res.status === 403) {
    invalidateCsrfToken();
    const csrfToken = await getCsrfToken();
    if (csrfToken) res = await doUpload(csrfToken);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Upload failed');
  }
  const data = await res.json();
  return data.url;
}

