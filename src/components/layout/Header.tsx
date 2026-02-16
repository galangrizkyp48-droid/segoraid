"use client"

import Link from 'next/link'
import { ShoppingCart, Bell } from 'lucide-react'
import SearchBar from './SearchBar'
import { useCartStore } from '@/lib/store/cartStore'

export default function Header() {
    const { items } = useCartStore()
    const itemCount = items.length

    return (
        <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
            <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl px-4 py-3 flex items-center gap-3">
                <Link href="/" className="text-xl font-bold text-sky-600 shrink-0">
                    Segora
                </Link>

                <SearchBar />

                <Link href="/notifications" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <Bell size={24} />
                    {/* Notification badge can go here */}
                </Link>

                <Link href="/cart" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ShoppingCart size={24} />
                    {itemCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                            {itemCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    )
}
