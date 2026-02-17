'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { GalleryItem } from '@/types/gallery.types';

export default function Gallery({ items }: { items: GalleryItem[] }) {
  return (
    <ul className="stagger-children grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.id} className="group">
          <Link
            href={`/photo/${p.slug}`}
            className="block overflow-hidden rounded-lg bg-neutral-900 transition-shadow duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            {/* Image container with aspect ratio */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={p.thumbUrl}
                alt={p.title ?? 'Astro photo'}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {p.title && (
                  <h3 className="text-sm font-semibold text-white">
                    {p.title}
                  </h3>
                )}
                <p className="mt-1 text-xs text-neutral-300">
                  {[
                    p.camera,
                    typeof p.focalLength === 'number'
                      ? `${p.focalLength}mm`
                      : null,
                    p.exposureTime ? `${p.exposureTime}s` : null,
                    typeof p.iso === 'number' ? `ISO ${p.iso}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            {/* Title below (visible by default, hides on hover on desktop) */}
            <div className="px-3 py-3 transition-opacity duration-300 lg:group-hover:opacity-0">
              {p.title && (
                <h3 className="truncate text-sm font-medium text-neutral-200">
                  {p.title}
                </h3>
              )}
              {p.capturedAt && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  {new Date(p.capturedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
