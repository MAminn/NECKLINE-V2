'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const imageList = images.length > 0 ? images : ['/placeholder-product.png'];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-bg-secondary">
        <img
          src={imageList[selected]}
          alt={productName}
          className="h-full w-full object-cover"
        />
      </div>

      {imageList.length > 1 && (
        <div className="flex gap-2">
          {imageList.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`relative aspect-square w-20 overflow-hidden rounded-md border-2 transition-colors ${
                idx === selected ? 'border-primary' : 'border-transparent hover:border-border-strong'
              }`}
            >
              <img src={img} alt={`${productName} ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
