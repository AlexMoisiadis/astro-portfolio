import Gallery, { type GalleryItem } from '@/components/Gallery';

export default async function Page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/portfolio`, { cache: 'no-store' });
  const data = (await res.json()) as { items: GalleryItem[] };

  return (
    <main>
      <p className="mb-6 text-neutral-300">
        A selection of deep-sky images. Click any frame to see details.
      </p>
      <Gallery items={data.items} />
    </main>
  );
}