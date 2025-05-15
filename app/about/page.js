'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import UserNav from '../components/UserNav';

export default function AboutPage() {
  const [language, setLanguage] = useState('en');
  
  const content = {
    en: {
      title: "About Sodfa",
      subtitle: "A Platform for Sharing Coincidence Stories",
      description: [
        "Sodfa (which means 'coincidence' in Arabic) is a platform where people can share their real-life coincidence stories.",
        "We believe that coincidences are meaningful events that connect us in mysterious ways. Whether it's meeting someone from your hometown in a foreign country, thinking of a friend moments before they call, or finding an important object just when you need it most - these moments feel special and worth sharing.",
        "Our mission is to create a space where these stories can be collected, shared, and appreciated. By sharing our coincidence stories, we create a tapestry of interconnected experiences that remind us of the wonder and mystery in everyday life."
      ],
      features: {
        title: "Features",
        items: [
          {
            title: "Share Your Story",
            description: "Submit your own coincidence stories to share with the community."
          },
          {
            title: "Read Others' Experiences",
            description: "Browse through a collection of fascinating coincidence stories from around the world."
          },
          {
            title: "Connect Through Coincidences",
            description: "Comment on stories and connect with others who have had similar experiences."
          }
        ]
      },
      team: {
        title: "Our Team",
        description: "Sodfa was created by a small team of developers who are fascinated by coincidences and the connections they create between people."
      },
      contact: {
        title: "Contact Us",
        description: "Have questions or suggestions? We'd love to hear from you!",
        email: "contact@sodfa.com"
      }
    },
    ar: {
      title: "عن صدفة",
      subtitle: "منصة لمشاركة قصص المصادفات",
      description: [
        "صدفة هي منصة يمكن للناس من خلالها مشاركة قصص المصادفات الحقيقية في حياتهم.",
        "نحن نؤمن بأن المصادفات هي أحداث ذات معنى تربطنا بطرق غامضة. سواء كان الأمر يتعلق بمقابلة شخص من مدينتك في بلد أجنبي، أو التفكير في صديق قبل لحظات من اتصاله، أو العثور على شيء مهم عندما تحتاجه - هذه اللحظات تشعر بأنها خاصة وتستحق المشاركة.",
        "مهمتنا هي إنشاء مساحة يمكن فيها جمع هذه القصص ومشاركتها وتقديرها. من خلال مشاركة قصص المصادفات، نخلق نسيجًا من التجارب المترابطة التي تذكرنا بالعجب والغموض في الحياة اليومية."
      ],
      features: {
        title: "المميزات",
        items: [
          {
            title: "شارك قصتك",
            description: "قدم قصص المصادفات الخاصة بك لمشاركتها مع المجتمع."
          },
          {
            title: "اقرأ تجارب الآخرين",
            description: "تصفح مجموعة من قصص المصادفات الرائعة من جميع أنحاء العالم."
          },
          {
            title: "تواصل من خلال المصادفات",
            description: "علق على القصص وتواصل مع الآخرين الذين مروا بتجارب مماثلة."
          }
        ]
      },
      team: {
        title: "فريقنا",
        description: "تم إنشاء صدفة بواسطة فريق صغير من المطورين المفتونين بالمصادفات والروابط التي تخلقها بين الناس."
      },
      contact: {
        title: "اتصل بنا",
        description: "هل لديك أسئلة أو اقتراحات؟ نود أن نسمع منك!",
        email: "contact@sodfa.com"
      }
    }
  };
  
  const currentContent = content[language];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 border-b border-warm-gray/30">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/spiral.svg"
              alt="Sodfa logo"
              width={28}
              height={28}
              className="mr-2"
            />
            <span className="text-primary font-medium text-xl">Sodfa</span>
          </Link>
          <div className="flex items-center">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="text-foreground/70 hover:text-accent mr-6"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`flex-grow py-12 px-4 ${language === 'ar' ? 'text-right' : ''}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{currentContent.title}</h1>
          <p className="text-xl text-foreground/70 mb-8">{currentContent.subtitle}</p>
          
          <div className="mb-12">
            {currentContent.description.map((paragraph, index) => (
              <p key={index} className="mb-4 text-foreground/80 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{currentContent.features.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentContent.features.items.map((feature, index) => (
                <div key={index} className="bg-cream p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-foreground/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">{currentContent.team.title}</h2>
            <p className="text-foreground/80">{currentContent.team.description}</p>
          </div>
          
          <div className="bg-cream p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">{currentContent.contact.title}</h2>
            <p className="text-foreground/80 mb-4">{currentContent.contact.description}</p>
            <a href={`mailto:${currentContent.contact.email}`} className="text-accent hover:underline">
              {currentContent.contact.email}
            </a>
          </div>
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
              className="mr-2"
            />
            <span className="text-primary font-medium">Sodfa</span>
          </div>
          
          <div className="flex gap-6">
            <Link href="/about" className="text-accent font-medium hover:underline">About</Link>
            <Link href="/stories" className="text-foreground/70 hover:text-accent">Stories</Link>
            <Link href="/share" className="text-foreground/70 hover:text-accent">Share</Link>
          </div>
          
          <div className="mt-4 md:mt-0 text-sm text-foreground/50">
            © {new Date().getFullYear()} Sodfa. {language === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
          </div>
        </div>
      </footer>
    </div>
  );
}
