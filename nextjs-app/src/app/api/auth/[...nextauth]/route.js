import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";

// Configure NextAuth options
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          // Check if user already exists
          let existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // Link Google account if not already linked
            if (!existingUser.googleId) {
              existingUser.googleId = profile.sub;
              await existingUser.save();
            }
          } else {
            // Create new user
            await User.create({
              googleId: profile.sub,
              name: user.name,
              email: user.email,
              isDonor: false, // default, user will choose later
              isHospital: false,
              password: Math.random().toString(36).slice(-8), // random password
              location: "Unknown", // default value
              bloodGroup: "O+", // default value
              needsAccountTypeSelection: true, // Flag to indicate user needs to choose account type
            });
          }

          return true;
        } catch (error) {
          console.error("OAuth sign in error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.isDonor = dbUser.isDonor;
            token.isHospital = dbUser.isHospital;
            token.needsAccountTypeSelection = dbUser.needsAccountTypeSelection;
            token.bloodGroup = dbUser.bloodGroup;
            token.location = dbUser.location;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.isDonor = token.isDonor;
        session.user.isHospital = token.isHospital;
        session.user.needsAccountTypeSelection =
          token.needsAccountTypeSelection;
        session.user.bloodGroup = token.bloodGroup;
        session.user.location = token.location;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Always redirect to oauth-success after OAuth login
      return `${baseUrl}/oauth-success`;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key",
};

// Create the handler
const handler = NextAuth(authOptions);

// Export for both GET and POST
export { handler as GET, handler as POST };

// Also export authOptions for use in other files
export { authOptions };
