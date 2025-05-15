'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getStoryById, likeStory, checkReaction, addComment, getCommentsByStoryId } from '../../../lib/firebase';
import UserNav from '../../components/UserNav';

// No fallback data - we'll handle errors properly

// Function to format date from Firestore timestamp
function formatDate(timestamp) {
  if (!timestamp) return '';

  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function StoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [reaction, setReaction] = useState(null); // 'like' or 'love' or null
  const [likeCount, setLikeCount] = useState(0);
  const [loveCount, setLoveCount] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch story data from Firebase
  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getStoryById(params.id);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.story) {
          setStory(result.story);
          setLikeCount(result.story.likes || 0);
          setLoveCount(result.story.loves || 0);

          // Fetch comments for this story
          const commentsResult = await getCommentsByStoryId(params.id);
          if (!commentsResult.error) {
            setComments(commentsResult.comments || []);
          }

          // Check if user has reacted to this story
          const reactionResult = await checkReaction(params.id);
          if (reactionResult.reacted) {
            setReaction(reactionResult.type);
          }
        } else {
          // Story not found
          setError('Story not found. It may have been removed or is no longer available.');
          setStory(null);
        }
      } catch (err) {
        console.error('Error fetching story:', err);
        setError('Failed to load story. Please try again later.');
        setStory(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStory();
    }
  }, [params.id, user]);

  const handleReaction = async (type) => {
    // Store original state to revert if needed
    const originalReaction = reaction;
    const originalLikeCount = likeCount;
    const originalLoveCount = loveCount;

    try {
      // Optimistically update UI
      if (type === 'like') {
        if (reaction === 'like') {
          // Removing like
          setReaction(null);
          setLikeCount(prev => Math.max(prev - 1, 0));
        } else if (reaction === 'love') {
          // Changing from love to like
          setReaction('like');
          setLikeCount(prev => prev + 1);
          setLoveCount(prev => Math.max(prev - 1, 0));
        } else {
          // Adding new like
          setReaction('like');
          setLikeCount(prev => prev + 1);
        }
      } else if (type === 'love') {
        if (reaction === 'love') {
          // Removing love
          setReaction(null);
          setLoveCount(prev => Math.max(prev - 1, 0));
        } else if (reaction === 'like') {
          // Changing from like to love
          setReaction('love');
          setLoveCount(prev => prev + 1);
          setLikeCount(prev => Math.max(prev - 1, 0));
        } else {
          // Adding new love
          setReaction('love');
          setLoveCount(prev => prev + 1);
        }
      }

      // No need to check for user, we'll create anonymous user if needed
      console.log("Sending reaction:", type, "for story:", params.id);
      const result = await likeStory(params.id, type);

      if (result.error) {
        console.error("Reaction error:", result.error);
        // Revert UI changes on error
        setReaction(originalReaction);
        setLikeCount(originalLikeCount);
        setLoveCount(originalLoveCount);
        throw new Error(result.error);
      }

      console.log("Reaction successful:", result);
    } catch (err) {
      // Revert UI changes on error
      setReaction(originalReaction);
      setLikeCount(originalLikeCount);
      setLoveCount(originalLoveCount);

      console.error('Error reacting to story:', err);
      alert('فشل في التفاعل مع القصة. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleShare = () => {
    setShowShareOptions(!showShareOptions);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    setShowShareOptions(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    // No need to check for user, we'll create anonymous user if needed
    setSubmittingComment(true);

    try {
      // Optimistically add the comment to the UI
      const tempComment = {
        id: 'temp-' + Date.now(),
        content: newComment,
        author: 'زائر مجهول',
        createdAt: new Date(),
        isTemp: true
      };

      // Add to the beginning of the comments array
      setComments(prev => [tempComment, ...prev]);

      // Clear comment input immediately for better UX
      setNewComment('');

      const result = await addComment(params.id, newComment);

      if (result.error) {
        // Remove the temporary comment if there was an error
        setComments(prev => prev.filter(c => c.id !== tempComment.id));
        throw new Error(result.error);
      }

      // Refresh comments to get the real one from the server
      const commentsResult = await getCommentsByStoryId(params.id);
      if (!commentsResult.error) {
        setComments(commentsResult.comments || []);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('فشل في إضافة تعليق. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-right" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="mt-4 text-foreground/70">جاري تحميل القصة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col text-right" dir="rtl">
        {/* Header with navigation back to stories */}
        <header className="py-6 border-b border-warm-gray/30 bg-background">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/spiral.svg"
                alt="شعار صدفة"
                width={28}
                height={28}
                className="ml-2"
              />
              <span className="text-primary font-medium text-xl">صدفة</span>
            </Link>
            <nav className="flex items-center">
              <Link href="/stories" className="text-foreground/70 hover:text-accent ml-6">
                جميع القصص
              </Link>
              <Link href="/share" className="btn btn-primary ml-4">
                شارك قصتك
              </Link>
              <UserNav />
            </nav>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded max-w-md text-center">
            <p className="font-medium mb-2">خطأ</p>
            <p>{error}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/stories" className="btn btn-primary">
                العودة إلى القصص
              </Link>
              <Link href="/share" className="btn btn-secondary">
                شارك قصتك
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-warm-gray/30 bg-background">
          <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image
                src="/spiral.svg"
                alt="شعار صدفة"
                width={24}
                height={24}
                className="ml-2"
              />
              <span className="text-primary font-medium">صدفة</span>
            </div>

            <div className="flex gap-6">
              <Link href="/about" className="text-foreground/70 hover:text-accent">عن الموقع</Link>
              <Link href="/stories" className="text-foreground/70 hover:text-accent">القصص</Link>
              <Link href="/share" className="text-foreground/70 hover:text-accent">شارك</Link>
            </div>

            <div className="mt-4 md:mt-0 text-sm text-foreground/50">
              © {new Date().getFullYear()} صدفة. جميع الحقوق محفوظة.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col text-right" dir="rtl">
        {/* Header with navigation back to stories */}
        <header className="py-6 border-b border-warm-gray/30 bg-background">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/spiral.svg"
                alt="شعار صدفة"
                width={28}
                height={28}
                className="ml-2"
              />
              <span className="text-primary font-medium text-xl">صدفة</span>
            </Link>
            <nav className="flex items-center">
              <Link href="/stories" className="text-foreground/70 hover:text-accent ml-6">
                جميع القصص
              </Link>
              <Link href="/share" className="btn btn-primary ml-4">
                شارك قصتك
              </Link>
              <UserNav />
            </nav>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">القصة غير موجودة</h2>
            <p className="text-foreground/70 mb-6">
              القصة التي تبحث عنها غير موجودة أو ربما تمت إزالتها.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/stories" className="btn btn-primary">
                تصفح القصص
              </Link>
              <Link href="/share" className="btn btn-secondary">
                شارك قصتك
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-warm-gray/30 bg-background">
          <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image
                src="/spiral.svg"
                alt="Sodfa logo"
                width={24}
                height={24}
                className="mr-2"
              />
              <span className="text-primary font-medium">Sodfa</span>
            </div>

            <div className="flex gap-6">
              <Link href="/about" className="text-foreground/70 hover:text-accent">About</Link>
              <Link href="/privacy" className="text-foreground/70 hover:text-accent">Privacy</Link>
              <Link href="/terms" className="text-foreground/70 hover:text-accent">Terms</Link>
              <Link href="/contact" className="text-foreground/70 hover:text-accent">Contact</Link>
            </div>

            <div className="mt-4 md:mt-0 text-sm text-foreground/50">
              © {new Date().getFullYear()} Sodfa. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-right" dir="rtl">
      {/* Header with navigation back to stories */}
      <header className="py-6 border-b border-warm-gray/30 bg-background">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/spiral.svg"
              alt="شعار صدفة"
              width={28}
              height={28}
              className="ml-2"
            />
            <span className="text-primary font-medium text-xl">صدفة</span>
          </Link>
          <nav className="flex items-center">
            <Link href="/stories" className="text-foreground/70 hover:text-accent ml-6">
              جميع القصص
            </Link>
            <Link href="/share" className="btn btn-primary ml-4">
              شارك قصتك
            </Link>
            <UserNav />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/stories" className="flex items-center text-primary mb-6 hover:underline">
            جميع القصص →
          </Link>

          <div className="story-container">
            <article>
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl md:text-4xl font-bold">{story.title}</h1>
                {story.status === 'pending' && (
                  <span className="text-sm px-3 py-1 rounded bg-yellow-100 text-yellow-800 mr-4">
                    قيد الانتظار
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {(story.tags || []).map(tag => (
                  <span key={tag} className="story-tag">
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </span>
                ))}
              </div>

              <div className="story-content">
                {typeof story.content === 'string' ?
                  story.content.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                  :
                  <p>{story.excerpt || 'لا يوجد محتوى متاح.'}</p>
                }
              </div>

              <div className="story-meta">
                <span className="story-author">بواسطة {story.author || 'زائر مجهول'}</span>
                <span className="story-date">{formatDate(story.createdAt || story.date)}</span>
              </div>

              <div className="story-actions">
                <button
                  className={`reaction-btn ${reaction === 'like' ? 'liked' : ''}`}
                  onClick={() => handleReaction('like')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span>{likeCount}</span>
                </button>

                <button
                  className={`reaction-btn ${reaction === 'love' ? 'loved' : ''}`}
                  onClick={() => handleReaction('love')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={reaction === 'love' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span>{loveCount}</span>
                </button>

                <div className="relative">
                  <button className="action-btn" onClick={handleShare}>
                    <Image src="/share.svg" alt="مشاركة" width={20} height={20} />
                    <span>مشاركة</span>
                  </button>

                  {showShareOptions && (
                    <div className="absolute top-full right-0 mt-2 p-2 bg-cream border border-warm-gray rounded-md shadow-md z-10">
                      <button
                        className="w-full text-right px-3 py-2 hover:bg-beige rounded"
                        onClick={copyToClipboard}
                      >
                        نسخ الرابط
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments section */}
              <div className="comments-section">
                <h3 className="text-xl font-semibold mb-4">التعليقات ({comments.length})</h3>

                {/* Comment form */}
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <div className="form-group">
                    <label htmlFor="comment" className="form-label">أضف تعليقًا</label>
                    <textarea
                      id="comment"
                      className="form-input form-textarea"
                      placeholder="شارك أفكارك..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submittingComment}
                      rows={3}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={submittingComment || !newComment.trim()}
                  >
                    {submittingComment ? 'جاري النشر...' : 'نشر التعليق'}
                  </button>
                </form>

                {/* Comments list */}
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <div
                      key={comment.id}
                      className={`comment ${comment.isTemp ? 'opacity-70 border-dashed' : ''}`}
                    >
                      <div className="comment-header">
                        <span className="comment-author">{comment.author}</span>
                        <span>{comment.isTemp ? 'جاري النشر...' : formatDate(comment.createdAt || comment.date)}</span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-foreground/70 text-center py-4">لا توجد تعليقات حتى الآن. كن أول من يشارك أفكاره!</p>
                )}
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-warm-gray/30 bg-background">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Image
              src="/spiral.svg"
              alt="شعار صدفة"
              width={24}
              height={24}
              className="ml-2"
            />
            <span className="text-primary font-medium">صدفة</span>
          </div>

          <div className="flex gap-6">
            <Link href="/about" className="text-foreground/70 hover:text-accent">عن الموقع</Link>
            <Link href="/stories" className="text-foreground/70 hover:text-accent">القصص</Link>
            <Link href="/share" className="text-foreground/70 hover:text-accent">شارك</Link>
          </div>

          <div className="mt-4 md:mt-0 text-sm text-foreground/50">
            © {new Date().getFullYear()} صدفة. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
