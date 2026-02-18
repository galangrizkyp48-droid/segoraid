"use client"

import { useCartStore } from '@/lib/store/cartStore'
import { useAuthStore } from '@/lib/store/authStore'
import { formatPrice } from '@/lib/utils/formatters'
import { ArrowLeft, MapPin, Truck, CreditCard, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function CheckoutPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const { items, getTotal, clearCart } = useCartStore()
    const total = getTotal()
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        setLoading(true)
        try {
            if (!user) {
                router.push('/login')
                return
            }

            const ordersToCreate = items.map(item => ({
                buyer_id: user.id,
                seller_id: item.sellerId,
                post_id: item.postId,
                quantity: item.quantity,
                total_price: item.price * item.quantity, // + fees if any
                status: 'cod_waiting',
                payment_method: 'Uang Tunai (COD)', // Simplification
                delivery_method: 'COD',
                location_meetup: 'Universitas Indonesia - Perpustakaan Pusat', // Mocked default
                notes: 'Tolong barangnya dibawa tepat waktu ya.', // Mocked/Input
                snapshot_title: item.title,
                snapshot_price: item.price,
                snapshot_image: item.image
            }))

            const { data, error } = await supabase
                .from('orders')
                .insert(ordersToCreate)
                .select()

            if (error) throw error

            clearCart()

            // If multiple orders, ideally go to order history.
            // For now, redirect to the first one created.
            if (data && data.length > 0) {
                router.replace(`/transaction/${data[0].id}`)
            } else {
                router.replace('/')
            }

            toast.success('Pesanan berhasil dibuat!')

        } catch (error) {
            console.error(error)
            toast.error('Gagal membuat pesanan')
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        router.replace('/cart')
        return null
    }

    // Interactive Stepper
    const steps = [
        { label: 'Cart', active: true },
        { label: 'Detail', active: true },
        { label: 'Bayar', active: true },
        { label: 'Review', active: false },
    ]

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b">
                <div className="flex items-center gap-3 p-4">
                    <button onClick={() => router.back()}><ArrowLeft size={24} /></button>
                    <h1 className="text-lg font-bold flex-1 text-center pr-8">Konfirmasi & Review</h1>
                </div>
                {/* Stepper */}
                <div className="px-8 pb-4 flex justify-between relative">
                    {/* Line background */}
                    <div className="absolute top-[14px] left-10 right-10 h-0.5 bg-gray-200 -z-0"></div>
                    {/* Progress Line */}
                    <div className="absolute top-[14px] left-10 right-1/4 h-0.5 bg-sky-500 -z-0"></div>

                    {steps.map((step, i) => (
                        <div key={i} className="flex flex-col items-center z-10 relative">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${step.active ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-400'
                                }`}>
                                {i + 1}
                            </div>
                            <span className={`text-[10px] font-medium ${step.active ? 'text-sky-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </header>

            <div className="p-4 space-y-4">
                {/* Location (COD) */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-sky-600">
                            <MapPin size={18} fill="currentColor" className="opacity-20" />
                            <span className="font-bold text-gray-900">Lokasi Ketemuan (COD)</span>
                        </div>
                        <button className="text-xs font-bold text-sky-600">Ubah</button>
                    </div>

                    <div className="pl-0">
                        <p className="font-bold text-gray-800 text-sm">Universitas Indonesia - Perpustakaan Pusat</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            Jl. Prof. DR. Mahar Mardjono, Pondok Cina, Beji, Depok.
                        </p>
                        <div className="mt-3 bg-sky-50 border border-sky-100 p-3 rounded-lg">
                            <p className="text-xs text-sky-600 italic">"Tunggu di lobi utama dekat Starbucks, jam 16:00 WIB."</p>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Detail Pesanan</h3>

                    {/* Seller Info (Mocked from first item for now) */}
                    <div className="flex items-center gap-2 mb-4">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(items[0]?.sellerName || 'Seller')}`} className="w-6 h-6 rounded-full" />
                        <span className="font-bold text-sm">{items[0]?.sellerName || 'Penjual'}</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Pro Seller</span>
                    </div>

                    <div className="space-y-6">
                        {items.map(item => (
                            <div key={item.postId}>
                                <div className="flex gap-3 mb-3">
                                    <img src={item.image} className="w-20 h-20 rounded-lg bg-gray-100 object-cover border" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm line-clamp-2 leading-snug mb-1">{item.title}</p>
                                        <p className="text-xs text-gray-500 mb-2">(Bekas Terawat)</p>
                                        <p className="text-xs text-gray-500">{item.quantity} x {formatPrice(item.price)}</p>
                                        <p className="text-sm font-bold text-sky-600 mt-1">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                                {/* Note Input */}
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-1">Catatan untuk penjual:</p>
                                    <input
                                        type="text"
                                        placeholder="Tulis pesan..."
                                        className="w-full bg-transparent text-sm font-medium outline-none italic text-gray-700 placeholder:font-normal"
                                        defaultValue="Tolong sampul plastiknya jangan dilepas ya kak."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mock Services Item (Reference Design) */}
                <div className="bg-white p-4 rounded-xl border shadow-sm flex gap-3 items-center">
                    <img src="https://ui-avatars.com/api/?name=Budi+Jasa" className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                        <p className="text-sm font-bold">Budi Jasa Desain</p>
                        <div className="mt-2 flex gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Jasa Review CV & LinkedIn</p>
                                <p className="text-xs text-gray-500">Professional</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Payment Method */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-center bg-sky-50 p-4 rounded-xl border border-sky-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold tracking-tighter">
                                GoPay
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">GoPay</p>
                                <p className="text-xs text-gray-500">Saldo: Rp 450.000</p>
                            </div>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-sky-500 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-sky-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                    <h3 className="font-bold text-sm">Rincian Biaya</h3>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} Produk)</span>
                        <span className="font-medium text-gray-900">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Biaya Layanan</span>
                        <span className="font-medium text-gray-900">{formatPrice(2000)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Biaya COD/Admin</span>
                        <span className="font-medium text-gray-900">Rp 0</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1"><Truck size={14} /> Saldo Segora (Cashback)</span>
                        <span className="font-medium">- Rp 12.000</span>
                    </div>

                    <div className="border-t border-dashed pt-3 mt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total Pembayaran</span>
                        <span className="text-xl font-bold text-sky-600">{formatPrice(total + 2000 - 12000)}</span>
                    </div>
                </div>

                {/* Terms */}
                <div className="flex gap-2 items-start px-2">
                    <div className="mt-0.5 text-gray-400"><input type="checkbox" checked readOnly className="rounded border-gray-300" /></div>
                    <p className="text-[10px] text-gray-400 leading-tight">
                        Dengan menekan tombol di bawah, Anda menyetujui <span className="text-sky-500 underline">Syarat & Ketentuan Segora</span> serta kebijakan perlindungan pembeli kami.
                    </p>
                </div>
            </div>

            {/* Pay Button Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 px-6 md:static md:mt-4 md:rounded-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Tagihan</span>
                        <span className="text-xl font-bold text-gray-900">{formatPrice(total + 2000 - 12000)}</span>
                    </div>
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="flex-1 bg-sky-500 text-white py-3 rounded-xl font-bold hover:bg-sky-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
                    >
                        {loading ? 'Memproses...' : (
                            <>
                                <CreditCard size={18} /> Bayar Sekarang
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
