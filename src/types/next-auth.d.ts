import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            profile?: Record<string, any>
        } & DefaultSession['user']
    }

    interface User extends DefaultUser {
        id: string
        profile?: Record<string, any>
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        id: string
        profile?: Record<string, any>
    }
}
