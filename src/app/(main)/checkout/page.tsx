"use client"

import { useCartStore } from '@/lib/store/cartStore'
import { useAuthStore } from '@/lib/store/authStore'
import { formatPrice } from '@/lib/utils/formatters'
import { ArrowLeft, MapPin, Truck, CreditCard, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CheckoutPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const { items, getTotal, clearCart } = useCartStore()
    const total = getTotal()
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        setLoading(true)
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Clear cart and redirect
        clearCart()
        alert('🎉 Pembayaran Berhasil! Pesanan akan segera diproses.')
        router.push('/') // Or order success page
    }

    if (items.length === 0) {
        router.replace('/cart')
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="sticky top-0 z-10 bg-white border-b p-4 flex items-center gap-3">
                <button onClick={() => router.back()}><ArrowLeft size={24} /></button>
                <h1 className="text-lg font-bold">Pengiriman</h1>
            </header>

            <div className="p-4 space-y-4">
                {/* Address */}
                <div className="bg-white p-4 rounded-xl border">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <MapPin size={18} />
                        <span className="text-sm font-semibold">Alamat Pengiriman</span>
                    </div>
                    <div className="pl-6">
                        <p className="font-semibold text-sm">{user?.name} | {user?.phone || 'No. HP belum diatur'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {user?.location
                                ? user.location
                                : user?.university_name
                                    ? `${user.university_name} (Lokasi belum diatur)`
                                    : 'Alamat belum diatur'}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/profile/edit')}
                        className="w-full mt-3 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Ubah Alamat / Kontak
                    </button>
                </div>

                {/* Order Items Summary */}
                <div className="bg-white p-4 rounded-xl border">
                    <h3 className="font-semibold text-sm mb-3">Rincian Pesanan</h3>
                    <div className="space-y-3">
                        {items.map(item => (
                            <div key={item.postId} className="flex gap-3">
                                <img src={item.image} className="w-14 h-14 rounded bg-gray-100 object-cover" />
                                <div className="flex-1">
                                    <p className="text-sm line-clamp-1">{item.title}</p>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-xs text-gray-500">{item.quantity} x {formatPrice(item.price)}</span>
                                        <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shipping Method */}
                <div className="bg-white p-4 rounded-xl border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Truck size={18} />
                            <span className="text-sm font-semibold">Pengiriman</span>
                        </div>
                        <button className="text-xs text-sky-600 font-semibold">Ubah</button>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                            <p className="text-sm font-semibold">Reguler (J&T Express)</p>
                            <p className="text-xs text-gray-500">Estimasi tiba 18-20 Feb</p>
                        </div>
                        <span className="text-sm font-bold">{formatPrice(12000)}</span>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white p-4 rounded-xl border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-600">
                            <CreditCard size={18} />
                            <span className="text-sm font-semibold">Metode Pembayaran</span>
                        </div>
                        <button className="text-xs text-sky-600 font-semibold">Lihat Semua</button>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-5 bg-blue-600 rounded"></div>
                            <p className="text-sm font-semibold">Transfer Bank BCA</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white p-4 rounded-xl border space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal Produk</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Biaya Pengiriman</span>
                        <span>{formatPrice(12000)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Biaya Layanan</span>
                        <span>{formatPrice(1000)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total Pembayaran</span>
                        <span className="text-orange-600">{formatPrice(total + 12000 + 1000)}</span>
                    </div>
                </div>
            </div>

            {/* Pay Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 px-6 md:static md:mt-4 md:rounded-xl">
                <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : 'Bayar Sekarang'}
                    </button>
                </div>
            </div>
        </div>
    )
}
