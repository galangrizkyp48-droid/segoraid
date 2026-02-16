"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react'

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
        { href: '/post/create', icon: PlusSquare, label: 'Jual', highlight: true },
        { href: '/chat', icon: MessageCircle, label: 'Chat' },
        { href: '/profile', icon: User, label: 'Profile' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon

                    if (item.highlight) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center -mt-6"
                            >
                                <div className="bg-sky-600 text-white p-3 rounded-full shadow-lg hover:bg-sky-700 transition">
                                    <Icon size={24} />
                                </div>
                                <span className="text-xs font-medium mt-1 text-gray-600">{item.label}</span>
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-sky-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon size={24} className={active ? 'fill-current' : ''} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
