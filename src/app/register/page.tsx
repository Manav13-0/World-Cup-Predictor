import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm mode="register" />
          <p className="mt-4 text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="text-secondary">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
