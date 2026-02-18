"use client"

import { SessionProvider } from 'next-auth/react'
import AuthInitializer from '@/components/AuthInitializer'

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthInitializer />
            {children}
        </SessionProvider>
    )
}
