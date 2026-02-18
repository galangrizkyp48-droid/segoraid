"use client"

import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice } from '@/lib/utils/formatters'
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EmptyState from '@/components/shared/EmptyState'

export default function CartPage() {
    const router = useRouter()
    const { items, removeItem, updateQuantity, getTotal, getItemsBySeller } = useCartStore()
    const groupedItems = getItemsBySeller()
    const total = getTotal()

    if (items.length === 0) {
        return (
            <EmptyState
                icon={<div className="text-6xl">🛒</div>}
                title="Keranjang Kosong"
                description="Wah, keranjangmu masih kosong nih. Yuk cari barang yang kamu butuhkan!"
                actionLabel="Mulai Belanja"
                actionHref="/explore"
            />
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="sticky top-0 z-10 bg-white border-b p-4">
                <h1 className="text-xl font-bold">Keranjang ({items.length})</h1>
            </header>

            <div className="p-4 space-y-4">
                {Object.entries(groupedItems).map(([sellerId, sellerItems]) => (
                    <div key={sellerId} className="bg-white rounded-xl p-4 shadow-sm border">
                        {/* Seller Header */}
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                            <input type="checkbox" checked className="accent-sky-600" readOnly />
                            <img
                                src={sellerItems[0].sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerItems[0].sellerName || 'Seller')}&background=random`}
                                alt={sellerItems[0].sellerName || 'Seller'}
                                className="w-6 h-6 rounded-full object-cover border"
                            />
                            <span className="font-semibold text-sm">{sellerItems[0].sellerName || `Seller ${sellerId.slice(0, 5)}`}</span>
                        </div>

                        {/* Items */}
                        <div className="space-y-4">
                            {sellerItems.map((item) => (
                                <div key={`${item.postId}_${item.variant}`} className="flex gap-3">
                                    <input type="checkbox" checked className="mt-1 accent-sky-600" readOnly />

                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                                    />

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium line-clamp-2">{item.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{item.variant}</p>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <p className="text-sm font-bold text-orange-600">
                                                {formatPrice(item.price)}
                                            </p>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => removeItem(item.postId)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="flex items-center border rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.postId, Math.max(1, item.quantity - 1))}
                                                        className="p-1 hover:bg-gray-100"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.postId, Math.min(item.stock, item.quantity + 1))}
                                                        className="p-1 hover:bg-gray-100"
                                                        disabled={item.quantity >= item.stock}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Checkout Bar */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 shadow-lg md:static md:shadow-none md:mt-4 md:rounded-xl">
                <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Total Harga</span>
                        <span className="text-lg font-bold text-orange-600">{formatPrice(total)}</span>
                    </div>

                    <button
                        onClick={() => router.push('/checkout')}
                        className="bg-sky-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-700 transition flex items-center gap-2"
                    >
                        Checkout <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
