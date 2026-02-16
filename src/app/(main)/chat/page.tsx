"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils/formatters'

interface Chat {
    id: string
    participant_one: string
    participant_two: string
    last_message: string | null
    last_message_time: string | null
    other_user?: {
        id: string
        name: string
        avatar_url: string | null
    }
}

export default function ChatListPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [chats, setChats] = useState<Chat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            router.push('/login')
            return
        }

        fetchChats()
    }, [user])

    const fetchChats = async () => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('chats')
                .select('*')
                .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
                .order('last_message_time', { ascending: false, nullsFirst: false })

            if (error) throw error

            // Fetch other participants' details
            const chatsWithUsers = await Promise.all(
                (data || []).map(async (chat) => {
                    const otherUserId = chat.participant_one === user.id ? chat.participant_two : chat.participant_one

                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('id, name, avatar_url')
                        .eq('id', otherUserId)
                        .single()

                    return {
                        ...chat,
                        other_user: userData
                    }
                })
            )

            setChats(chatsWithUsers)
        } catch (error) {
            console.error('Error fetching chats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-400">Loading chats...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            <header className="sticky top-0 bg-white border-b p-4 flex items-center gap-3 z-10">
                <button onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg">Pesan</h1>
            </header>

            {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="bg-sky-100 p-4 rounded-full mb-4">
                        <MessageCircle size={48} className="text-sky-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Belum Ada Pesan</h2>
                    <p className="text-gray-500 max-w-xs">
                        Mulai berbicara dengan penjual atau pembeli!
                    </p>
                </div>
            ) : (
                <div>
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => router.push(`/chat/${chat.id}`)}
                            className="flex items-center gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer"
                        >
                            <img
                                src={chat.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${chat.other_user?.name}`}
                                alt={chat.other_user?.name}
                                className="w-12 h-12 rounded-full bg-gray-200 object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{chat.other_user?.name || 'Unknown'}</h3>
                                <p className="text-sm text-gray-500 truncate">
                                    {chat.last_message || 'Belum ada pesan'}
                                </p>
                            </div>
                            {chat.last_message_time && (
                                <span className="text-xs text-gray-400">
                                    {formatTimeAgo(new Date(chat.last_message_time))}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
