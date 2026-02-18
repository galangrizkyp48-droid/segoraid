"use client"

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Hide bottom nav on specific pages if needed (e.g. detailed chat)
    // For now show on all main pages
    const showBottomNav = !pathname.includes('/chat/') || pathname === '/chat'

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm md:max-w-2xl lg:max-w-4xl">
                {children}
            </main>
            {showBottomNav && <BottomNav />}
        </div>
    )
}
