"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { MessageCircle, Share2, ArrowLeft, MoreVertical, MapPin } from 'lucide-react'
import { formatPrice, formatTimeAgo } from '@/lib/utils/formatters'
import CategoryChip from '@/components/shared/CategoryChip'
import { Post } from '@/lib/types/user'

export default function PostDetailClient() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuthStore()
    const { addItem } = useCartStore()

    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeImage, setActiveImage] = useState(0)

    useEffect(() => {
        fetchPost()
    }, [id])

    const fetchPost = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles(name, avatar_url, university_name)')
                .eq('id', id)
                .single()

            if (error) throw error

            if (data) {
                setPost(data as Post)
            }
        } catch (error) {
            console.error('Error fetching post:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = () => {
        if (!user) {
            router.push('/login')
            return
        }
        if (post) {
            addItem({
                postId: post.id,
                sellerId: post.user_id,
                sellerName: post.profiles?.name || post.sellerName || 'Seller',
                sellerAvatar: post.profiles?.avatar_url || post.sellerAvatar,
                title: post.title,
                image: post.images[0],
                price: post.price || 0,
                quantity: 1,
                stock: post.stock || 1,
            })
            alert('Ditambahkan ke keranjang!')
        }
    }

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
    if (!post) return <div className="min-h-screen bg-white flex items-center justify-center">Post not found</div>

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-transparent pointer-events-none md:bg-white md:border-b md:pointer-events-auto">
                <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl flex items-center justify-between p-4 pointer-events-auto">
                    <button
                        onClick={() => router.back()}
                        className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition md:shadow-none"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex gap-3">
                        <button className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition md:shadow-none">
                            <Share2 size={20} />
                        </button>
                        <button className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition md:shadow-none">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Image Gallery */}
            <div className="relative aspect-square md:aspect-video bg-gray-100">
                <img
                    src={post.images[activeImage]}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />

                {/* Dots */}
                {post.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {post.images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(idx)}
                                className={`w-2 h-2 rounded-full transition ${activeImage === idx ? 'bg-white scale-125' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 py-6">
                {/* Title & Price */}
                <div className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-xl font-bold leading-tight">{post.title}</h1>
                        <div className="flex flex-col items-end shrink-0">
                            <p className="text-xl font-bold text-orange-600">
                                {post.price_type === 'free' ? 'GRATIS' : formatPrice(post.price)}
                            </p>
                            {post.negotiable && (
                                <span className="text-xs text-orange-600 font-medium">Bisa Nego</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{post.condition === 'new' ? 'Baru' : 'Bekas'}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(new Date(post.created_at))}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <MapPin size={12} /> {post.campus || 'Kampus'}
                        </span>
                    </div>
                </div>

                <hr className="border-gray-100 my-4" />

                {/* Seller Info */}
                <div className="flex items-center gap-3 mb-6">
                    <img
                        src={post.profiles?.avatar_url || post.sellerAvatar || '/default-avatar.png'}
                        alt={post.profiles?.name || post.sellerName}
                        className="w-12 h-12 rounded-full object-cover border"
                    />
                    <div className="flex-1">
                        <h3 className="font-semibold">{post.profiles?.name || post.sellerName}</h3>
                        <p className="text-xs text-gray-500">{post.profiles?.university_name || post.sellerUniversity}</p>
                    </div>
                    <button
                        onClick={() => router.push(`/profile/${post.user_id}`)}
                        className="text-sky-600 text-sm font-semibold border border-sky-600 px-4 py-1.5 rounded-full hover:bg-sky-50 transition"
                    >
                        Lihat Profile
                    </button>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Deskripsi</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                        {post.description}
                    </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <CategoryChip type={post.type} category={post.category} />
                    {/* @ts-ignore */}
                    {post.hashtags?.map((tag: string) => (
                        <span key={tag} className="text-xs text-gray-400">#{tag}</span>
                    ))}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 px-6 md:static md:border-t-0 md:bg-transparent md:p-0">
                <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl flex gap-3">
                    <button
                        onClick={() => router.push(`/chat?postId=${post.id}&sellerId=${post.user_id}`)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 border border-sky-600 text-sky-600 py-2.5 rounded-xl font-semibold hover:bg-sky-50 transition"
                    >
                        <MessageCircle size={20} />
                        <span className="text-xs">Chat</span>
                    </button>

                    <button
                        onClick={handleAddToCart}
                        className="flex-[2] bg-sky-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-sky-700 transition shadow-lg shadow-sky-200"
                    >
                        {post.type === 'service' ? 'Booking Jasa' : 'Beli Sekarang'}
                    </button>
                </div>
            </div>
        </div>
    )
}
