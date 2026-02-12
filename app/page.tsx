import Gallery, { type GalleryItem } from '@/components/Gallery';

export default async function Page() {
  let items: GalleryItem[] = [];

  try {
    const res = await fetch('/api/portfolio', { cache: 'no-store' });
    if (!res.ok) {
      // Log for server console; render a friendly message below
      console.error('GET /api/portfolio failed:', res.status);
    } else {
      const data = (await res.json()) as { items: GalleryItem[] };
      items = Array.isArray(data?.items) ? data.items : [];
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