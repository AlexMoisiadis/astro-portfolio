import '@/styles/globals.css';

export const metadata = {
  title: 'Astrophotography Portfolio',
  description: 'A curated gallery of the night sky.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-black">
      <body className="text-neutral-100">
        <header className="border-b border-neutral-800">
          <div className="mx-auto max-w-6xl p-6">
            <h1 className="text-xl font-semibold">Astrophotography Portfolio</h1>
          </div>
        </header>
        <div className="mx-auto max-w-6xl p-6">{children}</div>
        <footer className="mx-auto max-w-6xl p-6 text-neutral-500">
          © {new Date().getFullYear()} Alex Moisiadis
        </footer>
      </body>
    </html>
  );
}