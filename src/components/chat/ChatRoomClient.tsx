"use client"

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Message {
    id: string
    chat_id: string
    sender_id: string
    content: string
    created_at: string
    read: boolean
}

export default function ChatRoomClient() {
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
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [chatId])

    // Use LayoutEffect to scroll immediately after render
    useLayoutEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        // Immediate scroll
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }

        // Double check for images loading
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'smooth' })
            }
        }, 300)
    }

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



    const [post, setPost] = useState<any>(null)
    const [showActions, setShowActions] = useState(false)
    const [isTypingOffer, setIsTypingOffer] = useState(false)
    const [offerAmount, setOfferAmount] = useState('')

    useEffect(() => {
        // Fetch Post info if postId is present
        const postId = searchParams?.get('postId')
        if (postId) {
            fetchPostDetails(postId)
        }
    }, [searchParams])

    const fetchPostDetails = async (id: string) => {
        const { data } = await supabase.from('posts').select('*').eq('id', id).single()
        setPost(data)
    }

    const handleSendOffer = async () => {
        if (!offerAmount || isNaN(Number(offerAmount))) return
        try {
            const content = `$$OFFER::${offerAmount}::PENDING$$`
            await sendMessage(content)
            setIsTypingOffer(false)
            setOfferAmount('')
            setShowActions(false)
        } catch (error) {
            toast.error('Gagal mengirim penawaran')
        }
    }

    const sendMessage = async (content: string) => {
        if (!user || !chatId) return
        const { error } = await supabase
            .from('messages')
            .insert({
                chat_id: chatId,
                sender_id: user.id,
                content
            })

        if (error) throw error

        await supabase
            .from('chats')
            .update({
                last_message: content.startsWith('$$OFFER') ? 'Mengirim penawaran harga' : content,
                last_message_time: new Date().toISOString()
            })
            .eq('id', chatId)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            await sendMessage(newMessage.trim())
            setNewMessage('')
        } catch (error) {
            console.error(error)
            toast.error('Gagal mengirim pesan')
        }
    }

    const handleOfferResponse = async (offerMessage: Message, status: 'ACCEPTED' | 'REJECTED') => {
        // In a real app, update the message status in DB. 
        // For now, we send a reply.
        const price = offerMessage.content.split('::')[1]
        const reply = status === 'ACCEPTED'
            ? `✅ Saya menerima penawaran Rp ${price}`
            : `❌ Maaf, saya menolak penawaran Rp ${price}`

        await sendMessage(reply)
        toast.success(status === 'ACCEPTED' ? 'Penawaran Diterima' : 'Penawaran Ditolak')
    }

    const renderMessageContent = (msg: Message) => {
        if (msg.content.startsWith('$$OFFER::')) {
            const parts = msg.content.split('::')
            const price = parts[1]
            // const status = parts[2] // PENDING, ACCEPTED, REJECTED (Not used in display logic yet without DB update)

            const isMe = msg.sender_id === user?.id

            return (
                <div className={`p-4 rounded-xl shadow-sm ${isMe ? 'bg-white text-gray-800' : 'bg-white text-gray-800'}`}>
                    <div className="flex flex-col items-center gap-2 mb-3">
                        <div className="text-sky-600">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                        </div>
                        <p className="font-bold text-gray-900">Penawaran Harga</p>
                        <p className="text-xs text-gray-500 text-center">Pembeli mengajukan harga baru untuk item ini</p>
                        <p className="text-2xl font-bold text-sky-600">Rp {price}</p>
                    </div>

                    {!isMe && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => handleOfferResponse(msg, 'REJECTED')}
                                className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-full text-sm font-bold hover:bg-red-50"
                            >
                                Tolak
                            </button>
                            <button
                                onClick={() => handleOfferResponse(msg, 'ACCEPTED')}
                                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700"
                            >
                                Terima
                            </button>
                        </div>
                    )}
                    {isMe && (
                        <p className="text-xs text-center text-gray-400 mt-2">Menunggu respon penjual</p>
                    )}
                </div>
            )
        }
        return <p className="text-sm">{msg.content}</p>
    }

    if (!otherUser) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 border-b bg-white shrink-0 shadow-sm z-10">
                <button onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>

                <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${otherUser.id}`)}>
                    <img
                        src={otherUser.avatar_url || `https://ui-avatars.com/api/?name=${otherUser.name}&background=random`}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                    />
                    <div>
                        <div className="flex items-center gap-1">
                            <h3 className="font-bold text-sm">{otherUser.name}</h3>
                            <span className="w-2 h-2 bg-green-500 rounded-full ml-1"></span>
                        </div>
                        <p className="text-xs text-gray-500">{otherUser.university_name || 'Online'}</p>
                    </div>
                </div>

                <div className="flex gap-4 text-sky-600">
                    <button><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
                    <button><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button>
                </div>
            </header>

            {/* Product Context */}
            {post && (
                <div className="bg-white px-4 py-3 border-b flex items-center justify-between shadow-sm z-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                            {post.images && post.images[0] && (
                                <img src={post.images[0]} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-sm line-clamp-1 text-gray-900">{post.title}</p>
                            <p className="text-sm font-bold text-sky-600">Rp {Number(post.price).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold"
                    >
                        Lihat Produk
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {/* Date Separator (Mock) */}
                <div className="flex justify-center mb-6">
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-3 py-1 rounded-full font-bold">HARI INI</span>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id
                    return (
                        <div
                            key={msg.id}
                            className={`mb-4 flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] ${msg.content.startsWith('$$OFFER')
                                    ? ''
                                    : `px-4 py-3 rounded-2xl ${isMe ? 'bg-sky-500 text-white rounded-tr-md' : 'bg-white border rounded-tl-md shadow-sm'}`
                                    }`}
                            >
                                {renderMessageContent(msg)}
                            </div>
                        </div>
                    )
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t pb-8">
                {/* Action Chips */}
                {showActions && (
                    <div className="flex gap-3 mb-3 animate-in slide-in-from-bottom-5">
                        <button className="flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-2 rounded-xl text-sm font-bold">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            Foto
                        </button>
                        <button className="flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-2 rounded-xl text-sm font-bold">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Lokasi
                        </button>
                        <button
                            onClick={() => setIsTypingOffer(true)}
                            className="flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-2 rounded-xl text-sm font-bold"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                            Tawar Harga
                        </button>
                    </div>
                )}

                {/* Offer Input Mode */}
                {isTypingOffer ? (
                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-xl">
                        <span className="font-bold text-gray-500 pl-2">Rp</span>
                        <input
                            type="number"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            placeholder="0"
                            className="flex-1 bg-transparent outline-none font-bold text-lg"
                            autoFocus
                        />
                        <button onClick={() => setIsTypingOffer(false)} className="p-2 text-gray-500">Batal</button>
                        <button onClick={handleSendOffer} className="bg-sky-600 text-white px-4 py-2 rounded-lg font-bold">Kirim Tawaran</button>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowActions(!showActions)}
                            className={`p-2 rounded-full transition ${showActions ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                        </button>

                        <div className="flex-1 bg-gray-100 rounded-full px-4 py-3 focus-within:ring-2 focus-within:ring-sky-500 transition-all flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Ketik pesan..."
                                className="flex-1 bg-transparent outline-none text-sm"
                            />
                            <button type="button" className="text-gray-400 ml-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line><path d="M8 12.5a4 4 0 0 1 8 0"></path></svg>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-sky-500 text-white p-3 rounded-full disabled:opacity-50 hover:bg-sky-600 transition shadow-lg shadow-sky-200"
                        >
                            <Send size={20} fill="currentColor" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
