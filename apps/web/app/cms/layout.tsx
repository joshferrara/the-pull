import { redirect } from "next/navigation";
import Link from "next/link";
import { readSession, isCmsEmail } from "@/lib/auth";


export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session || !isCmsEmail(session.email)) {
    redirect("/cms/login");
  }
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[color:var(--color-mantle)] border-b border-[color:var(--color-surface1)]">
        <nav className="max-w-3xl mx-auto px-4 py-2 flex gap-4 text-xs uppercase tracking-widest text-[color:var(--color-overlay1)]">
          <Link href="/cms">Today</Link>
          <Link href="/cms/bookmarks">Bookmarks</Link>
          <Link href="/cms/archive">Archive</Link>
          <Link href="/cms/analytics">Analytics</Link>
          <Link href="/cms/settings" className="ml-auto">
            Settings
          </Link>
        </nav>
      </header>
      <div className="max-w-3xl mx-auto px-4 pb-32">{children}</div>
    </div>
  );
}
