import Image from 'next/image';
import BackButton from '@/components/BackButton';
import TechPanel from '@/components/TechPanel';
import { getBaseUrl } from '@/lib/get-base-url';

async function getMeta(id: string) {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/photo/${id}/metadata`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meta = await getMeta(id);

  if (!meta) {
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
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p className="text-lg text-neutral-400">Photo not found.</p>
        <p className="mt-1 text-sm text-neutral-600">
          This image may have been removed or the link is invalid.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <BackButton />

      <article className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Image */}
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-lg bg-neutral-900 shadow-2xl shadow-black/50">
            <Image
              src={`/api/image/${id}/preview`}
              alt={meta.title ?? 'Astro photo'}
              width={meta.width ?? 2048}
              height={meta.height ?? 1365}
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            {/* Title & Date */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {meta.title ?? 'Untitled'}
              </h1>
              {meta.capturedAt && (
                <p className="mt-2 text-sm text-neutral-500">
                  {new Date(meta.capturedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>

            {/* Tech Panel */}
            <TechPanel
              tech={{
                title: meta.title,
                description: meta.description,
                camera: meta.camera,
                lens: meta.lens,
                focalLength: meta.focalLength,
                exposureTime: meta.exposureTime,
                iso: meta.iso,
                sensorTemp: meta.sensorTemp,
                integration: meta.integration,
                mount: meta.mount,
                filters: meta.filters,
              }}
            />

            {/* Download button */}
            <a
              href={`/api/image/${id}/original`}
              download
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Original
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
