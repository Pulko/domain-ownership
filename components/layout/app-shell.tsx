import { AppHeader } from './app-header';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-12">
        <AppHeader />
        <div className="w-full max-w-2xl flex-1 px-5 pb-8">{children}</div>
      </div>
    </main>
  );
}
