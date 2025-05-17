'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getStoryById, likeStory, checkReaction, addComment, getCommentsByStoryId, deleteStory } from '../../../lib/firebase';
import { getClientId } from '../../../lib/clientId';
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
  const [loadingComments, setLoadingComments] = useState(false);

  // State for index warning
  const [indexWarning, setIndexWarning] = useState(null);
  const [indexUrl, setIndexUrl] = useState(null);

  // State for deleting story
  const [deletingStory, setDeletingStory] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Function to fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    setIndexWarning(null);
    setIndexUrl(null);

    try {
      // Use a high limit (200) to ensure we get all comments
      const commentsResult = await getCommentsByStoryId(params.id, 200);

      if (commentsResult.error) {
        console.error('Error fetching comments:', commentsResult.error);
        // If there's an index URL, store it for the user
        if (commentsResult.indexUrl) {
          setIndexUrl(commentsResult.indexUrl);
          setIndexWarning('This query requires a Firestore index. Please create it in the Firebase console.');
        }
      } else {
        setComments(commentsResult.comments || []);
        console.log(`Loaded ${commentsResult.comments?.length || 0} comments for story ${params.id}`);

        // Check if there's an index warning
        if (commentsResult.indexWarning) {
          setIndexWarning(commentsResult.indexWarning);
        }
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

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
          await fetchComments();

          // Check if user has reacted to this story
          // For shadow users, we don't track individual reactions
          // so this will always return false
          const clientId = getClientId();
          const reactionResult = await checkReaction(params.id, clientId);
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

  // Refresh comments periodically
  useEffect(() => {
    // Don't set up the interval if there's no story loaded
    if (!story) return;

    // Refresh comments every 30 seconds
    const intervalId = setInterval(() => {
      fetchComments();
    }, 30000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [story, params.id]);

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

      // Get client ID for non-logged in users
      const clientId = getClientId();

      // Send reaction with client ID
      console.log("Sending reaction:", type, "for story:", params.id, "with clientId:", clientId);
      const result = await likeStory(params.id, type, clientId);

      if (result.error) {
        console.error("Reaction error:", result.error, result.errorCode);
        // Revert UI changes on error
        setReaction(originalReaction);
        setLikeCount(originalLikeCount);
        setLoveCount(originalLoveCount);

        // Display appropriate error message based on error code
        let errorMessage = 'فشل في التفاعل مع القصة. يرجى المحاولة مرة أخرى.';

        if (result.errorCode === 'auth/network-request-failed') {
          errorMessage = 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
        } else if (result.errorCode === 'auth/too-many-requests') {
          errorMessage = 'طلبات كثيرة جدًا. يرجى المحاولة مرة أخرى لاحقًا أو تسجيل الدخول بحساب.';
        } else if (result.errorCode === 'auth/operation-not-allowed') {
          errorMessage = 'تسجيل الدخول المجهول غير مسموح به. يرجى تسجيل الدخول بحساب.';
        } else if (result.errorCode === 'auth/admin-restricted-operation') {
          errorMessage = 'هذه العملية مقيدة للمستخدمين المجهولين. يرجى تسجيل الدخول بحساب عادي.';
        }

        alert(errorMessage);
        throw new Error(result.error);
      }

      console.log("Reaction successful:", result);
    } catch (err) {
      // Revert UI changes on error
      setReaction(originalReaction);
      setLikeCount(originalLikeCount);
      setLoveCount(originalLoveCount);

      console.error('Error reacting to story:', err);
      // Alert is already shown above if it's a known error
      if (!err.message || !err.message.includes('Failed to create anonymous user')) {
        alert('فشل في التفاعل مع القصة. يرجى المحاولة مرة أخرى.');
      }
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

  // Handle story deletion
  const handleDeleteStory = async () => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذه القصة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setDeletingStory(true);
      setDeleteError(null);

      try {
        // Get client ID for shadow users
        const clientId = getClientId();

        const result = await deleteStory(params.id, clientId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete story');
        }

        // Redirect to stories page after successful deletion
        router.push('/stories');

      } catch (err) {
        console.error('Error deleting story:', err);
        setDeleteError('فشل في حذف القصة. يرجى المحاولة مرة أخرى.');
        setDeletingStory(false);
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    // Get client ID for non-logged in users
    const clientId = getClientId();
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

      // Send comment with client ID
      console.log("Sending comment for story:", params.id, "with clientId:", clientId);
      const result = await addComment(params.id, newComment, clientId);

      if (result.error) {
        // Remove the temporary comment if there was an error
        setComments(prev => prev.filter(c => c.id !== tempComment.id));

        // Display appropriate error message based on error code
        let errorMessage = 'فشل في إضافة تعليق. يرجى المحاولة مرة أخرى.';

        if (result.errorCode === 'auth/network-request-failed') {
          errorMessage = 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
        } else if (result.errorCode === 'auth/too-many-requests') {
          errorMessage = 'طلبات كثيرة جدًا. يرجى المحاولة مرة أخرى لاحقًا أو تسجيل الدخول بحساب.';
        } else if (result.errorCode === 'auth/operation-not-allowed') {
          errorMessage = 'تسجيل الدخول المجهول غير مسموح به. يرجى تسجيل الدخول بحساب.';
        } else if (result.errorCode === 'auth/admin-restricted-operation') {
          errorMessage = 'هذه العملية مقيدة للمستخدمين المجهولين. يرجى تسجيل الدخول بحساب عادي.';
        }

        alert(errorMessage);
        throw new Error(result.error);
      }

      // Refresh comments to get the real one from the server
      await fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      // Alert is already shown above if it's a known error
      if (!err.message || !err.message.includes('Failed to create anonymous user')) {
        alert('فشل في إضافة تعليق. يرجى المحاولة مرة أخرى.');
      }
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
              {/* Delete error message */}
              {deleteError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
                  <p>{deleteError}</p>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl md:text-4xl font-bold">{story.title}</h1>

                {/* Show delete button if user is the author */}
                {user && story.authorId === user.uid && (
                  <button
                    onClick={handleDeleteStory}
                    disabled={deletingStory}
                    className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  >
                    {deletingStory ? 'جاري الحذف...' : 'حذف القصة'}
                  </button>
                )}
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
              <div className="comments-section mt-12 pt-8 border-t border-warm-gray/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold">التعليقات ({comments.length})</h3>
                  <button
                    onClick={() => fetchComments()}
                    className="text-sm text-accent hover:underline flex items-center gap-1"
                    disabled={loadingComments}
                  >
                    {loadingComments ? 'جاري التحديث...' : 'تحديث التعليقات'}
                    {!loadingComments && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Comment form */}
                <form onSubmit={handleCommentSubmit} className="mb-8 bg-cream/50 p-6 rounded-lg border border-warm-gray/20 shadow-sm">
                  <div className="form-group">
                    <label htmlFor="comment" className="form-label text-lg mb-2">أضف تعليقًا</label>
                    <textarea
                      id="comment"
                      className="form-input form-textarea w-full p-3 rounded-md border border-warm-gray/30 focus:border-accent focus:ring focus:ring-accent/20 transition"
                      placeholder="شارك أفكارك..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submittingComment}
                      rows={3}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="action-btn mt-3 bg-accent hover:bg-accent/90 text-white py-2 px-4 rounded-md transition"
                    disabled={submittingComment || !newComment.trim()}
                  >
                    {submittingComment ? 'جاري النشر...' : 'نشر التعليق'}
                  </button>
                </form>

                {/* Comments list */}
                <div className="space-y-4">
                  {/* Index warning message */}
                  {indexWarning && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="mr-3">
                          <h3 className="text-sm font-medium text-yellow-800">تنبيه الفهرس</h3>
                          <div className="mt-1 text-sm text-yellow-700">
                            <p>{indexWarning}</p>
                            {indexUrl && (
                              <a
                                href={indexUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center px-3 py-1.5 border border-yellow-300 text-xs font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                              >
                                إنشاء الفهرس في Firebase
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {loadingComments ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mb-2"></div>
                      <p className="text-foreground/70">جاري تحميل التعليقات...</p>
                    </div>
                  ) : comments.length > 0 ? (
                    <>
                      <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                        <p className="text-accent font-medium text-sm">تم تحميل {comments.length} تعليق</p>
                      </div>
                      {comments.map(comment => (
                        <div
                          key={comment.id}
                          className={`comment bg-white p-4 rounded-lg border border-warm-gray/20 shadow-sm ${comment.isTemp ? 'opacity-70 border-dashed' : ''}`}
                        >
                          <div className="comment-header flex justify-between items-center mb-2 text-sm text-foreground/70">
                            <span className="comment-author font-medium text-foreground">{comment.author}</span>
                            <span>{comment.isTemp ? 'جاري النشر...' : formatDate(comment.createdAt || comment.date)}</span>
                          </div>
                          <p className="comment-content text-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="bg-cream/30 border border-warm-gray/20 rounded-lg p-6 text-center">
                      <p className="text-foreground/70">لا توجد تعليقات حتى الآن. كن أول من يشارك أفكاره!</p>
                    </div>
                  )}
                </div>
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
