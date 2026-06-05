'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ShippingFormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  governorate: string;
  postalCode: string;
}

interface ShippingStepProps {
  onSubmit: (data: ShippingFormData) => void;
}

export default function ShippingStep({ onSubmit }: ShippingStepProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<ShippingFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: 'Cairo',
    governorate: 'Cairo',
    postalCode: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof ShippingFormData, string>> = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Valid email is required';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
    if (!form.street.trim()) nextErrors.street = 'Street is required';
    if (!form.city.trim()) nextErrors.city = 'City is required';
    if (!form.governorate.trim()) nextErrors.governorate = 'Governorate is required';
    if (!form.postalCode.trim()) nextErrors.postalCode = 'Postal code is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  const inputClass =
    'w-full rounded-md border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold';
  const errorClass = 'border-primary focus:border-primary focus:ring-primary';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-display text-xl uppercase tracking-wide">Contact & Shipping</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={`${inputClass} ${errors.name ? errorClass : ''}`}
            placeholder="Ahmed Mohamed"
          />
          {errors.name && <p className="mt-1 text-xs text-primary">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className={`${inputClass} ${errors.email ? errorClass : ''}`}
            placeholder="ahmed@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-primary">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={`${inputClass} ${errors.phone ? errorClass : ''}`}
            placeholder="+201001234567"
          />
          {errors.phone && <p className="mt-1 text-xs text-primary">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Street Address</label>
          <input
            name="street"
            value={form.street}
            onChange={handleChange}
            className={`${inputClass} ${errors.street ? errorClass : ''}`}
            placeholder="123 Tahrir St"
          />
          {errors.street && <p className="mt-1 text-xs text-primary">{errors.street}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">City</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className={`${inputClass} ${errors.city ? errorClass : ''}`}
            placeholder="Cairo"
          />
          {errors.city && <p className="mt-1 text-xs text-primary">{errors.city}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Governorate</label>
          <select
            name="governorate"
            value={form.governorate}
            onChange={handleChange}
            className={`${inputClass} ${errors.governorate ? errorClass : ''}`}
          >
            <option value="Cairo">Cairo</option>
            <option value="Alexandria">Alexandria</option>
            <option value="Giza">Giza</option>
            <option value="Qalyubia">Qalyubia</option>
            <option value="Port Said">Port Said</option>
            <option value="Suez">Suez</option>
            <option value="Sharqia">Sharqia</option>
            <option value="Dakahlia">Dakahlia</option>
            <option value="Beheira">Beheira</option>
            <option value="Minya">Minya</option>
            <option value="Gharbia">Gharbia</option>
            <option value="Monufia">Monufia</option>
            <option value="Qena">Qena</option>
            <option value="Sohag">Sohag</option>
            <option value="Ismailia">Ismailia</option>
            <option value="Faiyum">Faiyum</option>
            <option value="Asyut">Asyut</option>
            <option value="Damietta">Damietta</option>
            <option value="Aswan">Aswan</option>
            <option value="Luxor">Luxor</option>
            <option value="Red Sea">Red Sea</option>
            <option value="New Valley">New Valley</option>
            <option value="Matrouh">Matrouh</option>
            <option value="North Sinai">North Sinai</option>
            <option value="South Sinai">South Sinai</option>
            <option value="Kafr el-Sheikh">Kafr el-Sheikh</option>
            <option value="Beni Suef">Beni Suef</option>
          </select>
          {errors.governorate && <p className="mt-1 text-xs text-primary">{errors.governorate}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-secondary">Postal Code</label>
          <input
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            className={`${inputClass} ${errors.postalCode ? errorClass : ''}`}
            placeholder="11511"
          />
          {errors.postalCode && <p className="mt-1 text-xs text-primary">{errors.postalCode}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-gold py-3 font-medium uppercase tracking-wide text-bg transition-colors hover:brightness-110"
      >
        Continue to Review
      </button>
    </form>
  );
}
