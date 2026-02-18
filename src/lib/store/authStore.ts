import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
}

interface AuthStore {
    user: UserProfile | null
    loading: boolean
    setUser: (user: UserProfile | null) => void
    setLoading: (loading: boolean) => void
    logout: () => Promise<void>
    refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            loading: false,

            setUser: (user) => set({ user }),
            setLoading: (loading) => set({ loading }),

            logout: async () => {
                try {
                    const { signOut } = await import('next-auth/react')
                    await signOut({ redirect: false })
                    set({ user: null })
                } catch (error) {
                    console.error('Logout error:', error)
                }
            },

            refreshProfile: async () => {
                const { user } = get()
                if (!user?.id) return
                try {
                    const res = await fetch(`/api/profile/${user.id}`)
                    if (res.ok) {
                        const profile = await res.json()
                        set({ user: profile })
                    }
                } catch (err) {
                    console.error('Error refreshing profile:', err)
                }
            },
        }),
        {
            name: 'segora-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user }),
        }
    )
)
