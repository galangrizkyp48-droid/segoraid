"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import { X, Upload } from 'lucide-react'
import ImageUploader from '@/components/shared/ImageUploader'
import CategorySelector from '@/components/shared/CategorySelector'
import HashtagInput from '@/components/shared/HashtagInput'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const postSchema = z.object({
    type: z.enum(['product', 'service', 'info']),
    title: z.string().min(5, 'Judul minimal 5 karakter').max(100),
    category: z.string().min(1, 'Pilih kategori'),
    description: z.string().min(20, 'Deskripsi minimal 20 karakter').max(1000),
    price: z.number().min(0).optional(),
    priceType: z.enum(['fixed', 'starting', 'negotiable', 'free']).optional(),
    negotiable: z.boolean().optional(),

    // Product fields
    condition: z.enum(['new', 'like_new', 'good', 'fair']).optional(),
    stock: z.number().min(0).optional(),
    weight: z.number().min(0).optional(),

    // Service fields
    duration: z.string().optional(),
    serviceType: z.enum(['online', 'offline', 'both']).optional(),

    // Shipping
    shippingMethods: z.array(z.string()).min(1, 'Pilih minimal 1 metode'),
    locationDetail: z.string().optional(),

    // SEO
    hashtags: z.array(z.string()).max(10),

    // Settings
    visibleTo: z.enum(['all', 'my_campus', 'followers']),
    allowOffers: z.boolean(),
})

export default function CreatePostPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(postSchema),
        defaultValues: {
            type: 'product',
            priceType: 'fixed',
            negotiable: false,
            shippingMethods: ['cod'], // Default checked
            visibleTo: 'all',
            allowOffers: true,
            hashtags: [],
            condition: 'new',
        }
    })

    // @ts-ignore
    const postType = watch('type')
    // @ts-ignore
    const priceType = watch('priceType')

    // Handle Image Upload
    const handleImageSelect = (files: File[]) => {
        if (images.length + files.length > 10) {
            alert('Maksimal 10 gambar')
            return
        }

        const newImages = [...images, ...files]
        setImages(newImages)

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file))
        setImagePreviews(prev => [...prev, ...newPreviews])
    }

    // Remove Image
    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index)
        const newPreviews = imagePreviews.filter((_, i) => i !== index)
        setImages(newImages)
        setImagePreviews(newPreviews)
    }

    // Submit Post
    const onSubmit = async (data: any) => {
        if (!user) {
            router.push('/login')
            return
        }

        if (images.length === 0) {
            alert('Upload minimal 1 gambar')
            return
        }

        setUploading(true)
        const imageUrls: string[] = []

        try {
            // 1. Upload images to Supabase Storage

            for (let i = 0; i < images.length; i++) {
                const file = images[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`

                try {
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('posts')
                        .upload(fileName, file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('posts')
                        .getPublicUrl(fileName)

                    imageUrls.push(publicUrl)
                    setUploadProgress(((i + 1) / images.length) * 100)
                } catch (error) {
                    console.error('Upload error:', error)
                    toast.error(`Gagal upload gambar ke-${i + 1}`)
                    throw error
                }
            }

            // 2. Create post record
            const postData = {
                user_id: user.id,
                type: data.type,
                title: data.title,
                description: data.description,
                category: data.category,
                images: imageUrls,

                // Pricing
                price: data.priceType === 'free' ? 0 : data.price,
                price_type: data.priceType,
                negotiable: data.negotiable || false,

                // Product specific
                ...(data.type === 'product' && {
                    condition: data.condition || 'new',
                    stock: data.stock || 1,
                    weight: data.weight || 0,
                }),

                // Service specific
                ...(data.type === 'service' && {
                    duration: data.duration,
                    service_type: data.serviceType,
                }),

                // Location & Shipping
                campus: user.university_name,
                location_detail: data.locationDetail || '',
                shipping_methods: data.shippingMethods,

                // SEO
                tags: [data.category.toLowerCase()],
                hashtags: data.hashtags,

                // Settings
                visible_to: data.visibleTo,

                // Initial stats
                views_count: 0,
                likes_count: 0,
            }

            const { data: insertedPost, error: insertError } = await supabase
                .from('posts')
                .insert(postData)
                .select()
                .single()

            if (insertError) throw insertError

            // 3. Success notification
            toast.success('🎉 Postingan berhasil dipublikasi!')

            // 4. Redirect to post detail
            router.push(`/post/${insertedPost.id}`)

        } catch (error: any) {
            console.error('Error creating post:', error)
            toast.error(`Gagal: ${error.message || 'Terjadi kesalahan'}`)

            // Cleanup uploaded images on error
            if (imageUrls.length > 0) {
                const imagePaths = imageUrls.map(url => {
                    const parts = url.split('/posts/')
                    return parts[1] // Extract path after bucket name
                }).filter(Boolean)

                if (imagePaths.length > 0) {
                    await supabase.storage
                        .from('posts')
                        .remove(imagePaths)
                    console.log('Cleaned up orphaned images')
                }
            }
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600"
                    >
                        Batal
                    </button>
                    <h1 className="font-bold text-lg">Buat Postingan</h1>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={uploading}
                        className="text-sky-600 font-semibold disabled:opacity-50"
                    >
                        {uploading ? `${uploadProgress.toFixed(0)}%` : 'Post'}
                    </button>
                </div>
            </header>

            <form className="p-4 space-y-6 max-w-xl mx-auto">

                {/* Post Type Selector */}
                <div>
                    <label className="block text-sm font-medium mb-3">Apa yang ingin kamu tawarkan?</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'product', label: '📦 Jual Produk' },
                            { value: 'service', label: '🎨 Tawarkan Jasa' },
                            { value: 'info', label: '💼 Info/Lainnya' },
                        ].map(type => (
                            <button
                                key={type.value}
                                type="button"
                                // @ts-ignore
                                onClick={() => setValue('type', type.value)}
                                className={`p-4 rounded-xl border-2 text-center transition ${postType === type.value
                                    ? 'border-sky-600 bg-sky-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-sm font-medium">{type.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Image Upload */}
                <ImageUploader
                    images={images}
                    previews={imagePreviews}
                    onSelect={handleImageSelect}
                    onRemove={removeImage}
                />

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Judul <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('title')}
                        placeholder="Misal: Jasa Design Logo Profesional"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                        maxLength={100}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span className="text-red-500">{errors.title?.message as string}</span>
                        {/* @ts-ignore */}
                        <span>{watch('title')?.length || 0}/100</span>
                    </div>
                </div>

                {/* Category */}
                <CategorySelector
                    type={postType}
                    // @ts-ignore
                    value={watch('category')}
                    onChange={(val) => setValue('category', val)}
                    error={errors.category?.message as string}
                />

                {/* Price Section */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Harga/Fee <span className="text-red-500">*</span>
                    </label>

                    {postType === 'service' && (
                        <div className="mb-3 space-y-2">
                            {[
                                { value: 'fixed', label: 'Harga Fixed' },
                                { value: 'starting', label: 'Harga Mulai Dari' },
                                { value: 'negotiable', label: 'Harga Nego' },
                            ].map(type => (
                                <label key={type.value} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        {...register('priceType')}
                                        value={type.value}
                                    />
                                    <span>{type.label}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {priceType !== 'negotiable' && (
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                                type="number"
                                {...register('price', { valueAsNumber: true })}
                                placeholder="0"
                                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            />
                        </div>
                    )}

                    {postType === 'product' && (
                        <label className="flex items-center gap-2 mt-3">
                            <input type="checkbox" {...register('negotiable')} />
                            <span className="text-sm">Bisa Nego</span>
                        </label>
                    )}

                    <label className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            onChange={(e) => {
                                if (e.target.checked) {
                                    // @ts-ignore
                                    setValue('priceType', 'free')
                                    setValue('price', 0)
                                }
                            }}
                        />
                        <span className="text-sm">Gratis (untuk donasi/barter)</span>
                    </label>

                    {postType === 'product' && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-2">Kondisi Barang</label>
                            <select
                                {...register('condition')}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                            >
                                <option value="new">Baru</option>
                                <option value="like_new">Bekas - Seperti Baru</option>
                                <option value="good">Bekas - Bagus</option>
                                <option value="fair">Bekas - Layak Pakai</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Deskripsi Lengkap <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        {...register('description')}
                        rows={6}
                        placeholder={
                            postType === 'product'
                                ? "Jelaskan kondisi, spesifikasi, alasan jual..."
                                : postType === 'service'
                                    ? "Jelaskan layanan, benefit, pengalaman, portofolio..."
                                    : "Berikan detail informasi yang jelas..."
                        }
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                        maxLength={1000}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span className="text-red-500">{errors.description?.message as string}</span>
                        {/* @ts-ignore */}
                        <span>{watch('description')?.length || 0}/1000</span>
                    </div>
                </div>

                {/* Shipping Methods */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Metode Pengiriman <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" {...register('shippingMethods')} value="cod" />
                            <span>🤝 COD (Ketemuan di kampus) - GRATIS</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" {...register('shippingMethods')} value="courier" />
                            <span>📦 Kurir (JNE, J&T, SiCepat, dll)</span>
                        </label>
                    </div>
                    {errors.shippingMethods && (
                        <p className="text-red-500 text-xs mt-1">{errors.shippingMethods?.message as string}</p>
                    )}
                </div>

                {/* Hashtags */}
                <HashtagInput
                    // @ts-ignore
                    value={watch('hashtags') || []}
                    onChange={(tags) => setValue('hashtags', tags)}
                    maxTags={10}
                />

                <div className="h-10"></div>
            </form>
        </div>
    )
}
