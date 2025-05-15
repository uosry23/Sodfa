'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import UserNav from '../components/UserNav';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, emailSignUp, googleSignIn, clearError } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/stories');
    }
  }, [user, authLoading, router]);

  // Set error from auth context
  useEffect(() => {
    if (authError) {
      setGeneralError(authError);
      setIsSubmitting(false);
    }
  }, [authError]);

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

    // Clear general error
    if (generalError) {
      setGeneralError('');
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Please enter your name';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter a password';
    } else if (formData.password.length < 6) {
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      setGeneralError('');
      clearError();

      try {
        // Create account with email and password
        const success = await emailSignUp(formData.email, formData.password, formData.displayName);

        if (!success) {
          setIsSubmitting(false);
        }
      } catch (err) {
        setGeneralError(err.message || 'Failed to create account');
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setGeneralError('');
    clearError();

    try {
      const success = await googleSignIn();
      if (!success) {
        setIsSubmitting(false);
      }
    } catch (err) {
      setGeneralError(err.message || 'Failed to sign up with Google');
      setIsSubmitting(false);
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
          <nav className="flex items-center">
            <Link href="/stories" className="text-foreground/70 hover:text-accent mr-6">
              Read Stories
            </Link>
            <UserNav />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="login-container">
            <h1 className="text-3xl font-bold mb-3">Create an Account</h1>
            <p className="login-subtitle">Join Sodfa to share your coincidence stories</p>

            <button
              className="login-btn login-btn-google"
              onClick={handleGoogleSignup}
              disabled={isSubmitting}
            >
              <Image src="/google.svg" alt="Google" width={20} height={20} />
              <span>Sign up with Google</span>
            </button>

            <div className="login-divider">Or sign up with email</div>

            {generalError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{generalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">Name</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  className={`form-input ${errors.displayName ? 'border-red-500' : ''}`}
                  placeholder="Your name"
                  value={formData.displayName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.displayName && <p className="form-error">{errors.displayName}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.password && <p className="form-error">{errors.password}</p>}
                <p className="form-hint">Must be at least 6 characters</p>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                className="form-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-foreground/70">
                Already have an account?{' '}
                <Link href="/login" className="text-accent hover:underline">
                  Log in
                </Link>
              </p>
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
