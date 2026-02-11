export type Tech = {
    title?: string;
    camera?: string;
    lens?: string;
    focalLength?: number;
    exposureTime?: string;
    iso?: number;
    sensorTemp?: number;
    integration?: string;
    mount?: string;
    filters?: string;
};

export default function TechPanel({ tech }: { tech: Tech }) {
    const rows: [string, string | number | undefined][] = [
        ['Camera', tech.camera],
        ['Lens/Scope', tech.lens],
        ['Focal length', tech.focalLength ? `${tech.focalLength} mm` : undefined],
        ['Exposure', tech.exposureTime ? `${tech.exposureTime} s` : undefined],
        ['ISO', typeof tech.iso === 'number' ? tech.iso : undefined],
        ['Sensor temp', typeof tech.sensorTemp === 'number' ? `${tech.sensorTemp}°C` : undefined],
        ['Integration', tech.integration],
        ['Mount', tech.mount],
        ['Filters', tech.filters],
    ];

    return (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {rows.map(([k, v]) =>
                v ? (
                    <div key={k} className="flex">
                        <dt className="w-32 text-neutral-400">{k}</dt>
                        <dd className="text-neutral-200">{v}</dd>
                    </div>
                ) : null
            )}
        </dl>
    );
}
