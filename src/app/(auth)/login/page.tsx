import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;           // ⬅️ unwrap
  const redirectTo = sp.redirect ?? "/app";
  return <LoginForm redirectTo={redirectTo} />;
}
