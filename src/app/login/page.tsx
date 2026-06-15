import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="text-secondary">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
