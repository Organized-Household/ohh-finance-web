import LoginPageContent from "./login-page-content";

type SearchParams = Promise<{
  redirectTo?: string;
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const hasRedirectParam = typeof params.redirectTo === "string";
  const redirectTo = hasRedirectParam ? String(params.redirectTo) : "/app";

  return (
    <LoginPageContent
      redirectTo={redirectTo}
      showProtectedRouteMessage={hasRedirectParam}
    />
  );
}
