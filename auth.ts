// file: auth.ts

import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import { sendMail } from "@/lib/mail";
import {
  googleLoginTemplate,
  loginTemplate,
  registerSuccessTemplate,
} from "@/lib/emailTemplates";
import { getRequestInfo } from "@/lib/requestInfo";
import User from "@/models/User";
import VoteUser from "@/models/VoteUser";

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

        await connectDB();

        const user: any = await User.findOne({ email }).select("+password");

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        if (user.isBlocked) return null;

        const lang = user.languagePreference === "mm" ? "mm" : "en";

        try {
          const info = await getRequestInfo();

          await sendMail({
            to: user.email,
            subject:
              lang === "mm"
                ? "Alumni Network ဝင်ရောက်မှု အသိပေးချက်"
                : "Alumni Network Login Alert",
            html: loginTemplate(user.name || "User", lang, {
              email: user.email,
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
          id: user._id.toString(),
          name: user.name || "",
          email: user.email,
          image:
            user.image && !String(user.image).startsWith("data:")
              ? user.image
              : null,
          role: user.role || "user",
        };
      },
    }),

    // --- 2. VOTING SYSTEM LOGIN ---
    CredentialsProvider({
      id: "vote-login", // Unique ID used to call this specific login
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

        await connectDB();

        // Check the vote_users collection
        const user: any = await VoteUser.findOne({ email }).select("+password");

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email,
          role: user.role || "VOTER",
          hasVoted: user.hasVoted,
          isVoteSystem: true, // Flag to identify which database they belong to
        };
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow redirects to your custom production domains
      if (
        url.startsWith("https://alumni.ucsh.edu.mm") ||
        url.startsWith("https://ucshalumninetwork.netlify.app")
      ) {
        return url;
      }

      // Allow relative paths (e.g. /dashboard)
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Allow same-origin redirects
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (error) {}

      return baseUrl;
    },

    async signIn({ user, account }) {
      await connectDB();

      if (account?.provider === "google" && user.email) {
        const email = user.email.trim().toLowerCase();
        const info = await getRequestInfo();

        let dbUser: any = await User.findOne({ email });

        if (!dbUser) {
          dbUser = await User.create({
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
            personalContact: {},
            professionalContact: {},
            contactInfo: {},
            socialLinks: {},
            experiences: [],
            skills: [],
            projects: [],
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
            dbUser.image = user.image;
            await dbUser.save();
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

        user.id = dbUser._id.toString();
        (user as any).role = dbUser.role || "user";
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id || token.id;
        token.role = (user as any).role || token.role || "user";

        // Pass voting fields into the token
        if ((user as any).isVoteSystem) {
          token.isVoteSystem = true;
          token.hasVoted = (user as any).hasVoted;
        }
      }

      // Prevent NextAuth from looking for a VoteUser in the Alumni User DB
      if ((!token.id || !token.role) && token.email && !token.isVoteSystem) {
        await connectDB();

        const dbUser: any = await User.findOne({
          email: String(token.email).trim().toLowerCase(),
        }).select("_id role isBlocked");

        if (!dbUser || dbUser.isBlocked) {
          return {};
        }

        token.id = dbUser._id.toString();
        token.role = dbUser.role || "user";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) || "user";

        // Pass voting fields into the active session
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