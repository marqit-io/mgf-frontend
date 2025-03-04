import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ThumbsUp, ThumbsDown, Trash2, Clock, ExternalLink } from 'lucide-react';

interface Comment {
  id: string;
  walletAddress: string;
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  userHasLiked?: boolean;
  userHasDisliked?: boolean;
}

interface CommentSectionProps {
  tokenId: string;
}

export function CommentSection({ tokenId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Simulated user state - replace with actual wallet connection
  const isConnected = false;
  const userAddress = '';

  useEffect(() => {
    // Simulate loading comments
    const mockComments: Comment[] = [
      {
        id: '1',
        walletAddress: '7Vz3dXzgahGHhRGBkJNXzXN1nrJrh8aBFESCwn5tYkq2',
        content: 'Strong fundamentals and consistent growth. The burn mechanism is particularly interesting.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        likes: 24,
        dislikes: 2,
      },
      {
        id: '2',
        walletAddress: '3Kp8jKVgpVK8QW2MGk2jBWmj2YZvECWmx5',
        content: 'Been following this project since launch. The team delivers consistently.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        likes: 18,
        dislikes: 1,
      },
    ];

    setTimeout(() => {
      setComments(mockComments);
      setIsLoading(false);
    }, 1000);
  }, [tokenId]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      walletAddress: userAddress,
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleVote = (commentId: string, type: 'like' | 'dislike') => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        if (type === 'like') {
          if (comment.userHasLiked) {
            return { ...comment, likes: comment.likes - 1, userHasLiked: false };
          } else {
            return {
              ...comment,
              likes: comment.likes + 1,
              dislikes: comment.userHasDisliked ? comment.dislikes - 1 : comment.dislikes,
              userHasLiked: true,
              userHasDisliked: false,
            };
          }
        } else {
          if (comment.userHasDisliked) {
            return { ...comment, dislikes: comment.dislikes - 1, userHasDisliked: false };
          } else {
            return {
              ...comment,
              dislikes: comment.dislikes + 1,
              likes: comment.userHasLiked ? comment.likes - 1 : comment.likes,
              userHasDisliked: true,
              userHasLiked: false,
            };
          }
        }
      }
      return comment;
    }));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatWalletAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSolscanUrl = (address: string) => {
    return `https://solscan.io/account/${address}`;
  };

  return (
    <div className="terminal-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={20} />
        <h2 className="terminal-header">&gt; COMMUNITY_DISCUSSION</h2>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isConnected ? "Enter your comment..." : "Connect wallet to comment"}
            disabled={!isConnected}
            className="terminal-input flex-1 px-4 py-2"
          />
          <button
            type="submit"
            disabled={!isConnected || !newComment.trim()}
            className="terminal-button px-6 py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            POST
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-[#00ff00] animate-pulse">Loading comments...</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 opacity-70">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className="terminal-card bg-black/30 p-4 space-y-3"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <a
                  href={getSolscanUrl(comment.walletAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm flex items-center gap-1 hover:text-[#00ff00] transition-colors"
                >
                  {formatWalletAddress(comment.walletAddress)}
                  <ExternalLink size={12} className="opacity-50" />
                </a>
                <div className="flex items-center gap-2 text-xs opacity-70">
                  <Clock size={12} />
                  {formatTimeAgo(comment.timestamp)}
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-sm">{comment.content}</p>

              {/* Comment Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(comment.id, 'like')}
                    className={`terminal-button px-2 py-1 text-xs flex items-center gap-1
                      ${comment.userHasLiked ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''}`}
                    disabled={!isConnected}
                  >
                    <ThumbsUp size={12} />
                    {comment.likes}
                  </button>
                  <button
                    onClick={() => handleVote(comment.id, 'dislike')}
                    className={`terminal-button px-2 py-1 text-xs flex items-center gap-1
                      ${comment.userHasDisliked ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''}`}
                    disabled={!isConnected}
                  >
                    <ThumbsDown size={12} />
                    {comment.dislikes}
                  </button>
                </div>
                {comment.walletAddress === userAddress && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="terminal-button px-2 py-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}