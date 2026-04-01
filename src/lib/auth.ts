import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        stateCode: { label: "State Code", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.stateCode || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const member = await Member.findOne({
          stateCode: credentials.stateCode,
          isActive: true,
        });

        if (!member) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          member.password
        );

        if (!isValid) return null;

        // Deny login if service completed more than 30 days ago
        if (
          member.serviceStatus === "completed" &&
          member.serviceCompletedAt
        ) {
          const completedAt = new Date(member.serviceCompletedAt).getTime();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (Date.now() - completedAt > thirtyDays) {
            return null;
          }
        }

        return {
          id: member._id.toString(),
          name: member.name,
          email: member.stateCode,
          role: member.role,
          group: member.group?.toString() || null,
          mustChangePassword: member.mustChangePassword,
          serviceStatus: member.serviceStatus || "serving",
          serviceCompletedAt: member.serviceCompletedAt?.toISOString() || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
        token.group = (user as { group: string | null }).group;
        token.mustChangePassword = (user as { mustChangePassword: boolean }).mustChangePassword;
        token.serviceStatus = (user as { serviceStatus: string }).serviceStatus;
        token.serviceCompletedAt = (user as { serviceCompletedAt: string | null }).serviceCompletedAt;
      }
      // Allow updating token from client via update()
      if (trigger === "update" && updateData) {
        if (typeof updateData.mustChangePassword === "boolean") {
          token.mustChangePassword = updateData.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).group = token.group;
        (session.user as Record<string, unknown>).mustChangePassword = token.mustChangePassword;
        (session.user as Record<string, unknown>).serviceStatus = token.serviceStatus;
        (session.user as Record<string, unknown>).serviceCompletedAt = token.serviceCompletedAt;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
