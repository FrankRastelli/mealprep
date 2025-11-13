import LoginForm from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const redirectTo = searchParams.redirect ?? "/app";
  return <LoginForm redirectTo={redirectTo} />;
}
