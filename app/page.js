'use client';

import Image from "next/image";
import Link from "next/link";
import UserNav from "./components/UserNav";

export default function Home() {
  // Arabic content
  const t = {
    readStories: "اقرأ القصص",
    shareStory: "شارك قصتك",
    whatIsSodfa: "ما هي صدفة؟",
    sodfaDescription: "صدفة هي مجتمع يشارك فيه الناس قصص المصادفات والأحداث العفوية في حياتهم الحقيقية. من المفاجآت اليومية الصغيرة إلى اللقاءات العرضية التي تغير الحياة، نؤمن أن هذه اللحظات تربطنا جميعًا في شبكة غامضة من التجربة الإنسانية المشتركة.",
    featuredStories: "قصص مميزة",
    storyTitle1: "الغريب في القطار",
    storyExcerpt1: "جلست بجوار شخص غريب في قطار من باريس إلى ليون. أثناء حديثنا، اكتشفنا أننا ولدنا في نفس المستشفى، في نفس اليوم، بفارق ساعات فقط...",
    storyTitle2: "الكتاب المفقود",
    storyExcerpt2: "فقدت كتابي المفضل أثناء السفر في برشلونة. بعد ثلاث سنوات، وجدت نفس النسخة بالضبط في مكتبة صغيرة في طوكيو، مع اسمي لا يزال مكتوبًا بداخلها...",
    readMore: "← اقرأ المزيد",
    tagline: "شارك المصادفة التي غيرت يومك",
    subtitle: "قصص حقيقية. بعضها مضحك، بعضها غريب، بعضها يغير الحياة.",
    about: "عن الموقع",
    allRights: "جميع الحقوق محفوظة."
  };

  return (
    <div className="min-h-screen flex flex-col text-right" dir="rtl">
      {/* Header */}
      <header className="py-6 border-b border-warm-gray/20">
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
          <div className="flex items-center">
            <UserNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Content */}
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
              {t.tagline}
            </h1>
            <Image
              src="/spiral.svg"
              alt="رمز المصادفة"
              width={48}
              height={48}
              className="mr-4 hidden md:block"
            />
          </div>

          <p className="text-lg md:text-xl text-primary mb-10">
            {t.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/stories" className="btn btn-primary">
              {t.readStories}
            </Link>
            <Link href="/share" className="btn btn-secondary">
              {t.shareStory}
            </Link>
          </div>
        </div>

        {/* About Section */}
        <div className="max-w-2xl mx-auto mt-24 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">{t.whatIsSodfa}</h2>
          <p className="text-lg text-foreground/80 mb-12">
            {t.sodfaDescription}
          </p>
        </div>

        {/* Story Preview Section */}
        <div className="w-full max-w-4xl mx-auto mt-8">
          <h2 className="text-2xl font-semibold text-center mb-8">{t.featuredStories}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Story Card 1 */}
            <div className="story-card hover:shadow-md transition-shadow">
              <h3 className="text-xl font-medium mb-2">{t.storyTitle1}</h3>
              <p className="text-foreground/70 mb-4">
                {t.storyExcerpt1}
              </p>
              <Link href="/stories" className="text-accent font-medium hover:underline">
                {t.readMore}
              </Link>
            </div>

            {/* Story Card 2 */}
            <div className="story-card hover:shadow-md transition-shadow">
              <h3 className="text-xl font-medium mb-2">{t.storyTitle2}</h3>
              <p className="text-foreground/70 mb-4">
                {t.storyExcerpt2}
              </p>
              <Link href="/stories" className="text-accent font-medium hover:underline">
                {t.readMore}
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/stories" className="btn btn-primary">
              {t.readStories}
            </Link>
          </div>
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
            <Link href="/about" className="text-foreground/70 hover:text-accent">{t.about}</Link>
            <Link href="/stories" className="text-foreground/70 hover:text-accent">{t.readStories}</Link>
          </div>

          <div className="mt-4 md:mt-0 text-sm text-foreground/50">
            © {new Date().getFullYear()} صدفة. {t.allRights}
          </div>
        </div>
      </footer>
    </div>
  );
}
