import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb";

const secret = process.env.NEXTAUTH_SECRET || "your_secret_key";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { db, client } = await connectToDatabase();
        const user = await db
          .collection("users")
          .findOne({ email: credentials.email });

        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          await disconnectFromDatabase(client);
          throw new Error("Invalid credentials");
        }

        await disconnectFromDatabase(client);
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },
  jwt: {
    secret,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },
};

// Export the appropriate HTTP methods
export async function POST(request) {
  return NextAuth(authOptions)(request);
}

// Optional: handle other HTTP methods (if needed)
export async function GET(request) {
  return NextAuth(authOptions)(request);
}
