import { cn } from "@/lib/utils"

interface CategoryChipProps {
    type: string
    category: string
    className?: string
}

export default function CategoryChip({ type, category, className }: CategoryChipProps) {
    const getColors = () => {
        switch (type) {
            case 'product': return 'bg-blue-100 text-blue-700'
            case 'service': return 'bg-purple-100 text-purple-700'
            case 'info': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getLabel = () => {
        switch (type) {
            case 'product': return '📦 Produk'
            case 'service': return '🎨 Jasa'
            case 'info': return '💼 Info'
            default: return type
        }
    }

    return (
        <span className={cn(
            "text-xs px-2 py-1 rounded-md font-medium",
            getColors(),
            className
        )}>
            {getLabel()} • {category}
        </span>
    )
}
