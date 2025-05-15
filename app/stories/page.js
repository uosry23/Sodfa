'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getStories, getStoriesByTag, likeStory, checkReaction } from '../../lib/firebase';
import UserNav from '../components/UserNav';
import { useAuth } from '../../context/AuthContext';

// No fallback data - we'll handle empty states properly

// Default available tags
const DEFAULT_TAGS = [
  'mysterious', 'emotional', 'funny', 'spooky',
  'travel', 'friendship', 'family', 'career', 'love', 'general'
];

export default function StoriesPage() {
  const { user } = useAuth();

  const [stories, setStories] = useState([]);
  const [allTags, setAllTags] = useState(DEFAULT_TAGS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const storiesPerPage = 6;

  // State for reactions
  const [storyReactions, setStoryReactions] = useState({});

  // Fetch all stories and tags from Firebase
  useEffect(() => {
    const fetchAllStories = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always fetch all stories first to get all available tags
        const result = await getStories(50); // Fetch up to 50 stories

        if (result.error) {
          throw new Error(result.error);
        }

        // Show all stories (approved, pending, and those without status)
        // This ensures newly submitted stories appear in the list
        const allVisibleStories = result.stories.filter(story =>
          story.status === 'approved' || story.status === 'pending' || !story.status
        );

        if (allVisibleStories.length > 0) {
          // If not filtering, set all stories
          if (activeFilter === 'all') {
            setStories(allVisibleStories);
          } else {
            // Filter stories by tag
            const filteredStories = allVisibleStories.filter(story =>
              story.tags && story.tags.includes(activeFilter)
            );
            setStories(filteredStories.length > 0 ? filteredStories : []);
          }

          // Extract all unique tags from all stories (not just filtered ones)
          const tags = [...new Set(allVisibleStories.flatMap(story => story.tags || []))];
          setAllTags(tags.length > 0 ? tags : DEFAULT_TAGS);

          // Check user reactions for each story
          if (user) {
            const reactions = {};
            for (const story of allVisibleStories) {
              const reaction = await checkReaction(story.id);
              if (reaction.reacted) {
                reactions[story.id] = reaction.type;
              }
            }
            setStoryReactions(reactions);
          }
        } else {
          // No stories found
          setStories([]);
          setError('لم يتم العثور على قصص. كن أول من يشارك قصة!');
        }
      } catch (err) {
        console.error('Error fetching stories:', err);
        setError('فشل تحميل القصص. يرجى المحاولة مرة أخرى لاحقًا.');
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStories();
  }, [activeFilter, user]);

  // Handle story reactions (like/love)
  const handleReaction = async (storyId, reactionType) => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }

    try {
      const result = await likeStory(storyId, reactionType);

      if (result.success) {
        // Update local state
        setStoryReactions(prev => {
          const newReactions = { ...prev };

          if (result.reacted) {
            newReactions[storyId] = result.type;
          } else {
            delete newReactions[storyId];
          }

          return newReactions;
        });

        // Update story in the list to reflect new reaction count
        setStories(prev =>
          prev.map(story => {
            if (story.id === storyId) {
              const updatedStory = { ...story };

              if (reactionType === 'like') {
                updatedStory.likes = result.reacted
                  ? (story.likes || 0) + 1
                  : Math.max((story.likes || 0) - 1, 0);
              } else if (reactionType === 'love') {
                updatedStory.loves = result.reacted
                  ? (story.loves || 0) + 1
                  : Math.max((story.loves || 0) - 1, 0);
              }

              return updatedStory;
            }
            return story;
          })
        );
      }
    } catch (error) {
      console.error('Error reacting to story:', error);
    }
  };

  // Sort stories based on selected option
  const sortedStories = [...stories].sort((a, b) => {
    if (sortBy === 'latest') {
      // Handle Firestore timestamps
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.date || 0);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.date || 0);
      return dateB - dateA;
    } else if (sortBy === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    } else if (sortBy === 'random') {
      return 0.5 - Math.random();
    }
    return 0;
  });

  // Paginate stories
  const indexOfLastStory = currentPage * storiesPerPage;
  const indexOfFirstStory = indexOfLastStory - storiesPerPage;
  const currentStories = sortedStories.slice(indexOfFirstStory, indexOfLastStory);
  const totalPages = Math.ceil(sortedStories.length / storiesPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format date from Firestore timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Arabic translations
  const t = {
    title: "اقرأ قصصًا حقيقية عن مصادفات لا تصدق",
    shareStory: "شارك قصتك",
    allStories: "جميع القصص",
    sortBy: "ترتيب حسب:",
    latest: "الأحدث",
    popular: "الأكثر شعبية",
    random: "عشوائي",
    noStories: "لم يتم العثور على قصص. جرب تصفية مختلفة أو كن أول من يشارك قصة!",
    readMore: "← اقرأ المزيد",
    by: "بواسطة",
    pending: "قيد الانتظار",
    loading: "جاري تحميل القصص...",
    like: "أعجبني",
    love: "أحببته"
  };

  return (
    <div className="min-h-screen flex flex-col text-right" dir="rtl">
      {/* Header with navigation back to home */}
      <header className="py-6 border-b border-warm-gray/30 bg-cream/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
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
          <div className="flex items-center gap-4">
            <Link href="/share" className="btn btn-primary">
              {t.shareStory}
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page title */}
          <div className="relative mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 relative z-10">
              {t.title}
            </h1>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-accent/5 rounded-full blur-3xl -z-10"></div>
            <div className="w-20 h-1 bg-accent mx-auto rounded-full"></div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 bg-cream/50 p-6 rounded-xl border border-warm-gray/20 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                className={`story-tag ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                {t.allStories}
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`story-tag ${activeFilter === tag ? 'active' : ''}`}
                  onClick={() => setActiveFilter(tag)}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center flex-row-reverse">
              <label htmlFor="sort" className="mr-2 text-sm text-foreground/70">
                {t.sortBy}
              </label>
              <select
                id="sort"
                className="filter-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">{t.latest}</option>
                <option value="popular">{t.popular}</option>
                <option value="random">{t.random}</option>
              </select>
            </div>
          </div>

          {/* Loading and error states */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mb-4"></div>
              <p className="text-foreground/70">{t.loading}</p>
            </div>
          ) : error ? (
            <div className="bg-error/10 border border-error/30 text-error px-6 py-4 rounded-lg mb-12 shadow-sm">
              <p className="font-medium">{error}</p>
            </div>
          ) : currentStories.length === 0 ? (
            <div className="text-center py-16 bg-cream/50 rounded-xl border border-warm-gray/20 shadow-sm">
              <Image
                src="/spiral.svg"
                alt="لا توجد قصص"
                width={64}
                height={64}
                className="mx-auto mb-6 opacity-50"
              />
              <p className="text-lg text-foreground/70 mb-6">{t.noStories}</p>
              <Link href="/share" className="btn btn-primary">
                {t.shareStory}
              </Link>
            </div>
          ) : (
            /* Stories grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {currentStories.map(story => (
                <div key={story.id} className="story-card fade-in">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-medium">{story.title}</h2>
                    {story.status === 'pending' && (
                      <span className="text-xs px-2 py-1 rounded bg-warning/20 text-warning-800 border border-warning/30">
                        {t.pending}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/70 mb-4 line-clamp-3">{story.excerpt}</p>
                  <div className="mb-4 flex flex-wrap">
                    {(story.tags || []).map(tag => (
                      <span
                        key={tag}
                        className="story-tag"
                        onClick={() => setActiveFilter(tag)}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </span>
                    ))}
                  </div>

                  {/* Reactions */}
                  <div className="flex gap-2 mb-4">
                    <button
                      className={`reaction-btn ${storyReactions[story.id] === 'like' ? 'liked' : ''}`}
                      onClick={() => handleReaction(story.id, 'like')}
                      aria-label={t.like}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                      {story.likes > 0 && (
                        <span className="reaction-count">{story.likes}</span>
                      )}
                    </button>

                    <button
                      className={`reaction-btn ${storyReactions[story.id] === 'love' ? 'loved' : ''}`}
                      onClick={() => handleReaction(story.id, 'love')}
                      aria-label={t.love}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={storyReactions[story.id] === 'love' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      {story.loves > 0 && (
                        <span className="reaction-count">{story.loves}</span>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-warm-gray/20">
                    {story.id ? (
                      <Link
                        href={`/stories/${story.id}`}
                        className="text-accent font-medium hover:underline flex items-center gap-1"
                      >
                        {t.readMore}
                      </Link>
                    ) : (
                      <span className="text-accent/50 cursor-not-allowed">{t.readMore}</span>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-foreground/50">
                        {formatDate(story.createdAt || story.date)}
                      </span>
                      {story.author && (
                        <span className="text-xs text-foreground/50 mt-1">
                          {t.by} {story.author}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                  onClick={() => handlePageChange(number)}
                  aria-label={`Page ${number}`}
                >
                  {number}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-warm-gray/30 bg-cream/30">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <Image
              src="/spiral.svg"
              alt="شعار صدفة"
              width={28}
              height={28}
              className="ml-3"
            />
            <span className="text-primary font-medium text-xl">صدفة</span>
          </div>

          <div className="flex gap-8 mb-6 md:mb-0">
            <Link href="/about" className="text-foreground/70 hover:text-accent font-medium">
              عن الموقع
            </Link>
            <Link href="/stories" className="text-foreground/70 hover:text-accent font-medium">
              القصص
            </Link>
            <Link href="/share" className="text-foreground/70 hover:text-accent font-medium">
              شارك
            </Link>
          </div>

          <div className="text-sm text-foreground/50">
            © {new Date().getFullYear()} صدفة. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
