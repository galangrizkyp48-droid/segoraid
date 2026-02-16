"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'

export default function AuthInitializer() {
    const initAuth = useAuthStore(state => state.initAuth)

    useEffect(() => {
        const unsubscribe = initAuth()
        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [])

    return null
}
