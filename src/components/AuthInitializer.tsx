"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/lib/store/authStore'

export default function AuthInitializer() {
    const { data: session, status } = useSession()
    const { setUser, setLoading } = useAuthStore()

    useEffect(() => {
        if (status === 'loading') {
            setLoading(true)
            return
        }

        setLoading(false)

        if (session?.user) {
            // Sync NextAuth session into Zustand store
            const profile = (session.user as any).profile
            if (profile) {
                setUser(profile as any)
            } else {
                // Fetch profile from API
                fetch('/api/profile/me')
                    .then(r => r.ok ? r.json() : null)
                    .then(data => { if (data) setUser(data as any) })
                    .catch(console.error)
            }
        } else {
            setUser(null)
        }
    }, [session, status])

    return null
}
