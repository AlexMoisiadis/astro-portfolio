export type Tech = {
  title?: string;
  description?: string;
  camera?: string;
  lens?: string;
  focalLength?: number;
  exposureTime?: string;
  iso?: number;
  sensorTemp?: number;
  integration?: string;
  mount?: string;
  filters?: string | string[];
};

/* Small inline SVG icons for each metadata field */
function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function LensIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function FocalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IsoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function ThermoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function MountIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 22h20L12 2z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

type RowDef = {
  label: string;
  value: string | number | undefined;
  icon: React.ReactNode;
};

export default function TechPanel({ tech }: { tech: Tech }) {
  const normalizedFilters = Array.isArray(tech.filters)
    ? tech.filters.join(', ')
    : tech.filters;

  const rows: RowDef[] = [
    { label: 'Camera', value: tech.camera, icon: <CameraIcon /> },
    { label: 'Lens / Scope', value: tech.lens, icon: <LensIcon /> },
    {
      label: 'Focal Length',
      value:
        typeof tech.focalLength === 'number'
          ? `${tech.focalLength} mm`
          : undefined,
      icon: <FocalIcon />,
    },
    {
      label: 'Exposure',
      value: tech.exposureTime ? `${tech.exposureTime} s` : undefined,
      icon: <TimerIcon />,
    },
    {
      label: 'ISO',
      value: typeof tech.iso === 'number' ? tech.iso : undefined,
      icon: <IsoIcon />,
    },
    {
      label: 'Sensor Temp',
      value:
        typeof tech.sensorTemp === 'number'
          ? `${tech.sensorTemp}°C`
          : undefined,
      icon: <ThermoIcon />,
    },
    { label: 'Integration', value: tech.integration, icon: <StackIcon /> },
    { label: 'Mount', value: tech.mount, icon: <MountIcon /> },
    { label: 'Filters', value: normalizedFilters, icon: <FilterIcon /> },
  ].filter((r) => r.value !== undefined && r.value !== '') as RowDef[];

  if (rows.length === 0 && !tech.description) return null;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      {/* Description */}
      {tech.description && (
        <p className="mb-4 text-sm leading-relaxed text-neutral-300 whitespace-pre-line">
          {tech.description}
        </p>
      )}

      {/* Section header */}
      {rows.length > 0 && (
        <>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Equipment & Settings
          </h3>

          <dl className="space-y-2.5">
            {rows.map(({ label, value, icon }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0 text-neutral-500">
                  {icon}
                </span>
                <dt className="w-24 shrink-0 text-neutral-500">{label}</dt>
                <dd className="text-neutral-200">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
