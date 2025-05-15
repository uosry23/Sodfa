'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';

export default function UserNav() {
  const { user, loading, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Arabic translations
  const t = {
    login: "تسجيل الدخول",
    account: "الحساب",
    profile: "ملفك الشخصي",
    share: "شارك قصة",
    signOut: "تسجيل الخروج"
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-24 bg-warm-gray/20 animate-pulse rounded"></div>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="text-foreground/70 hover:text-accent" dir="rtl">
        {t.login}
      </Link>
    );
  }

  return (
    <div className="relative" dir="rtl">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 text-foreground/70 hover:text-accent"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || 'مستخدم'}
            width={24}
            height={24}
            className="rounded-full ml-2"
          />
        ) : (
          <div className="w-6 h-6 bg-warm-gray rounded-full flex items-center justify-center ml-2">
            <span className="text-light-text text-xs font-bold">
              {(user.displayName || user.email || 'م').charAt(0)}
            </span>
          </div>
        )}
        <span>{user.displayName || t.account}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute left-0 mt-2 w-48 bg-background border border-warm-gray/30 rounded-md shadow-lg z-10">
          <div className="py-1 text-right">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-foreground hover:bg-warm-gray/10"
              onClick={() => setShowDropdown(false)}
            >
              {t.profile}
            </Link>
            <Link
              href="/share"
              className="block px-4 py-2 text-sm text-foreground hover:bg-warm-gray/10"
              onClick={() => setShowDropdown(false)}
            >
              {t.share}
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-right px-4 py-2 text-sm text-foreground hover:bg-warm-gray/10"
            >
              {t.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
