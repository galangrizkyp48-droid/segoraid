export default function LoadingSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white border-b p-4 animate-pulse">
                    {/* Seller info skeleton */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-24" />
                        </div>
                    </div>

                    {/* Image skeleton */}
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4" />

                    {/* Content skeleton */}
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    )
}
