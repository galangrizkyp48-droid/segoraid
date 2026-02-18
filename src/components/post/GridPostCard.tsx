
import { Post } from '@/lib/types/user'
import { formatPrice } from '@/lib/utils/formatters'
import { Heart, MapPin } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function GridPostCard({ post }: { post: Post }) {
    const router = useRouter()

    return (
        <div
            onClick={() => router.push(`/post/${post.id}`)}
            className="bg-white rounded-xl border overflow-hidden cursor-pointer hover:shadow-md transition flex flex-col h-full"
        >
            <div className="relative aspect-square bg-gray-100">
                <Image
                    src={post.images[0] || '/placeholder.png'}
                    alt={post.title}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                    unoptimized
                />
                {post.type === 'product' && post.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-xs px-2 py-1 bg-black/50 rounded">TERJUAL</span>
                    </div>
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-sm font-medium line-clamp-2 leading-tight mb-1">{post.title}</h3>

                <div className="mt-auto">
                    <p className="text-sm font-bold text-orange-600">
                        {post.price_type === 'free' ? 'GRATIS' : formatPrice(post.price)}
                    </p>

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <MapPin size={10} />
                            <span className="truncate max-w-[80px]">{post.campus || 'Kampus'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Heart size={10} className="fill-gray-400 text-gray-400" />
                            <span>{post.likes_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
