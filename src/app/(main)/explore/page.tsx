"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import GridPostCard from '@/components/post/GridPostCard'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import { Search, Bell } from 'lucide-react'
import { Post } from '@/lib/types/user'
import { CATEGORIES } from '@/lib/constants/categories'
import { CAMPUSES } from '@/lib/constants/campuses'
import Image from 'next/image'

function ExploreContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Get initial values from URL
    const initialQuery = searchParams.get('q') || ''
    const initialCategory = searchParams.get('category') || ''

    const [query, setQuery] = useState(initialQuery)
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
    const [activeCategory, setActiveCategory] = useState(initialCategory)

    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(false)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    // Effect to handle URL params changes
    useEffect(() => {
        const q = searchParams.get('q') || ''
        const c = searchParams.get('category') || ''

        if (q !== query) setQuery(q)
        if (c !== activeCategory) setActiveCategory(c)
    }, [searchParams])

    useEffect(() => {
        fetchPosts()
    }, [debouncedQuery, activeCategory])

    const fetchPosts = async () => {
        setLoading(true)
        try {
            let dbQuery = supabase
                .from('posts')
                .select('*, profiles(name, avatar_url, university_name)')
                .order('created_at', { ascending: false })

            // Search Query
            if (debouncedQuery) {
                dbQuery = dbQuery.or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%,hashtags.cs.{${debouncedQuery}}`)
            }

            // Category Filter
            if (activeCategory) {
                const catLabel = CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()
                if (catLabel) {
                    dbQuery = dbQuery.eq('category', catLabel)
                }
            }

            const { data, error } = await dbQuery.limit(20)

            if (error) throw error
            setPosts(data as Post[] || [])
        } catch (error) {
            console.error('Error fetching explore posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCategoryClick = (catId: string) => {
        const newCat = activeCategory === catId ? '' : catId
        setActiveCategory(newCat)

        const params = new URLSearchParams(searchParams.toString())
        if (newCat) params.set('category', newCat)
        else params.delete('category')

        router.replace(`/explore?${params.toString()}`)
    }

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white p-4 flex gap-3 items-center">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari buku, jasa, atau barang..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <button className="relative p-2 text-sky-600">
                    <Bell size={24} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>

            <div className="space-y-6 px-4 pb-4">

                {/* Section 1: Jelajahi Kampus */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg">Jelajahi Kampus</h2>
                        <button className="text-xs text-sky-500 font-semibold">Lihat Semua</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                        {CAMPUSES.map((campus) => (
                            <div key={campus.id} className="flex flex-col items-center gap-2 min-w-[60px]">
                                <div className="w-14 h-14 rounded-xl shadow-sm border p-1 bg-white flex items-center justify-center overflow-hidden">
                                    <img src={campus.logo} alt={campus.name} className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xs font-medium text-gray-700">{campus.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 2: Kategori (Grid 2x4) */}
                <section>
                    <h2 className="font-bold text-lg mb-3">Kategori</h2>
                    <div className="grid grid-cols-4 gap-3">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon
                            const isActive = activeCategory === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className={`flex flex-col items-center gap-1.5`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center transition-transform ${isActive ? 'scale-110 ring-2 ring-offset-1 ring-sky-500' : ''}`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">
                                        {cat.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Section 3: Lagi Rame (Banner) */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <h2 className="font-bold text-lg">Lagi Rame</h2>
                        <span className="text-lg">🔥</span>
                    </div>
                    <div className="relative w-full aspect-[2/1] bg-gray-800 rounded-2xl overflow-hidden shadow-lg p-5 flex flex-col justify-center text-white">
                        {/* Abstract Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 rounded-full blur-3xl opacity-20 translate-x-10 -translate-y-10"></div>

                        <span className="text-xs font-bold text-sky-400 tracking-wider mb-1">EVENT KAMPUS</span>
                        <h3 className="text-xl font-bold leading-tight mb-2">Wisuda Unpad: Jasa Sewa Kebaya & Jas</h3>
                        <p className="text-xs text-gray-300">20+ Penawaran tersedia</p>

                        <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 opacity-80">
                            {/* Illustration placeholder */}
                            <div className="w-full h-full bg-orange-400 rounded-full blur-xl"></div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Rekomendasi */}
                <section>
                    <h2 className="font-bold text-lg mb-3">Rekomendasi Untukmu</h2>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {posts.map(post => (
                                <GridPostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon="🔍"
                            title="Belum ada postingan"
                            description="Coba cari dengan kata kunci lain."
                        />
                    )}
                </section>
            </div>
        </div>
    )
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="p-4">Loading...</div>}>
            <ExploreContent />
        </Suspense>
    )
}
