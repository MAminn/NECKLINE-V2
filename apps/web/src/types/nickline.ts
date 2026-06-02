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
  originalPrice?: number;
  image: string;
  galleryImages?: string[];
  notes: {
    top: string;
    heart: string;
    base: string;
  };
  intensity: number; // 1-5 scale
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

export interface CartItem {
  scent: Scent;
  quantity: number;
}

export interface HeaderSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  linkTo: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    label: string;
    value: string;
    description: string;
  }[];
}
