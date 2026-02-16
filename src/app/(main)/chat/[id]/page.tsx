"use client"

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
    id: string
    chat_id: string
    sender_id: string
    content: string
    created_at: string
    read: boolean
}

export default function ChatRoomPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuthStore()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [otherUser, setOtherUser] = useState<any>(null)
    const [chatId, setChatId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!user) {
            router.push('/login')
            return
        }

        const initChat = async () => {
            const paramChatId = params?.id as string
            const sellerId = searchParams?.get('sellerId')

            if (paramChatId) {
                // Existing chat
                setChatId(paramChatId)
                await loadChat(paramChatId)
            } else if (sellerId) {
                // Create new chat or find existing
                await findOrCreateChat(sellerId)
            }
        }

        initChat()
    }, [user, params, searchParams])

    useEffect(() => {
        if (!chatId) return

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as Message])
                    scrollToBottom()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [chatId])

    const findOrCreateChat = async (otherUserId: string) => {
        if (!user) return

        try {
            // Try to find existing chat
            const participants = [user.id, otherUserId].sort()

            const { data: existingChat } = await supabase
                .from('chats')
                .select('*')
                .eq('participant_one', participants[0])
                .eq('participant_two', participants[1])
                .single()

            if (existingChat) {
                setChatId(existingChat.id)
                await loadChat(existingChat.id)
            } else {
                // Create new chat
                const { data: newChat, error } = await supabase
                    .from('chats')
                    .insert({
                        participant_one: participants[0],
                        participant_two: participants[1]
                    })
                    .select()
                    .single()

                if (error) throw error

                setChatId(newChat.id)
                router.replace(`/chat/${newChat.id}`)

                // Load other user info
                const { data: userData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', otherUserId)
                    .single()

                setOtherUser(userData)
            }
        } catch (error) {
            console.error('Error finding/creating chat:', error)
            toast.error('Gagal memuat chat')
        }
    }

    const loadChat = async (id: string) => {
        if (!user) return

        try {
            // Get chat details
            const { data: chatData } = await supabase
                .from('chats')
                .select('*')
                .eq('id', id)
                .single()

            if (chatData) {
                const otherUserId = chatData.participant_one === user.id
                    ? chatData.participant_two
                    : chatData.participant_one

                const { data: userData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', otherUserId)
                    .single()

                setOtherUser(userData)
            }

            // Get messages
            const { data: messagesData } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', id)
                .order('created_at', { ascending: true })

            setMessages(messagesData || [])
            scrollToBottom()
        } catch (error) {
            console.error('Error loading chat:', error)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !user || !chatId) return

        const content = newMessage.trim()
        setNewMessage('')

        try {
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content
                })

            if (messageError) throw messageError

            // Update chat last message
            await supabase
                .from('chats')
                .update({
                    last_message: content,
                    last_message_time: new Date().toISOString()
                })
                .eq('id', chatId)

        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Gagal mengirim pesan')
        }
    }

    if (!otherUser) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="flex items-center gap-3 p-4 border-b bg-white shrink-0">
                <button onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>

                <div className="flex-1 flex items-center gap-3">
                    <img
                        src={otherUser.avatar_url || '/default-avatar.png'}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                    />
                    <div>
                        <h3 className="font-bold text-sm">{otherUser.name}</h3>
                        <p className="text-xs text-gray-500">{otherUser.university_name}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`mb-4 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.sender_id === user?.id
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-white border'
                                }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t flex items-center gap-2 shrink-0 pb-6">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis pesan..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                />

                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-sky-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-sky-700 transition"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    )
}
