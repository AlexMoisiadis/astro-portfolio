import Image from 'next/image';
import TechPanel from '@/components/TechPanel';

async function getMeta(id: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/photo/${id}/metadata`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

export default async function PhotoPage({ params }: { params: { id: string } }) {
    const meta = await getMeta(params.id);
    if (!meta) return <div>Not found.</div>;

    return (
        <article className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                <Image
                    src={meta.originalUrl}
                    alt={meta.title ?? 'Astro photo'}
                    width={meta.width ?? 2400}
                    height={meta.height ?? 1600}
                    className="rounded-md w-full h-auto"
                    sizes="100vw"
                />
            </div>
            <div className="lg:col-span-4">
                <h2 className="text-2xl font-semibold mb-3">{meta.title ?? 'Untitled'}</h2>
                {meta.capturedAt ? (
                    <div className="text-neutral-400 mb-4">Captured: {new Date(meta.capturedAt).toLocaleString()}</div>
                ) : null}
                <TechPanel
                    tech={{
                        title: meta.title,
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