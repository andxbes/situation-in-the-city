import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/database/user';

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            async authorize(credentials) {
                const { email, password } = credentials;

                const user = getUserByEmail(email);

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);

                if (isPasswordValid) {
                    return { id: user.id.toString(), email: user.email, role: user.role };
                }

                return null;
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.userId) {
                session.user.id = token.userId;
            }
            if (token?.role) {
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/',
    },
});
