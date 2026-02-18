"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import { Post } from '@/lib/types/user'
import { Search, Bell, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const PostCard = dynamic(() => import('@/components/post/PostCard'), {
    loading: () => <LoadingSkeleton count={1} />,
    ssr: false
})

export default function HomePage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')
    // const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null) // Not needed for Supabase range
    const [hasMore, setHasMore] = useState(true)
    const [filter, setFilter] = useState('for_you') // for_you, trending, my_campus, newest
    const [loadingMore, setLoadingMore] = useState(false)

    const [newPostsAvailable, setNewPostsAvailable] = useState(false)

    useEffect(() => {
        // Only fetch if filter is not user-dependent OR user is loaded
        if (filter !== 'my_campus' || user?.university_name) {
            fetchPosts()
        }

        // Realtime Subscription
        const channel = supabase
            .channel('public:posts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                    filter: filter === 'my_campus' && user?.university_name
                        ? `campus=eq.${user.university_name}`
                        : undefined
                },
                () => {
                    setNewPostsAvailable(true)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [filter, user])

    const fetchPosts = async (loadMore = false) => {
        // Check for Env Vars
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl) {
            setLoading(false)
            setErrorMsg('Konfigurasi Error: Supabase URL tidak ditemukan. Cek Vercel Env Variables.')
            return
        }

        if (loadMore) {
            setLoadingMore(true)
        } else {
            setLoading(true)
            setPosts([])
            setErrorMsg('')
            setNewPostsAvailable(false)
        }

        try {
            const page = loadMore ? Math.ceil(posts.length / 10) : 0
            const from = page * 10
            const to = from + 9

            let query = supabase
                .from('posts')
                .select('*, profiles(name, avatar_url, university_name)')
                .order('created_at', { ascending: false })
                .range(from, to)

            // Apply filters
            if (filter === 'my_campus') {
                if (user?.university_name) {
                    query = query.eq('campus', user.university_name)
                }
            } else if (filter === 'trending') {
                query = query.order('likes_count', { ascending: false })
            }

            // Add 10s Timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Koneksi timeout, periksa internet anda')), 10000)
            )

            const { data, error } = await Promise.race([
                query,
                timeoutPromise
            ]) as any

            if (error) throw error

            const newPosts = data as Post[]

            if (data.length < 10) {
                setHasMore(false)
            }

            if (loadMore) {
                setPosts(prev => [...prev, ...newPosts])
            } else {
                setPosts(newPosts)
            }

        } catch (error: any) {
            console.error('Error fetching posts:', error)
            setErrorMsg(error.message || 'Gagal memuat postingan')
            // Fallback to empty array on error
            if (!loadMore) {
                setPosts([])
            }
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchPosts(true)
        }
    }

    const FilterTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition ${active
                ? 'bg-sky-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
        >
            {label}
        </button>
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b">
                <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-sky-600">Segora</h1>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Cari barang, jasa, atau kampus..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                                onClick={() => router.push('/explore')}
                                readOnly
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                        <button onClick={() => router.push('/notifications')} className="relative">
                            <Bell size={24} />
                            {/* Badge for unread notifications */}
                        </button>
                        <button onClick={() => router.push('/cart')} className="relative">
                            <ShoppingCart size={24} />
                            {/* Badge for cart items */}
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
                    <FilterTab
                        label="✨ Untuk Kamu"
                        active={filter === 'for_you'}
                        onClick={() => setFilter('for_you')}
                    />
                    <FilterTab
                        label="🔥 Trending"
                        active={filter === 'trending'}
                        onClick={() => setFilter('trending')}
                    />
                    {user && (
                        <FilterTab
                            label={`🎓 ${user.university_name || 'Kampus Saya'}`}
                            active={filter === 'my_campus'}
                            onClick={() => setFilter('my_campus')}
                        />
                    )}
                    <FilterTab
                        label="Terbaru"
                        active={filter === 'newest'}
                        onClick={() => setFilter('newest')}
                    />
                </div>
            </header>

            {/* Posts Feed */}
            <div className="relative">
                {newPostsAvailable && (
                    <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
                        <button
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                fetchPosts()
                            }}
                            className="bg-sky-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold hover:bg-sky-700 transition animate-bounce"
                        >
                            ↑ Postingan Baru Tersedia
                        </button>
                    </div>
                )}

                {/* Error State */}
                {errorMsg && (
                    <div className="p-4 mx-4 mt-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center">
                        <p>{errorMsg}</p>
                        <button onClick={() => fetchPosts()} className="mt-2 text-sm underline font-semibold">
                            Coba Lagi
                        </button>
                    </div>
                )}

                {loading ? (
                    <LoadingSkeleton count={3} />
                ) : posts.length === 0 && !errorMsg ? (
                    <div className="pt-20">
                        <EmptyState
                            icon="📦"
                            title="Belum ada postingan"
                            description={
                                filter === 'my_campus'
                                    ? "Jadilah yang pertama posting di kampus kamu!"
                                    : "Coba filter lain atau mulai jelajah"
                            }
                            actionLabel="Buat Postingan"
                            actionHref="/post/create"
                        />
                    </div>
                ) : (
                    <>
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="p-4">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="w-full py-3 text-sky-600 font-semibold hover:bg-sky-50 rounded-lg transition disabled:opacity-50"
                                >
                                    {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                                </button>
                            </div>
                        )}

                        {!hasMore && posts.length > 0 && (
                            <p className="text-center text-gray-500 py-8">Kamu sudah sampai akhir 🎉</p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
