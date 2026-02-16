import { formatTimeAgo } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"

interface ChatBubbleProps {
    message: string
    isMe: boolean
    timestamp: Date | any
    status?: 'sent' | 'delivered' | 'read'
}

export default function ChatBubble({ message, isMe, timestamp, status }: ChatBubbleProps) {
    return (
        <div className={cn("flex flex-col mb-4", isMe ? "items-end" : "items-start")}>
            <div
                className={cn(
                    "px-4 py-2 rounded-2xl max-w-[80%] text-sm",
                    isMe
                        ? "bg-sky-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                )}
            >
                <p>{message}</p>
            </div>
            <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[10px] text-gray-400">
                    {formatTimeAgo(timestamp)}
                </span>
                {isMe && status && (
                    <span className="text-[10px] text-gray-400">
                        {status === 'read' ? '✓✓' : '✓'}
                    </span>
                )}
            </div>
        </div>
    )
}
