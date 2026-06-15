import { signIn } from "@/lib/auth";
import { apiError, json, rateLimit } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    await rateLimit(`login:${body.email.toLowerCase()}`, 10, 300);

    await signIn("credentials", {
      email: body.email,
      password: body.password,
      redirect: false
    });

    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
