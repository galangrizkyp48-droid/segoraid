import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { Heart, MessageCircle, Share2, ShoppingCart, Bookmark } from 'lucide-react'
import { formatPrice, formatTimeAgo } from '@/lib/utils/formatters'
import CategoryChip from '@/components/shared/CategoryChip'
import { Post } from '@/lib/types/user'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

export default function PostCard({ post }: { post: Post }) {
    const router = useRouter()
    const { user } = useAuthStore()
    const { addItem } = useCartStore()
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(post.likes_count || post.stats?.likes || 0)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user && post.id) {
            checkLikeStatus()
            checkSavedStatus()
        }
    }, [user, post.id])


    const checkLikeStatus = async () => {
        if (!user) return

        try {
            const { count } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id)
                .eq('user_id', user.id)

            if (count && count > 0) setLiked(true)
        } catch (error) {
            console.error('Error checking like status:', error)
        }
    }

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) {
            router.push('/login')
            return
        }

        const previousLiked = liked
        const previousCount = likeCount

        // Optimistic update
        setLiked(!previousLiked)
        setLikeCount(prev => previousLiked ? prev - 1 : prev + 1)

        try {
            if (previousLiked) {
                // Unlike
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)

                if (error) throw error
            } else {
                // Like
                const { error } = await supabase
                    .from('likes')
                    .insert({ post_id: post.id, user_id: user.id })

                if (error) throw error
            }
        } catch (error) {
            console.error('Error toggling like:', error)
            // Revert on error
            setLiked(previousLiked)
            setLikeCount(previousCount)
            toast.error('Gagal memproses like')
        }
    }

    const checkSavedStatus = async () => {
        if (!user) return

        try {
            const { count } = await supabase
                .from('saved_posts')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id)
                .eq('user_id', user.id)

            if (count && count > 0) setSaved(true)
        } catch (error) {
            console.error('Error checking saved status:', error)
        }
    }

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) {
            router.push('/login')
            return
        }

        const previousSaved = saved

        // Optimistic update
        setSaved(!previousSaved)

        try {
            if (previousSaved) {
                // Unsave
                const { error } = await supabase
                    .from('saved_posts')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)

                if (error) throw error
                toast.success('Dihapus dari simpanan')
            } else {
                // Save
                const { error } = await supabase
                    .from('saved_posts')
                    .insert({ post_id: post.id, user_id: user.id })

                if (error) throw error
                toast.success('Disimpan!')
            }
        } catch (error) {
            console.error('Error toggling save:', error)
            // Revert on error
            setSaved(previousSaved)
            toast.error('Gagal menyimpan')
        }
    }

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/post/${post.id}#comments`)
    }

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation()

        const url = `${window.location.origin}/post/${post.id}`

        try {
            if (navigator.share) {
                await navigator.share({
                    title: post.title,
                    text: post.description,
                    url: url
                })
            } else {
                await navigator.clipboard.writeText(url)
                toast.success('Link disalin!')
            }
        } catch (error) {
            console.error('Error sharing:', error)
        }
    }

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!user) {
            router.push('/login')
            return
        }

        if (post.type !== 'product') return

        addItem({
            postId: post.id,
            sellerId: post.user_id,
            title: post.title,
            image: post.images[0],
            price: post.price || 0,
            quantity: 1,
            stock: 99,
        })

        toast.success('Ditambahkan ke keranjang!')
    }

    return (
        <div
            onClick={() => router.push(`/post/${post.id}`)}
            className="bg-white border-b cursor-pointer hover:bg-gray-50 transition"
        >
            {/* Seller Info */}
            <div className="flex items-center gap-3 p-4">
                <img
                    src={post.profiles?.avatar_url || post.sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.name || post.sellerName || 'User')}&background=random`}
                    alt={post.profiles?.name || post.sellerName}
                    className="w-10 h-10 rounded-full cursor-pointer object-cover border"
                    onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/profile/${post.user_id}`)
                    }}
                    onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.name || 'User')}&background=random`
                    }}
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.profiles?.name || post.sellerName}</p>
                        <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded">
                            {post.profiles?.university_name || post.sellerUniversity}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        {formatTimeAgo(new Date(post.created_at))} · {post.campus || 'Kampus'}
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    className="text-gray-400 hover:text-sky-600 transition"
                >
                    <Bookmark className={saved ? 'fill-current text-sky-600' : ''} size={20} />
                </button>
            </div>

            {/* Images */}
            {post.images && post.images.length > 0 && post.images[0] && (
                <div className="relative aspect-square w-full bg-gray-100">
                    <Image
                        src={post.images[0]}
                        alt={post.title}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        unoptimized={true} // Bypass Next.js Image Optimization to fix loading issues
                        onError={(e) => {
                            // Fallback if image fails
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {/* Type Badge */}
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${post.type === 'product' ? 'bg-orange-100 text-orange-700' :
                        post.type === 'service' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {post.type === 'product' ? '📦 PRODUK' : post.type === 'service' ? '🎨 JASA' : '💼 INFO'}
                    </span>
                    {post.negotiable && (
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold">
                            NEGO
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-1 line-clamp-2">{post.title}</h3>

                {/* Description */}
                <p className="text-gray-700 mb-2 line-clamp-3">{post.description}</p>

                {/* Price */}
                {post.price !== undefined && (
                    <div className="mb-3">
                        {post.price_type === 'starting' ? (
                            <p className="text-xl font-bold text-orange-600">
                                Mulai dari {formatPrice(post.price)}
                            </p>
                        ) : post.price_type === 'free' ? (
                            <p className="text-xl font-bold text-green-600">GRATIS</p>
                        ) : (
                            <p className="text-xl font-bold text-orange-600">
                                {formatPrice(post.price)}
                            </p>
                        )}
                    </div>
                )}

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.hashtags.slice(0, 3).map((tag, idx) => (
                            <span
                                key={idx}
                                className="text-sm text-sky-600 hover:underline cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/explore?tag=${tag}`)
                                }}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Engagement Buttons */}
                <div className="flex items-center justify-between pt-3 border-t">
                    <button
                        onClick={handleLike}
                        disabled={loading}
                        className={`flex items-center gap-2 transition ${liked ? 'text-red-500' : 'text-gray-600'
                            } disabled:opacity-50`}
                    >
                        <Heart className={liked ? 'fill-current' : ''} size={20} />
                        <span>{likeCount}</span>
                    </button>

                    <button
                        onClick={handleComment}
                        className="flex items-center gap-2 text-gray-600"
                    >
                        <MessageCircle size={20} />
                        <span>{post.stats?.comments || post.comments_count || 0}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-gray-600"
                    >
                        <Share2 size={20} />
                        <span>{post.stats?.shares || post.shares_count || 0}</span>
                    </button>

                    {post.type === 'product' ? (
                        <button
                            onClick={handleAddToCart}
                            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-sky-700 transition"
                        >
                            <ShoppingCart size={16} />
                            Keranjang
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/chat?postId=${post.id}&sellerId=${post.user_id}`)
                            }}
                            className="bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-sky-700 transition"
                        >
                            📩 Pesan
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
