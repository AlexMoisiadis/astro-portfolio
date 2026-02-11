'use client';

import Image from 'next/image';
import Link from 'next/link';

export type GalleryItem = {
    id: string;
    title?: string;
    width?: number;
    height?: number;
    thumbUrl: string;
    originalUrl: string;
    capturedAt?: string;
    camera?: string;
    focalLength?: number;
    exposureTime?: string;
    iso?: number;
};

export default function Gallery({ items }: { items: GalleryItem[] }) {
    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
                <li key={p.id} className="group">
                    <Link href={`/photo/${p.id}`} className="block">
                        <Image
                            src={p.thumbUrl}
                            alt={p.title ?? 'Astro photo'}
                            width={p.width ?? 1600}
                            height={p.height ?? 900}
                            className="rounded-md object-cover w-full h-auto"
                            sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                    </Link>
                    <div className="mt-2 text-sm text-neutral-300">
                        <div>{p.title}</div>
                        <div className="opacity-70">
                            {p.camera ? `${p.camera}` : null}
                            {typeof p.focalLength === 'number' ? ` • ${p.focalLength}mm` : null}
                            {p.exposureTime ? ` • ${p.exposureTime}s` : null}
                            {typeof p.iso === 'number' ? ` • ISO ${p.iso}` : null}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
