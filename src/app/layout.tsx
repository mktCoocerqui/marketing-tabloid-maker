import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tabloide Maker',
  description: 'Criação e diagramação inteligente de tabloides promocionais',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <header className="border-b bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
            <span className="text-lg font-semibold text-brand">Tabloide Maker</span>
            <span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-brand-fg">Fase 1 · fundação</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
