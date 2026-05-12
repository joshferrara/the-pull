import { CmsLoginForm } from "@/components/cms-login-form";

export const dynamic = "force-dynamic";


export default function CmsLoginPage() {
  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-2">CMS sign-in</h1>
      <p className="text-[color:var(--color-subtext0)] text-sm mb-6">
        Magic-link login restricted to the curator email.
      </p>
      <CmsLoginForm />
    </main>
  );
}
