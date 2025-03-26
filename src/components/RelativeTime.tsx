import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface RelativeTimeProps {
    timestamp: number;
    updateInterval?: number;
}

export function RelativeTime({ timestamp, updateInterval = 10000 }: RelativeTimeProps) {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const distance = formatDistanceToNow(timestamp, {
                addSuffix: true,
                includeSeconds: true
            }).replace('about ', '');
            setTimeAgo(distance);
        };

        // Update immediately
        updateTime();

        // Set up interval for updates
        const interval = setInterval(updateTime, updateInterval);

        return () => clearInterval(interval);
    }, [timestamp, updateInterval]);

    return <span className="opacity-70 whitespace-nowrap">{timeAgo}</span>;
} 