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
        setLikeCount(prev => Math.max(0, previousLiked ? prev - 1 : prev + 1))

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
            sellerName: post.profiles?.name || post.sellerName || 'Seller',
            sellerAvatar: post.profiles?.avatar_url || post.sellerAvatar,
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
            className="bg-white border-b mb-2 last:mb-0 md:rounded-xl md:border md:shadow-sm cursor-pointer hover:bg-gray-50 transition overflow-hidden"
        >
            {/* Header: User Info */}
            <div className="flex items-center gap-3 p-4">
                <img
                    src={post.profiles?.avatar_url || post.sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.name || post.sellerName || 'User')}&background=random`}
                    alt={post.profiles?.name || post.sellerName}
                    className="w-10 h-10 rounded-full cursor-pointer object-cover border border-gray-100"
                    onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/profile/${post.user_id}`)
                    }}
                    onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.name || 'User')}&background=random`
                    }}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <p className="font-bold text-gray-900 truncate">{post.profiles?.name || post.sellerName}</p>
                        {/* Optional Verified Badge can go here */}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                        {post.profiles?.university_name || post.sellerUniversity || 'Mahasiswa'} · {formatTimeAgo(new Date(post.created_at))}
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    className="text-gray-400 hover:text-sky-600 transition p-1"
                >
                    <Bookmark className={saved ? 'fill-current text-sky-600' : ''} size={22} />
                </button>
            </div>

            {/* Content: Text & Image */}
            <div className="px-4 pb-2">
                <h3 className="font-bold text-lg leading-snug text-gray-900 mb-1 line-clamp-2">{post.title}</h3>

                {/* Price */}
                <div className="mb-3">
                    {post.price !== undefined && (
                        <p className="text-xl font-bold text-orange-600">
                            {post.price_type === 'free' ? 'GRATIS' : formatPrice(post.price)}
                            {post.negotiable && <span className="text-xs text-gray-400 font-normal ml-2">Nego</span>}
                        </p>
                    )}
                </div>
            </div>

            {/* Image (Full Width) */}
            {post.images && post.images.length > 0 && post.images[0] && (
                <div className="relative w-full aspect-[4/3] bg-gray-100 mb-3">
                    <Image
                        src={post.images[0]}
                        alt={post.title}
                        width={800}
                        height={600}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        unoptimized={true}
                    />
                    {/* Badge Overlay */}
                    <div className="absolute top-3 left-3">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${post.type === 'product' ? 'bg-orange-500 text-white' :
                                post.type === 'service' ? 'bg-purple-500 text-white' :
                                    'bg-blue-500 text-white'
                            }`}>
                            {post.type === 'product' ? 'JUAL' : post.type === 'service' ? 'JASA' : 'INFO'}
                        </span>
                    </div>
                </div>
            )}

            {/* Footer: Actions */}
            <div className="px-4 pb-4 pt-1 flex items-center justify-between">
                <div className="flex gap-4">
                    <button onClick={handleLike} className={`flex items-center gap-1.5 ${liked ? 'text-red-500' : 'text-gray-600'}`}>
                        <Heart className={liked ? 'fill-current' : ''} size={24} strokeWidth={1.5} />
                        <span className="text-sm font-medium">{likeCount || 0}</span>
                    </button>
                    <button onClick={handleComment} className="flex items-center gap-1.5 text-gray-600">
                        <MessageCircle size={24} strokeWidth={1.5} />
                        <span className="text-sm font-medium">{post.stats?.comments || post.comments_count || 0}</span>
                    </button>
                    <button onClick={handleShare} className="text-gray-600">
                        <Share2 size={24} strokeWidth={1.5} />
                    </button>
                </div>

                {post.type === 'product' ? (
                    <button
                        onClick={handleAddToCart}
                        className="bg-sky-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-sky-700 active:scale-95 transition"
                    >
                        Beli
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/chat?postId=${post.id}&sellerId=${post.user_id}`)
                        }}
                        className="border border-sky-600 text-sky-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-sky-50 active:scale-95 transition"
                    >
                        Chat
                    </button>
                )}
            </div>
        </div>
    )
}
