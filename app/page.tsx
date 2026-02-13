import Gallery from '@/components/Gallery';
import GallerySkeleton from '@/components/GallerySkeleton';
import type { GalleryItem } from '@/types/gallery.types';
import { getBaseUrl } from '@/lib/get-base-url';
import { Suspense } from 'react';

async function getItems(): Promise<GalleryItem[]> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/portfolio`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { items: GalleryItem[] };
      return Array.isArray(data?.items) ? data.items : [];
    }
    console.error('GET /api/portfolio failed:', res.status);
    return [];
  } catch (err) {
    console.error('GET /api/portfolio error:', err);
    return [];
  }
}

async function GallerySection() {
  const items = await getItems();

  if (items.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4 text-neutral-600"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
        <p className="text-lg text-neutral-400">No images to display yet.</p>
        <p className="mt-1 text-sm text-neutral-600">
          Add photos to your Immich portfolio album to get started.
        </p>
      </div>
    );
  }

  return <Gallery items={items} />;
}

export default function Page() {
  return (
    <div>
      {/* Hero Section */}
      <section className="animate-fade-in-up mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          The Night Sky
        </h1>
        <p className="mx-auto max-w-xl text-lg text-neutral-400">
          A curated collection of deep-sky astrophotography — capturing the
          beauty of nebulae, galaxies, and star clusters from under dark skies.
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
      </section>

      {/* Gallery */}
      <Suspense fallback={<GallerySkeleton />}>
        <GallerySection />
      </Suspense>
    </div>
  );
}
