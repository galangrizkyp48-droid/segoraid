"use client"

import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function EditProfilePage() {
    const router = useRouter()
    const { user, setUser } = useAuthStore()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit } = useForm({
        defaultValues: {
            name: user?.name,
            phone: user?.phone,
            bio: user?.biography,
            location: user?.location,
            university: user?.university_name
        }
    })

    useEffect(() => {
        if (!user) router.push('/login')
    }, [user])

    const onSubmit = async (data: any) => {
        if (!user) return
        setLoading(true)

        try {
            // Update Supabase
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: data.name,
                    phone: data.phone,
                    biography: data.bio,
                    // location: data.location, // Schema update required
                })
                .eq('id', user.id)

            if (error) throw error

            // Update Store
            setUser({ ...user, ...data, biography: data.bio })

            toast.success('Profil berhasil diperharui!')
            router.back()
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Gagal memperbarui profil')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => router.back()} className="text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg">Edit Profil</h1>
                <button className="text-sky-600" onClick={handleSubmit(onSubmit)}>
                    <Save size={24} />
                </button>
            </header>

            <form className="p-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                        <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}`}
                            alt={user.name}
                            className="w-24 h-24 rounded-full border-4 border-white bg-white object-cover"
                        />
                        <button type="button" className="absolute bottom-0 right-0 bg-sky-600 text-white text-xs px-2 py-1 rounded-full">
                            Ubah
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                    <input
                        {...register('name')}
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                        {...register('bio')}
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Lokasi</label>
                    <input
                        {...register('location')}
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
                    <input
                        {...register('phone')}
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold mt-8 hover:bg-sky-700 transition"
                >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </form>
        </div>
    )
}
