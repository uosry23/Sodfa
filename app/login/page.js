'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import UserNav from '../components/UserNav';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, googleSignIn, anonymousSignIn, emailSignIn, clearError } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/stories');
    }
  }, [user, authLoading, router]);

  // Set error from auth context
  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsLoading(false);
    }
  }, [authError]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    clearError();

    try {
      const success = await googleSignIn();
      if (!success) {
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setError('');
    clearError();

    try {
      const success = await anonymousSignIn();
      if (!success) {
        setIsLoading(false);

        // Error is already set in the AuthContext and will be displayed
        // via the useEffect that watches authError
      }
    } catch (err) {
      console.error('Unexpected error during anonymous login:', err);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in anonymously';

      if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later or sign in with an account.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Anonymous sign-in is not enabled. Please use another sign-in method.';
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const toggleEmailForm = () => {
    setShowEmailForm(!showEmailForm);
    setError('');
    clearError();
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');
    clearError();

    try {
      const success = await emailSignIn(email, password);
      if (!success) {
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with email');
      setIsLoading(false);
    }
  };

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
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="login-container">
            <h1 className="text-3xl font-bold mb-3">Log in to Sodfa</h1>
            <p className="login-subtitle">Share your stories and keep track of your submissions.</p>

            <button
              className="login-btn login-btn-google"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Image src="/google.svg" alt="Google" width={20} height={20} />
              <span>Continue with Google</span>
            </button>

            <button
              className="login-btn login-btn-anonymous"
              onClick={handleAnonymousLogin}
              disabled={isLoading}
            >
              <Image src="/user.svg" alt="Anonymous" width={20} height={20} />
              <span>Continue Anonymously</span>
            </button>

            {error && !showEmailForm && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 text-sm">
                <p>{error}</p>
              </div>
            )}

            {!showEmailForm ? (
              <button
                className="text-primary text-sm hover:underline mt-2"
                onClick={toggleEmailForm}
                disabled={isLoading}
              >
                Log in with email instead
              </button>
            ) : (
              <div className="mt-4 text-left">
                <div className="login-divider">Or log in with email</div>

                <form onSubmit={handleEmailLogin}>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="form-input"
                      placeholder="Your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      id="password"
                      className="form-input"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {error && <p className="form-error mb-4">{error}</p>}

                  <button
                    type="submit"
                    className="form-submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Log in'}
                  </button>

                  <button
                    type="button"
                    className="text-primary text-sm hover:underline mt-3 block mx-auto"
                    onClick={toggleEmailForm}
                    disabled={isLoading}
                  >
                    Back to other login options
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-foreground/70">
                Don't have an account?{' '}
                <Link href="/signup" className="text-accent hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-warm-gray/30">
              <Link href="/stories" className="login-guest-link">
                Browse stories without logging in
              </Link>
            </div>
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
