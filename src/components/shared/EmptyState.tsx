import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon?: string | React.ReactNode
    title: string
    description: string
    actionLabel?: string
    actionHref?: string
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    actionHref,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-4xl mb-4">
                {typeof icon === 'string' ? icon : icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-sm">{description}</p>

            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="bg-sky-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-sky-700 transition"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    )
}
