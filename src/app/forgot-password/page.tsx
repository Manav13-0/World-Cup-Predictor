import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";

export default function ForgotPasswordPage() {
  return (
    <PageShell title="Forgot Password" description="Password reset delivery is ready for an email provider integration.">
      <Card>
        <CardHeader>
          <CardTitle>Contact an administrator</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          This deployment uses credentials and Google login. Add your transactional email provider in production to issue
          signed reset links from this route.
        </CardContent>
      </Card>
    </PageShell>
  );
}
