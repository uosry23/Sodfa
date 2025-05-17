'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { addStory } from '../../lib/firebase';
import UserNav from '../components/UserNav';

export default function SharePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    story: '',
    author: '',
    isAnonymous: false,
    tags: []
  });

  // Validation state
  const [errors, setErrors] = useState({});

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [storyId, setStoryId] = useState(null);

  // Set author name from user profile if available
  useEffect(() => {
    if (user && !authLoading && user.displayName) {
      setFormData(prev => ({
        ...prev,
        author: user.displayName
      }));
    }
  }, [user, authLoading]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle anonymous toggle
  const handleAnonymousToggle = () => {
    setFormData({
      ...formData,
      isAnonymous: !formData.isAnonymous,
      author: formData.isAnonymous ? (user?.displayName || '') : formData.author
    });
  };

  // Handle tag selection
  const handleTagToggle = (tag) => {
    const updatedTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];

    setFormData({
      ...formData,
      tags: updatedTags
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'الرجاء إدخال عنوان';
    } else if (formData.title.length > 100) {
      newErrors.title = 'يجب أن يكون العنوان أقل من 100 حرف';
    }

    if (!formData.story.trim()) {
      newErrors.story = 'الرجاء إدخال قصتك';
    } else if (formData.story.length < 50) {
      newErrors.story = 'يجب أن تكون القصة 50 حرفًا على الأقل';
    }

    if (!formData.isAnonymous && !formData.author.trim()) {
      newErrors.author = 'الرجاء إدخال اسمك أو اختيار مجهول';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError('');

      try {
        console.log("Submitting story...");

        // Prepare story data - no need to check for login, we'll use anonymous user if needed
        const storyData = {
          title: formData.title,
          content: formData.story,
          excerpt: formData.story.substring(0, 150) + (formData.story.length > 150 ? '...' : ''),
          author: formData.isAnonymous ? 'زائر مجهول' : formData.author,
          isAnonymous: formData.isAnonymous,
          tags: formData.tags.length > 0 ? formData.tags : ['general']
        };

        console.log("Story data prepared:", storyData);

        // Submit story to Firebase
        const result = await addStory(storyData);
        console.log("Story submission result:", result);

        if (result.success) {
          // Save the story ID for the success page
          setStoryId(result.storyId);
          setIsSubmitted(true);

          // Reset form after submission
          setFormData({
            title: '',
            story: '',
            author: user?.displayName || '',
            isAnonymous: false,
            tags: []
          });
        } else {
          console.error('Story submission failed:', result.error, result.errorCode);

          // Display appropriate error message based on error code
          let errorMessage = 'فشل في إرسال القصة. يرجى المحاولة مرة أخرى.';

          if (result.errorCode) {
            switch (result.errorCode) {
              case 'auth/network-request-failed':
                errorMessage = 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
                break;
              case 'auth/too-many-requests':
                errorMessage = 'طلبات كثيرة جدًا. يرجى المحاولة مرة أخرى لاحقًا أو تسجيل الدخول بحساب.';
                break;
              case 'auth/operation-not-allowed':
                errorMessage = 'تسجيل الدخول المجهول غير مسموح به. يرجى تسجيل الدخول بحساب.';
                break;
              default:
                errorMessage = result.error || 'فشل في إرسال القصة. يرجى المحاولة مرة أخرى.';
            }
          } else {
            errorMessage = result.error || 'فشل في إرسال القصة. يرجى المحاولة مرة أخرى.';
          }

          setSubmitError(errorMessage);
        }
      } catch (error) {
        console.error('Error submitting story:', error);
        setSubmitError(error.message || 'فشل في إرسال القصة. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Available tags
  const availableTags = [
    'mysterious', 'emotional', 'funny', 'spooky',
    'travel', 'friendship', 'family', 'career', 'love'
  ];

  return (
    <div className="min-h-screen flex flex-col text-right" dir="rtl">
      {/* Header */}
      <header className="py-6 border-b border-warm-gray/30">
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
              اقرأ القصص
            </Link>
            <UserNav />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
            شارك قصة المصادفة الخاصة بك
          </h1>

          {isSubmitted ? (
            <div className="success-message">
              <h2 className="text-2xl font-bold mb-4">شكراً لمشاركة قصتك!</h2>
              <p className="mb-4">تم تقديم قصتك بنجاح وهي الآن مميزة بعلامة "قيد الانتظار".</p>
              <p className="mb-6">
                <strong>ماذا يحدث بعد ذلك؟</strong><br />
                • قصتك الآن مرئية في قائمة القصص مع شارة "قيد الانتظار"<br />
                • يمكنك عرض ومشاركة قصتك على الفور<br />
                • في بيئة إنتاج حقيقية، ستتم مراجعة القصص قبل الموافقة عليها بالكامل
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/stories" className="btn btn-primary">
                  عرض جميع القصص
                </Link>
                {storyId && (
                  <Link href={`/stories/${storyId}`} className="btn btn-secondary">
                    عرض قصتك
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="form-container">
              <p className="text-center text-foreground/80 mb-8">
                شارك قصة المصادفة الحقيقية الخاصة بك مع مجتمعنا. سواء كانت غامضة،
                مضحكة، أو مغيرة للحياة، نود أن نسمع قصتك.
              </p>

              <form onSubmit={handleSubmit}>
                {submitError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{submitError}</p>
                  </div>
                )}

                {/* Title field */}
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    العنوان <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className={`form-input ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="أعط قصتك عنوانًا جذابًا"
                    value={formData.title}
                    onChange={handleChange}
                  />
                  {errors.title && <p className="form-error">{errors.title}</p>}
                  <p className="form-hint">اجعله قصيرًا وجذابًا</p>
                </div>

                {/* Story field */}
                <div className="form-group">
                  <label htmlFor="story" className="form-label">
                    قصتك <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="story"
                    name="story"
                    className={`form-input form-textarea ${errors.story ? 'border-red-500' : ''}`}
                    placeholder="أخبرنا عن المصادفة التي حدثت معك..."
                    value={formData.story}
                    onChange={handleChange}
                  ></textarea>
                  {errors.story && <p className="form-error">{errors.story}</p>}
                  <p className="form-hint">شارك جميع التفاصيل التي تجعل مصادفتك مميزة</p>
                </div>

                {/* Tags selection */}
                <div className="form-group">
                  <label className="form-label">الوسوم (اختياري)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className={`story-tag ${formData.tags.includes(tag) ? 'active' : ''}`}
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="form-hint">حدد الوسوم التي تصف قصتك بشكل أفضل</p>
                </div>

                {/* Author/Anonymous toggle */}
                <div className="form-group">
                  <div className="flex justify-between items-center">
                    <label htmlFor="author" className="form-label">
                      اسمك {!formData.isAnonymous && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center">
                      <span className={`ml-2 text-sm ${formData.isAnonymous ? 'text-accent font-medium' : 'text-foreground/70'}`}>
                        نشر بشكل مجهول
                      </span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={formData.isAnonymous}
                          onChange={handleAnonymousToggle}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {!formData.isAnonymous && (
                    <>
                      <input
                        type="text"
                        id="author"
                        name="author"
                        className={`form-input ${errors.author ? 'border-red-500' : ''}`}
                        placeholder="اسمك"
                        value={formData.author}
                        onChange={handleChange}
                        disabled={formData.isAnonymous}
                      />
                      {errors.author && <p className="form-error">{errors.author}</p>}
                    </>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="form-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'شارك قصتك'}
                </button>
              </form>
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
