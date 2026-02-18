import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface UserProfile {
    id: string
    email: string
    name: string
    phone?: string
    avatar_url: string | null
    university_id: string
    university_name: string
    university_short_name: string
    year?: number
    biography?: string
    location?: string
    stats?: {
        postsCount: number
        followersCount: number
        followingCount: number
    }
    // Add other fields as needed matching schema
}

interface AuthStore {
    user: UserProfile | null
    session: Session | null
    loading: boolean
    setUser: (user: UserProfile | null) => void
    setSession: (session: Session | null) => void
    setLoading: (loading: boolean) => void
    logout: () => Promise<void>
    initAuth: () => () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            loading: true,

            setUser: (user) => set({ user }),
            // @ts-ignore
            setSession: (session) => set({ session }),
            setLoading: (loading) => set({ loading }),

            logout: async () => {
                try {
                    await supabase.auth.signOut()
                    set({ user: null, session: null })
                } catch (error) {
                    console.error('Logout error:', error)
                }
            },

            initAuth: () => {
                // Check active session immediately
                supabase.auth.getSession().then(({ data: { session } }) => {
                    set({ session })
                    if (session?.user) {
                        fetchProfile(session.user.id)
                    } else {
                        set({ loading: false, user: null })
                    }
                }).catch((err) => {
                    console.error("Auth session check failed:", err)
                    set({ loading: false })
                })

                // Listen for changes
                const {
                    data: { subscription },
                } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_OUT') {
                        set({ session: null, user: null, loading: false })
                    } else if (session?.user) {
                        set({ session })
                        await fetchProfile(session.user.id)
                    } else {
                        set({ session: null, loading: false })
                    }
                })

                return () => subscription.unsubscribe()
            }
        }),
        {
            name: 'segora-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user, session: state.session }),
        }
    )
)

async function fetchProfile(userId: string) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) {
            useAuthStore.getState().setUser(data)
        }
    } catch (error) {
        console.error('Error fetching profile:', error)
    } finally {
        useAuthStore.getState().setLoading(false)
    }
}
