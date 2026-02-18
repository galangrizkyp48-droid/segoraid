"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Clock, CheckCircle, MessageCircle, ChevronLeft } from 'lucide-react'
import { formatPrice } from '@/lib/utils/formatters'
import { supabase } from '@/lib/supabase/client'

export default function TransactionClient() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (orderId) {
            fetchOrder()
        }
    }, [orderId])

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    seller:seller_id (id, name, avatar_url, university_name),
                    post:post_id (id, title, price, images, condition)
                `)
                .eq('id', orderId)
                .single()

            if (error) throw error
            setOrder(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
    if (!order) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Order not found</div>

    // Helper to get image (snapshot or live)
    const productImage = order.snapshot_image || order.post?.images?.[0] || 'https://via.placeholder.com/150'
    const productTitle = order.snapshot_title || order.post?.title || 'Unknown Item'
    const productPrice = order.snapshot_price || order.post?.price || 0

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <header className="bg-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={() => router.push('/')}><ChevronLeft size={24} /></button>
                <h1 className="font-bold text-lg">Detail Pesanan</h1>
                <div className="w-6"></div> {/* Spacer */}
            </header>

            {/* Status Banner */}
            <div className="bg-indigo-100 p-6 flex items-center gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-full">
                    {order.status === 'completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                </div>
                <div>
                    <h2 className="font-bold text-blue-700 text-lg leading-tight">
                        {order.status === 'completed' ? 'Transaksi Selesai' :
                            order.status === 'cod_waiting' ? 'Menunggu Ketemuan COD' :
                                'Menunggu Konfirmasi'}
                    </h2>
                    <p className="text-xs text-blue-500 mt-1">
                        {order.status === 'completed' ? 'Terima kasih telah berbelanja.' : 'Harap hubungi penjual untuk konfirmasi.'}
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-4 -mt-4">
                {/* Location Card */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <MapPin size={20} className="text-blue-600" fill="currentColor" />
                            <span className="font-bold text-gray-900">Detail Ketemuan</span>
                        </div>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">PUBLIK</span>
                    </div>

                    <div className="flex gap-4">
                        {/* Map Thumbnail */}
                        <div className="w-20 h-20 bg-blue-50 rounded-2xl overflow-hidden relative shrink-0">
                            <img src="https://static-maps.yandex.ru/1.x/?lang=en_US&ll=106.8272, -6.3638&z=15&l=map&size=200,200" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin size={16} className="text-blue-600 drop-shadow-md" fill="currentColor" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{order.location_meetup || 'Lokasi belum diset'}</h3>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{order.notes || 'Tidak ada catatan tambahan.'}</p>
                            <p className="text-sm font-bold text-blue-600 mt-2">Jam: TBD</p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.location_meetup || 'Universitas Indonesia')}`, '_blank')}
                        className="w-full mt-4 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2"
                    >
                        <MapPin size={16} /> Lihat di Peta
                    </button>

                    <div className="bg-orange-50 p-3 rounded-xl flex gap-3 mt-4 items-start">
                        <div className="text-orange-500 shrink-0 mt-0.5">⚠️</div>
                        <p className="text-[10px] text-orange-600 leading-tight">
                            Tips: Selalu bertemu di tempat ramai dan cek barang sebelum membayar.
                        </p>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6">Status Perjalanan</h3>
                    <div className="relative pl-2 space-y-8">
                        {/* Line */}
                        <div className="absolute left-[19px] top-2 bottom-6 w-0.5 bg-gray-200"></div>

                        {/* Step 1 */}
                        <div className="flex gap-4 relative z-0">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 border-4 border-white shadow-sm">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Pesanan Dibuat</p>
                                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Step 2 (Active) */}
                        <div className="flex gap-4 relative z-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 border-4 shadow-xl ${order.status === 'cod_waiting' ? 'bg-blue-600 border-blue-100 animate-pulse' : 'bg-gray-400 border-white'}`}>
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${order.status === 'cod_waiting' ? 'text-blue-600' : 'text-gray-400'}`}>Menunggu Ketemuan</p>
                                <p className="text-xs text-gray-500">Sekarang</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4 relative z-0 opacity-100">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 border-4 ${order.status === 'completed' ? 'bg-green-500 border-green-100' : 'bg-gray-100 text-gray-400 border-white'}`}>
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>Selesai</p>
                                <p className="text-xs text-gray-400">{order.status === 'completed' ? 'Telah Diselesaikan' : 'Belum tercapai'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Info */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Informasi Produk</h3>
                    <div className="flex gap-4 mb-6">
                        <img src={productImage} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md bg-gray-100" />
                        <div className="flex-1">
                            <p className="font-bold text-sm leading-snug">{productTitle}</p>
                            <p className="font-bold text-blue-600 mt-1">{formatPrice(productPrice)}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t pt-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={order.seller?.avatar_url || `https://ui-avatars.com/api/?name=${order.seller?.name || 'Seller'}`}
                                className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                            />
                            <div>
                                <p className="font-bold text-sm">{order.seller?.name || 'Unknown Seller'}</p>
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{order.seller?.university_name || 'Kampus'}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(`/chat?sellerId=${order.seller_id}`)}
                            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                        >
                            <MessageCircle size={20} />
                        </button>
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                    <h3 className="font-bold text-gray-900 mb-3">Rincian Pembayaran</h3>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Harga Barang</span>
                        <span>{formatPrice(productPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Biaya Layanan</span>
                        <span>{formatPrice(2000)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t font-bold text-lg">
                        <span>Total Pembayaran</span>
                        <span className="text-blue-600">{formatPrice(order.total_price + 2000)}</span>
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 px-6 mb-safe pt-2">
                <div className="max-w-md mx-auto flex gap-3">
                    <button
                        onClick={() => window.open(`https://wa.me/?text=Halo saya mau COD untuk pesanan ${productTitle}`, '_blank')}
                        className="flex-1 py-3 bg-blue-50 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition"
                    >
                        Hubungi Penjual
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-300"
                    >
                        Kembali ke Home
                    </button>
                </div>
            </div>
        </div>
    )
}
