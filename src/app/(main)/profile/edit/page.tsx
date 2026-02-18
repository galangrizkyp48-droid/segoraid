"use client"

import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Save, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditProfilePage() {
    const router = useRouter()
    const { user, setUser } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { register, handleSubmit } = useForm({
        defaultValues: {
            name: user?.name,
            phone: user?.phone || '',
            bio: user?.biography || '',
            location: user?.location || '',
            university: user?.university_name || ''
        }
    })

    useEffect(() => {
        if (!user) {
            router.push('/login')
        } else {
            setAvatarPreview(user.avatar_url)
        }
    }, [user])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Ukuran foto maksimal 2MB')
                return
            }
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const onSubmit = async (data: any) => {
        if (!user) return
        setLoading(true)

        try {
            let avatarUrl = user.avatar_url

            // Upload Image if changed
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}.${fileExt}`

                // 1. Upload
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile, { upsert: true })

                if (uploadError) {
                    console.error('Upload Error:', uploadError)
                    throw new Error('Gagal mengupload foto')
                }

                // 2. Get Public URL
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                avatarUrl = urlData.publicUrl
            }

            // Update Supabase Profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: data.name,
                    phone: data.phone,
                    biography: data.bio,
                    avatar_url: avatarUrl,
                    // location: data.location, // Ensure schema supports this if you use it
                })
                .eq('id', user.id)

            if (error) throw error

            // Update Local Store
            setUser({
                ...user,
                ...data,
                biography: data.bio,
                avatar_url: avatarUrl
            })

            toast.success('Profil berhasil diperharui!')
            router.back()
        } catch (error: any) {
            console.error('Error updating profile:', error)
            toast.error(error.message || 'Gagal memperbarui profil')
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
                <button className="text-sky-600" onClick={handleSubmit(onSubmit)} disabled={loading}>
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                </button>
            </header>

            <form className="p-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <img
                            src={avatarPreview || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                            className={`w-24 h-24 rounded-full border-4 border-white bg-white object-cover shadow-sm ${loading ? 'opacity-50' : ''}`}
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Camera className="text-white" size={24} />
                        </div>
                        <button type="button" className="absolute bottom-0 right-0 bg-sky-600 text-white text-xs px-3 py-1 rounded-full shadow-md border-2 border-white hover:bg-sky-700 transition">
                            Ubah
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
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
                        placeholder="Contoh: Depok, Jawa Barat"
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
                    <input
                        {...register('phone')}
                        type="tel"
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <div className="pt-4 text-xs text-center text-gray-400">
                    Perubahan akan langsung disimpan ke database.
                </div>
            </form>
        </div>
    )
}
