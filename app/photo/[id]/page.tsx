// app/photo/[id]/page.tsx
import Image from 'next/image';
import TechPanel from '@/components/TechPanel';
import { getBaseUrl } from '@/lib/get-base-url';

async function getMeta(id: string) {
    const base = await getBaseUrl(); // absolute origin
    const res = await fetch(`${base}/api/photo/${id}/metadata`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

export default async function PhotoPage({
    params,
}: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const meta = await getMeta(id);
    if (!meta) return <div>Not found.</div>;

    return (
        <article className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                <Image
                    src={`/api/image/${id}/original`}   // proxy route
                    alt={meta.title ?? 'Astro photo'}
                    width={meta.width ?? 2048}
                    height={meta.height ?? 1365}
                    className="rounded-md w-full h-auto"
                    sizes="100vw"
                    priority
                />
            </div>
            <div className="lg:col-span-4">
                <h2 className="text-2xl font-semibold mb-3">{meta.title ?? 'Untitled'}</h2>
                {meta.capturedAt && (
                    <div className="text-neutral-400 mb-4">
                        Captured: {new Date(meta.capturedAt).toLocaleString()}
                    </div>
                )}
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
            </div>
        </article>
    );
}