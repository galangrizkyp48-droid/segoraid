"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react'

export default function BottomNav() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true
        if (path !== '/' && pathname.startsWith(path)) return true
        return false
    }

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/explore', icon: Compass, label: 'Explore' },
        { href: '/post/create', icon: Plus, label: '', highlight: true },
        { href: '/chat', icon: MessageCircle, label: 'Chat' },
        { href: '/profile', icon: User, label: 'Profile' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl h-16 px-6">
            <div className="flex justify-between items-center h-full relative">
                {navItems.map((item, index) => {
                    const active = isActive(item.href)
                    const Icon = item.icon

                    if (item.highlight) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="absolute left-1/2 -translate-x-1/2 -top-6"
                            >
                                <div className="w-14 h-14 bg-sky-500 rounded-full shadow-lg shadow-sky-200 flex items-center justify-center text-white hover:bg-sky-600 transition-all hover:scale-105 active:scale-95 ring-4 ring-white">
                                    <Icon size={28} strokeWidth={2.5} />
                                </div>
                            </Link>
                        )
                    }

                    // Adjust spacing for the middle gap
                    const isLeft = index < 2

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 w-12 transition-colors ${active ? 'text-sky-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon size={24} className={active ? 'fill-current' : ''} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
