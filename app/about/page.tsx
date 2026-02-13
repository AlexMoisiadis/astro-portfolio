export const metadata = {
  title: 'About — Astrophotography Portfolio',
  description: 'About this astrophotography portfolio and the photographer behind it.',
};

import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
        About
      </h1>

      <div className="space-y-5 text-neutral-300 leading-relaxed">
        {/* Profile photo */}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="shrink-0 overflow-hidden rounded-full border-2 border-white/10 shadow-lg shadow-indigo-500/10">
            <Image
              src="/alex.jpg"
              alt="Alex Moisiadis"
              width={140}
              height={140}
              className="h-[140px] w-[140px] object-cover"
              priority
            />
          </div>
          <p className="text-center sm:text-left">
            Welcome to my astrophotography portfolio. I&apos;m Alex Moisiadis — a
            photographer captivated by the wonders of the night sky.
          </p>
        </div>

        <p>
          This site showcases a curated selection of my deep-sky images,
          including nebulae, galaxies, and star clusters captured from various
          locations under dark skies. Each image represents hours of careful
          data acquisition, calibration, and processing.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-neutral-100">
          The Process
        </h2>
        <p>
          Astrophotography is a blend of science and art. It involves precise
          polar alignment, autoguiding, and long-exposure imaging — often
          spanning multiple nights to accumulate enough signal. The raw data is
          then processed through calibration, stacking, and careful
          post-processing to reveal structures invisible to the naked eye.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-neutral-100">
          Technology
        </h2>
        <p>
          This portfolio is built with{' '}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline decoration-indigo-400/30 underline-offset-2 transition-colors hover:text-indigo-300"
          >
            Next.js
          </a>{' '}
          and powered by{' '}
          <a
            href="https://immich.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline decoration-indigo-400/30 underline-offset-2 transition-colors hover:text-indigo-300"
          >
            Immich
          </a>{' '}
          as the media backend. Images and metadata are served dynamically from
          my self-hosted Immich instance, making it easy to manage and update
          the gallery.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-neutral-100">
          Get in Touch
        </h2>
        <p>
          Feel free to reach out through{' '}
          <a
            href="https://github.com/AlexMoisiadis"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline decoration-indigo-400/30 underline-offset-2 transition-colors hover:text-indigo-300"
          >
            GitHub
          </a>{' '}
          if you have questions about any of the images, the equipment used, or
          the processing workflow.
        </p>
      </div>

      {/* Decorative divider */}
      <div className="mx-auto mt-12 h-px w-16 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </div>
  );
}
