import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { JWT } from "@auth/core/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { env } from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
  }
}

function sessionToken(token: JWT) {
  return {
    id: token.id ?? token.sub ?? "",
    role: token.role ?? "USER"
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login"
  },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET
          })
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() }
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = "role" in user ? (user.role as "USER" | "ADMIN") : "USER";
      }

      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        token.id = dbUser?.id ?? token.id ?? token.sub ?? "";
        token.role = dbUser?.role ?? "USER";
      }

      return token;
    },
    session: async ({ session, token }) => {
      const currentToken = sessionToken(token);
      if (!currentToken.id) {
        const email = session.user.email ?? token.email;
        if (typeof email === "string" && email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          session.user.id = dbUser?.id ?? "";
          session.user.role = dbUser?.role ?? currentToken.role;
          return session;
        }
      }

      session.user.id = currentToken.id;
      session.user.role = currentToken.role;
      return session;
    }
  }
});
