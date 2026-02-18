"use client"

import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Settings, LogOut, MapPin, School, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import GridPostCard from '@/components/post/GridPostCard'
import EmptyState from '@/components/shared/EmptyState'


export default function ProfilePage() {
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const [activeTab, setActiveTab] = useState('selling') // selling, sold, saved
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!user) {
            router.push('/login')
        } else {
            const fetchItems = async () => {
                setLoading(true)
                try {
                    if (activeTab === 'saved') {
                        // Fetch saved posts with join
                        const { data, error } = await supabase
                            .from('saved_posts')
                            .select('*, posts(*, profiles(name, avatar_url, university_name))')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })

                        if (error) throw error
                        // Extract posts from the saved_posts relation
                        setItems(data?.map((saved: any) => saved.posts) || [])
                    } else {
                        // Fetch user's own posts (selling/sold)
                        const { data, error } = await supabase
                            .from('posts')
                            .select('*, profiles(name, avatar_url, university_name)')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })

                        if (error) throw error

                        // Client-side filtering for Selling vs Sold
                        const allPosts = data || []
                        let filteredPosts = []

                        if (activeTab === 'sold') {
                            // Show only Products with 0 stock
                            filteredPosts = allPosts.filter((post: any) =>
                                post.type === 'product' && post.stock === 0
                            )
                        } else {
                            // Selling: Products with stock > 0 OR Non-products (Services/Info)
                            filteredPosts = allPosts.filter((post: any) =>
                                (post.type === 'product' && (post.stock === undefined || post.stock > 0)) ||
                                post.type !== 'product'
                            )
                        }

                        setItems(filteredPosts)
                    }
                } catch (error) {
                    console.error('Error fetching items:', error)
                } finally {
                    setLoading(false)
                }
            }
            fetchItems()

        }
    }, [user, activeTab])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        router.push('/login')
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header / Cover */}
            <div className="h-32 bg-sky-600 relative">
                <button
                    onClick={() => router.push('/settings')}
                    className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Profile Info */}
            <div className="px-4 relative mb-4">
                {/* Avatar */}
                <div className="-mt-12 mb-3">
                    <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        alt={user.name}
                        className="w-24 h-24 rounded-full border-4 border-white bg-white object-cover"
                    />
                </div>

                {/* Identity */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold">{user.name}</h1>
                        <p className="text-gray-500 text-sm">@{user.email?.split('@')[0]}</p>
                    </div>
                    <button
                        onClick={() => router.push('/profile/edit')}
                        className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-50"
                    >
                        <Edit size={14} /> Edit
                    </button>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <School size={16} />
                        <span>{user.university_name || 'Universitas Indonesia'} • {user.year || '2022'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>{user.location || 'Depok, Jawa Barat'}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-6 border-b pb-6">
                    <div className="text-center">
                        <span className="block font-bold text-lg">{user.stats?.postsCount || 0}</span>
                        <span className="text-xs text-gray-500">Postingan</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-lg">{user.stats?.followersCount || 0}</span>
                        <span className="text-xs text-gray-500">Pengikut</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-lg">{user.stats?.followingCount || 0}</span>
                        <span className="text-xs text-gray-500">Mengikuti</span>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="px-4">
                <div className="flex gap-4 border-b mb-4">
                    {['selling', 'sold', 'saved'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-2 text-sm font-medium capitalize ${activeTab === tab
                                ? 'text-sky-600 border-b-2 border-sky-600'
                                : 'text-gray-500'
                                }`}
                        >
                            {tab === 'selling' ? 'Jualan Saya' : tab === 'sold' ? 'Terjual' : 'Disimpan'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
                            ))}
                        </div>
                    ) : items.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {items.map(item => <GridPostCard key={item.id} post={item} />)}
                        </div>
                    ) : (
                        <EmptyState
                            icon="📭"
                            title="Belum ada item"
                            description={
                                activeTab === 'selling' ? "Kamu belum menjual apapun." :
                                    activeTab === 'sold' ? "Belum ada barang yang terjual." :
                                        "Belum ada barang yang disimpan."
                            }
                            actionLabel={activeTab === 'selling' ? "Mulai Jualan" : undefined}
                            actionHref="/post/create"
                        />
                    )}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="mt-8 w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 hover:bg-red-50 rounded-xl transition"
                >
                    <LogOut size={18} /> Keluar
                </button>
            </div>
        </div>
    )
}

