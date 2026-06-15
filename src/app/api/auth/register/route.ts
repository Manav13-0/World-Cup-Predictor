import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, json, rateLimit } from "@/lib/http";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    await rateLimit(`register:${body.email.toLowerCase()}`, 5, 300);

    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() }
    });

    if (existing) {
      return json({ error: "An account with this email already exists." }, 409);
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        password: await bcrypt.hash(body.password, 12)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return json({ user }, 201);
  } catch (error) {
    return apiError(error);
  }
}
