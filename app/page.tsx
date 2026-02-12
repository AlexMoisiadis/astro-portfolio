// app/page.tsx
import Gallery from '@/components/Gallery';              // <-- add this
import type { GalleryItem } from '@/types/gallery.types';
import { getBaseUrl } from '@/lib/get-base-url';

export default async function Page() {
  let items: GalleryItem[] = [];

  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/portfolio`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { items: GalleryItem[] };
      items = Array.isArray(data?.items) ? data.items : [];
    } else {
      console.error('GET /api/portfolio failed:', res.status);
    }
  } catch (err) {
    console.error('GET /api/portfolio error:', err);
  }

  return (
    <main>
      <p className="mb-6 text-neutral-300">
        A selection of deep-sky images. Click any frame to see details.
      </p>
      {items.length > 0 ? (
        <Gallery items={items} />
      ) : (
        <div className="text-neutral-400">No images to display yet.</div>
      )}
    </main>
  );
}