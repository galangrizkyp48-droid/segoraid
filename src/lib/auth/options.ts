import CredentialsProvider from 'next-auth/providers/credentials'
import sql from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                try {
                    const users = await sql`
                        SELECT * FROM auth.users WHERE email = ${credentials.email} LIMIT 1
                    `
                    const user = users[0]
                    if (!user) return null

                    const valid = await bcrypt.compare(credentials.password, user.encrypted_password)
                    if (!valid) return null

                    const profiles = await sql`
                        SELECT * FROM public.profiles WHERE id = ${user.id} LIMIT 1
                    `
                    const profile = profiles[0]

                    return {
                        id: user.id,
                        email: user.email,
                        name: profile?.name ?? user.email,
                        image: profile?.avatar_url ?? null,
                        profile,
                    }
                } catch (err) {
                    console.error('NextAuth authorize error:', err)
                    return null
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                // @ts-ignore
                token.profile = user.profile
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                // @ts-ignore
                session.user.profile = token.profile
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
}
