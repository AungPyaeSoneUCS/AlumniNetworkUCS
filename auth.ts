// file: auth.ts

import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import {
  googleLoginTemplate,
  loginTemplate,
  registerSuccessTemplate,
} from "@/lib/emailTemplates";
import { getRequestInfo } from "@/lib/requestInfo";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // --- 1. EXISTING ALUMNI LOGIN ---
    CredentialsProvider({
      name: "Email and Password",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password;

        const user: any = await prisma.user.findUnique({
          where: { email },
          select: { id: true, password: true },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!fullUser) return null;

        if (fullUser.isBlocked) return null;

        const lang = fullUser.languagePreference === "mm" ? "mm" : "en";

        try {
          const info = await getRequestInfo();

          await sendMail({
            to: fullUser.email,
            subject:
              lang === "mm"
                ? "Alumni Network ဝင်ရောက်မှု အသိပေးချက်"
                : "Alumni Network Login Alert",
            html: loginTemplate(fullUser.name || "User", lang, {
              email: fullUser.email,
              date: info.date,
              time: info.time,
              device: info.device,
              ip: info.ip,
            }),
          });
        } catch (error) {
          console.error("Login email failed:", error);
        }

        return {
          id: fullUser.id,
          name: fullUser.name || "",
          email: fullUser.email,
          image:
            fullUser.image && !String(fullUser.image).startsWith("data:")
              ? fullUser.image
              : null,
          role: fullUser.role || "user",
        };
      },
    }),

    // --- 2. VOTING SYSTEM LOGIN ---
    CredentialsProvider({
      id: "vote-login",
      name: "Voting System Login",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password;

        const user: any = await prisma.voteUser.findUnique({
          where: { email },
          select: { id: true, password: true },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        const fullUser = await prisma.voteUser.findUnique({ where: { id: user.id } });
        if (!fullUser) return null;

        return {
          id: fullUser.id,
          name: fullUser.name || "",
          email: fullUser.email,
          role: fullUser.role || "VOTER",
          hasVoted: fullUser.hasVoted,
          isVoteSystem: true, // Flag to identify which database they belong to
        };
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (
        url.startsWith("https://alumni.ucsh.edu.mm") ||
        url.startsWith("https://ucshalumninetwork.netlify.app")
      ) {
        return url;
      }

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (error) {}

      return baseUrl;
    },

    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.trim().toLowerCase();
        const info = await getRequestInfo();

        let dbUser: any = await prisma.user.findUnique({ where: { email } });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name: user.name || email.split("@")[0],
              email,
              image:
                user.image && !String(user.image).startsWith("data:")
                  ? user.image
                  : "",
              bio: "",
              role: "user",
              languagePreference: "en",
              themePreference: "light",
            },
          });

          try {
            await sendMail({
              to: dbUser.email,
              subject: "Welcome to Alumni Network",
              html: registerSuccessTemplate(dbUser.name || "User", "en", {
                email: dbUser.email,
                date: info.date,
                time: info.time,
                device: info.device,
                ip: info.ip,
              }),
            });
          } catch (error) {
            console.error("Google register email failed:", error);
          }
        } else {
          if (dbUser.isBlocked) return false;

          const lang = dbUser.languagePreference === "mm" ? "mm" : "en";

          if (user.image && !String(user.image).startsWith("data:")) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }

          try {
            await sendMail({
              to: dbUser.email,
              subject:
                lang === "mm"
                  ? "Google ဖြင့် ဝင်ရောက်မှု အသိပေးချက်"
                  : "Google Login Alert",
              html: googleLoginTemplate(dbUser.name || "User", lang, {
                email: dbUser.email,
                date: info.date,
                time: info.time,
                device: info.device,
                ip: info.ip,
              }),
            });
          } catch (error) {
            console.error("Google login email failed:", error);
          }
        }

        user.id = dbUser.id;
        (user as any).role = dbUser.role || "user";
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id || token.id;
        token.role = (user as any).role || token.role || "user";

        if ((user as any).isVoteSystem) {
          token.isVoteSystem = true;
          token.hasVoted = (user as any).hasVoted;
        }
      }

      if (!token.id && !token.isVoteSystem) {
        const dbUser: any = await prisma.user.findFirst({
          where: { email: String(token.email || "").trim().toLowerCase() },
          select: { id: true, role: true, isBlocked: true },
        });

        if (!dbUser || dbUser.isBlocked) {
          return {};
        }

        token.id = dbUser.id;
        token.role = dbUser.role || "user";
      } else if (!token.role && token.email && !token.isVoteSystem) {
        const dbUser: any = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isBlocked: true },
        });

        if (dbUser && !dbUser.isBlocked) {
          token.role = dbUser.role || "user";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) || "user";

        if (token.isVoteSystem) {
          (session.user as any).isVoteSystem = true;
          (session.user as any).hasVoted = token.hasVoted as boolean;
        }
      }

      return session;
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

const handler = NextAuth(authOptions);

export const handlers = {
  GET: handler,
  POST: handler,
};

export default handler;
