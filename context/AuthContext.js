'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  signInAsAnonymous,
  signInWithEmail,
  createAccount,
  logOut,
  onUserStateChange
} from '../lib/firebase';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onUserStateChange((authUser) => {
      if (authUser) {
        setUser({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          isAnonymous: authUser.isAnonymous,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const googleSignIn = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      return false;
    }
    return true;
  };

  // Sign in anonymously
  const anonymousSignIn = async () => {
    setError(null);
    try {
      const result = await signInAsAnonymous();
      if (result.error) {
        // Set user-friendly error message
        setError(result.error);
        return false;
      }
      return true;
    } catch (err) {
      // Handle unexpected errors
      console.error("Unexpected error during anonymous sign in:", err);
      setError("An unexpected error occurred. Please try again later.");
      return false;
    }
  };

  // Sign in with email and password
  const emailSignIn = async (email, password) => {
    setError(null);
    const result = await signInWithEmail(email, password);
    if (result.error) {
      setError(result.error);
      return false;
    }
    return true;
  };

  // Create a new account with email and password
  const emailSignUp = async (email, password, displayName = '') => {
    setError(null);
    const result = await createAccount(email, password, displayName);
    if (result.error) {
      setError(result.error);
      return false;
    }
    return true;
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    const result = await logOut();
    if (result.error) {
      setError(result.error);
      return false;
    }
    return true;
  };

  // Clear any auth errors
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    googleSignIn,
    anonymousSignIn,
    emailSignIn,
    emailSignUp,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
