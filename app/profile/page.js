'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { getStoriesByUser, deleteStory } from '../../lib/firebase';
import { getClientId } from '../../lib/clientId';
import UserNav from '../components/UserNav';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [deletingStory, setDeletingStory] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user's stories
  useEffect(() => {
    const fetchUserStories = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const result = await getStoriesByUser(user.uid);

        if (result.error) {
          throw new Error(result.error);
        }

        setUserStories(result.stories || []);
      } catch (err) {
        console.error('Error fetching user stories:', err);
        setError('Failed to load your stories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserStories();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Format date from Firestore timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Translations
  const translations = {
    en: {
      loading: "Loading profile...",
      yourProfile: "Your Profile",
      anonymousUser: "Anonymous User",
      yourStories: "Your Stories",
      noStories: "You haven't shared any stories yet.",
      shareFirst: "Share Your First Story",
      viewStory: "View Story →",
      deleteStory: "Delete",
      deleting: "Deleting...",
      allStories: "All Stories",
      signOut: "Sign Out",
      loadingStories: "Loading your stories...",
      errorLoading: "Failed to load your stories. Please try again later.",
      deleteError: "Failed to delete story. Please try again.",
      approved: "Approved",
      pending: "Pending",
      draft: "Draft"
    },
    ar: {
      loading: "جاري تحميل الملف الشخصي...",
      yourProfile: "ملفك الشخصي",
      anonymousUser: "مستخدم مجهول",
      yourStories: "قصصك",
      noStories: "لم تشارك أي قصص بعد.",
      shareFirst: "شارك قصتك الأولى",
      viewStory: "← عرض القصة",
      deleteStory: "حذف",
      deleting: "جاري الحذف...",
      allStories: "جميع القصص",
      signOut: "تسجيل الخروج",
      loadingStories: "جاري تحميل قصصك...",
      errorLoading: "فشل تحميل قصصك. يرجى المحاولة مرة أخرى لاحقًا.",
      deleteError: "فشل في حذف القصة. يرجى المحاولة مرة أخرى.",
      approved: "معتمدة",
      pending: "قيد الانتظار",
      draft: "مسودة"
    }
  };

  // Get current language translations
  const t = translations[language];

  // Handle language toggle
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // Handle story deletion
  const handleDeleteStory = async (storyId) => {
    if (window.confirm(language === 'en' ? 'Are you sure you want to delete this story? This action cannot be undone.' : 'هل أنت متأكد أنك تريد حذف هذه القصة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setDeletingStory(storyId);
      setDeleteError(null);

      try {
        // Get client ID for shadow users
        const clientId = getClientId();

        const result = await deleteStory(storyId, clientId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete story');
        }

        // Remove the story from the list
        setUserStories(prev => prev.filter(story => story.id !== storyId));

      } catch (err) {
        console.error('Error deleting story:', err);
        setDeleteError(language === 'en' ? 'Failed to delete story. Please try again.' : 'فشل في حذف القصة. يرجى المحاولة مرة أخرى.');
      } finally {
        setDeletingStory(null);
      }
    }
  };

  // Handle errors in the profile page
  const handleRetry = () => {
    if (user) {
      setLoading(true);
      setError(null);
      getStoriesByUser(user.uid)
        .then(result => {
          if (result.error) {
            throw new Error(result.error);
          }
          setUserStories(result.stories || []);
        })
        .catch(err => {
          console.error('Error fetching user stories:', err);
          setError(t.errorLoading);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="mt-4 text-foreground/70">{t.loading}</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className={`min-h-screen flex flex-col ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="py-6 border-b border-warm-gray/30">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/spiral.svg"
              alt="Sodfa logo"
              width={28}
              height={28}
              className={language === 'ar' ? 'ml-2' : 'mr-2'}
            />
            <span className="text-primary font-medium text-xl">Sodfa</span>
          </Link>
          <div className="flex items-center">
            <button
              onClick={toggleLanguage}
              className="text-foreground/70 hover:text-accent mr-4"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            <Link href="/stories" className="text-foreground/70 hover:text-accent mr-4">
              {t.allStories}
            </Link>
            <button
              onClick={handleSignOut}
              className="text-foreground/70 hover:text-accent"
            >
              {t.signOut}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-cream rounded-lg p-6 mb-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-4">{t.yourProfile}</h1>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  width={70}
                  height={70}
                  className={`rounded-full ${language === 'ar' ? 'ml-4' : 'mr-4'}`}
                />
              ) : (
                <div className={`w-[70px] h-[70px] bg-warm-gray rounded-full flex items-center justify-center ${language === 'ar' ? 'ml-4' : 'mr-4'}`}>
                  <span className="text-light-text text-xl font-bold">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-xl">{user.displayName || t.anonymousUser}</p>
                {user.email && <p className="text-foreground/70 mt-1">{user.email}</p>}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">{t.yourStories}</h2>

          {/* Delete error message */}
          {deleteError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              <p>{deleteError}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
              <p className="ml-4 text-foreground/70">{t.loadingStories}</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              <p className="mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                {language === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
              </button>
            </div>
          ) : userStories.length === 0 ? (
            <div className="text-center py-12 bg-cream rounded-lg shadow-sm">
              <p className="text-lg text-foreground/70 mb-6">{t.noStories}</p>
              <Link href="/share" className="btn btn-primary">
                {t.shareFirst}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userStories.map(story => (
                <div key={story.id} className="story-card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-medium">{story.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${story.status === 'approved' ? 'bg-green-100 text-green-800' :
                      story.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {story.status === 'approved' ? t.approved :
                        story.status === 'pending' ? t.pending :
                          t.draft}
                    </span>
                  </div>
                  <p className="text-foreground/70 mb-4 line-clamp-2">{story.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      <Link
                        href={`/stories/${story.id}`}
                        className="text-accent font-medium hover:underline flex items-center"
                      >
                        {t.viewStory}
                      </Link>
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        disabled={deletingStory === story.id}
                        className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
                      >
                        {deletingStory === story.id ? t.deleting : t.deleteStory}
                      </button>
                    </div>
                    <span className="text-sm text-foreground/50">
                      {formatDate(story.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-warm-gray/30">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Image
              src="/spiral.svg"
              alt="Sodfa logo"
              width={24}
              height={24}
              className={language === 'ar' ? 'ml-2' : 'mr-2'}
            />
            <span className="text-primary font-medium">Sodfa</span>
          </div>

          <div className="flex gap-6">
            <Link href="/about" className="text-foreground/70 hover:text-accent">
              {language === 'en' ? 'About' : 'عن الموقع'}
            </Link>
            <Link href="/stories" className="text-foreground/70 hover:text-accent">
              {language === 'en' ? 'Stories' : 'القصص'}
            </Link>
          </div>

          <div className="mt-4 md:mt-0 text-sm text-foreground/50">
            © {new Date().getFullYear()} Sodfa. {language === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
          </div>
        </div>
      </footer>
    </div>
  );
}
