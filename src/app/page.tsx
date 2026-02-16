'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function RootRedirect() {
    useEffect(() => {
        // Client-side redirect to login for now
        // This ensures SOMETHING loads instead of 404
        window.location.href = '/login'
    }, [])

    // Server-side redirect won't work with static export
    // redirect('/login')

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Redirecting...</p>
        </div>
    )
}
