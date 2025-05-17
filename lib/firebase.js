import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGOtCj1JbIFGn5o_XZlV_DM7-DuP8_DIw",
  authDomain: "sodfa-539c6.firebaseapp.com",
  projectId: "sodfa-539c6",
  storageBucket: "sodfa-539c6.firebasestorage.app",
  messagingSenderId: "687052749759",
  appId: "1:687052749759:web:7cf8dfbdc4cfe5ef737f0a",
  measurementId: "G-9K12K88HF5"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const signInAsAnonymous = async () => {
  try {
    console.log("Attempting anonymous sign in");
    const result = await signInAnonymously(auth);
    console.log("Anonymous sign in successful:", result.user.uid);
    return { user: result.user, error: null };
  } catch (error) {
    console.error("Anonymous sign in failed:", error);

    // Provide more specific error messages based on Firebase error codes
    let errorMessage = error.message;

    // Handle specific Firebase Auth error codes
    if (error.code) {
      switch (error.code) {
        case 'auth/operation-not-allowed':
          errorMessage = 'Anonymous authentication is not enabled in Firebase. Please contact support.';
          break;
        case 'auth/admin-restricted-operation':
          errorMessage = 'This operation is restricted. Please sign in with a regular account.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This user account has been disabled.';
          break;
        case 'auth/web-storage-unsupported':
          errorMessage = 'Web storage is not supported or is disabled in your browser.';
          break;
        default:
          // Keep the original error message for other cases
          break;
      }
    }

    return { user: null, error: errorMessage, code: error.code };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const createAccount = async (email, password, displayName = '') => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update the user profile with display name if provided
    if (displayName) {
      await updateProfile(result.user, {
        displayName: displayName
      });
    }

    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onUserStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore functions
export const getStories = async (limitCount = 20) => {
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);

    const stories = [];
    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });

    return { stories, error: null };
  } catch (error) {
    return { stories: [], error: error.message };
  }
};

export const getStoryById = async (storyId) => {
  try {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (storySnap.exists()) {
      return { story: { id: storySnap.id, ...storySnap.data() }, error: null };
    } else {
      return { story: null, error: 'Story not found' };
    }
  } catch (error) {
    return { story: null, error: error.message };
  }
};

export const getStoriesByTag = async (tag, limitCount = 20) => {
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('tags', 'array-contains', tag),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const stories = [];
    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });

    return { stories, error: null };
  } catch (error) {
    return { stories: [], error: error.message };
  }
};

export const getStoriesByUser = async (userId, limitCount = 20) => {
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const stories = [];
    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });

    return { stories, error: null };
  } catch (error) {
    return { stories: [], error: error.message };
  }
};

export const addStory = async (storyData) => {
  try {
    let user = auth.currentUser;

    // If no user is logged in, create an anonymous user
    if (!user) {
      try {
        console.log("Creating anonymous user for story submission");
        // Use the signInAsAnonymous function which has better error handling
        const anonResult = await signInAsAnonymous();

        if (anonResult.error) {
          console.error("Failed to create anonymous user:", anonResult.error, anonResult.code);

          // Provide user-friendly error messages
          let userMessage = 'Failed to create anonymous user';

          if (anonResult.code === 'auth/network-request-failed') {
            userMessage = 'Network error. Please check your internet connection and try again.';
          } else if (anonResult.code === 'auth/too-many-requests') {
            userMessage = 'Too many requests. Please try again later or sign in with an account.';
          } else {
            userMessage = anonResult.error;
          }

          return { success: false, error: userMessage, errorCode: anonResult.code };
        }

        if (anonResult.user) {
          user = anonResult.user;
          console.log("Successfully created anonymous user for story:", user.uid);
        } else {
          console.error("No user returned from anonymous sign in");
          return { success: false, error: 'Failed to create anonymous user. Please try again or sign in with an account.' };
        }
      } catch (authError) {
        console.error("Unexpected error during anonymous auth:", authError);
        return { success: false, error: 'Authentication error. Please try again or sign in with an account.' };
      }
    }

    // Validate required fields
    if (!storyData.title || !storyData.content) {
      return { success: false, error: 'Title and content are required' };
    }

    const newStory = {
      ...storyData,
      authorId: user.uid,
      isAnonymous: storyData.isAnonymous || user.isAnonymous || false,
      author: storyData.isAnonymous ? 'زائر مجهول' : (storyData.author || user.displayName || 'زائر'),
      likes: 0,
      loves: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending' // pending, approved, rejected
    };

    const docRef = await addDoc(collection(db, 'stories'), newStory);
    return { success: true, storyId: docRef.id, error: null };
  } catch (error) {
    return { success: false, storyId: null, error: error.message };
  }
};

export const updateStory = async (storyId, storyData) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if the user is the author of the story
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return { success: false, error: 'Story not found' };
    }

    const storyAuthorId = storySnap.data().authorId;

    if (storyAuthorId !== user.uid) {
      return { success: false, error: 'You are not authorized to update this story' };
    }

    await updateDoc(storyRef, {
      ...storyData,
      updatedAt: serverTimestamp()
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const likeStory = async (storyId, reactionType = 'like', clientId = null) => {
  try {
    let user = auth.currentUser;
    let userId = null;
    let isAnonymous = false;
    let isShadowUser = false;

    // Determine the user identifier
    if (user && !user.isAnonymous) {
      // Logged in user (not anonymous) - use Firebase UID
      userId = user.uid;
      isAnonymous = false;
    } else if (clientId || user?.isAnonymous) {
      // Either has client ID or is a shadow user
      // For shadow users, we'll use the client ID instead of their Firebase UID
      userId = clientId ? `client_${clientId}` : `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      isAnonymous = true;
      isShadowUser = true;
    } else {
      // No user and no client ID - can't proceed
      return {
        success: false,
        error: 'No authentication or client identifier available',
        needsClientId: true
      };
    }

    // Check if the story exists first
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return { success: false, error: 'Story not found' };
    }

    // For shadow users, we'll use localStorage to track reactions instead of Firestore
    // This avoids the need to create Firebase Auth users
    if (isShadowUser) {
      // Just update the story's like/love count directly
      const storyData = storySnap.data();
      const updateData = {};

      // We'll always increment for shadow users since we can't reliably track their previous reactions
      // This is a simplification - in a real app you might want to use localStorage to track this
      if (reactionType === 'like') {
        updateData.likes = (storyData.likes || 0) + 1;
      } else if (reactionType === 'love') {
        updateData.loves = (storyData.loves || 0) + 1;
      }

      await updateDoc(storyRef, updateData);
      return { success: true, reacted: true, type: reactionType, error: null };
    } else {
      // Regular user flow - check for existing reactions
      const reactionRef = doc(db, 'reactions', `${userId}_${storyId}`);
      const reactionSnap = await getDoc(reactionRef);

      if (reactionSnap.exists()) {
        const currentReaction = reactionSnap.data().type;

        // If the same reaction type, remove it
        if (currentReaction === reactionType) {
          // User has already reacted with this type, so remove it
          await deleteDoc(reactionRef);

          // Decrement the reaction count
          const storyData = storySnap.data();

          const updateData = {};
          if (reactionType === 'like') {
            updateData.likes = Math.max(0, (storyData.likes || 0) - 1);
          } else if (reactionType === 'love') {
            updateData.loves = Math.max(0, (storyData.loves || 0) - 1);
          }

          await updateDoc(storyRef, updateData);

          return { success: true, reacted: false, type: null, error: null };
        } else {
          // User is changing reaction type
          // First, decrement the old reaction type
          const storyData = storySnap.data();

          const updateData = {};
          if (currentReaction === 'like') {
            updateData.likes = Math.max(0, (storyData.likes || 0) - 1);
          } else if (currentReaction === 'love') {
            updateData.loves = Math.max(0, (storyData.loves || 0) - 1);
          }

          // Then increment the new reaction type
          if (reactionType === 'like') {
            updateData.likes = (storyData.likes || 0) + 1;
          } else if (reactionType === 'love') {
            updateData.loves = (storyData.loves || 0) + 1;
          }

          // Update the reaction document
          await updateDoc(reactionRef, {
            type: reactionType,
            updatedAt: serverTimestamp()
          });

          // Update the story document
          await updateDoc(storyRef, updateData);

          return { success: true, reacted: true, type: reactionType, error: null };
        }
      } else {
        // User has not reacted to the story, so add the reaction
        await setDoc(reactionRef, {
          userId: userId,
          storyId: storyId,
          type: reactionType,
          isAnonymous: isAnonymous,
          createdAt: serverTimestamp()
        });

        // Increment the reaction count
        const storyData = storySnap.data();

        const updateData = {};
        if (reactionType === 'like') {
          updateData.likes = (storyData.likes || 0) + 1;
        } else if (reactionType === 'love') {
          updateData.loves = (storyData.loves || 0) + 1;
        }

        await updateDoc(storyRef, updateData);

        return { success: true, reacted: true, type: reactionType, error: null };
      }
    }
  } catch (error) {
    console.error('Error in likeStory:', error);
    return { success: false, reacted: null, type: null, error: error.message };
  }
};

export const checkReaction = async (storyId, clientId = null) => {
  try {
    const user = auth.currentUser;

    // For shadow users or users with client ID, we don't track individual reactions
    // So we'll always return false (not reacted)
    if (!user || user.isAnonymous || clientId) {
      return { reacted: false, type: null, error: null };
    }

    // Only check reactions for authenticated non-anonymous users
    const reactionRef = doc(db, 'reactions', `${user.uid}_${storyId}`);
    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      return {
        reacted: true,
        type: reactionSnap.data().type,
        error: null
      };
    } else {
      return { reacted: false, type: null, error: null };
    }
  } catch (error) {
    console.error('Error in checkReaction:', error);
    return { reacted: false, type: null, error: error.message };
  }
};

export const addComment = async (storyId, commentText, clientId = null) => {
  try {
    let user = auth.currentUser;
    let authorId = null;
    let authorName = 'زائر مجهول'; // Default to "Anonymous visitor"
    let isAnonymous = true;

    // Determine the user identifier
    if (user && !user.isAnonymous) {
      // Logged in user (not anonymous) - use Firebase UID
      authorId = user.uid;
      authorName = user.displayName || 'زائر';
      isAnonymous = false;
    } else if (clientId || user?.isAnonymous) {
      // Either has client ID or is a shadow user
      // For shadow users, we'll use a temporary ID but not save it
      authorId = null; // Don't save user ID for shadow users
      authorName = 'زائر مجهول'; // "Anonymous visitor"
      isAnonymous = true;
    } else {
      // No user and no client ID - can't proceed
      return {
        success: false,
        error: 'No authentication or client identifier available',
        needsClientId: true
      };
    }

    // Check if the story exists first
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return { success: false, error: 'Story not found' };
    }

    // Validate comment text
    if (!commentText || commentText.trim() === '') {
      return { success: false, error: 'Comment text is required' };
    }

    const newComment = {
      storyId,
      authorId: authorId, // Will be null for shadow users
      author: authorName,
      isAnonymous: isAnonymous,
      content: commentText,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'comments'), newComment);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in addComment:', error);
    return { success: false, error: error.message };
  }
};

export const deleteStory = async (storyId, clientId = null) => {
  try {
    let user = auth.currentUser;

    // Check if we have either a logged-in user or a client ID
    if (!user && !clientId) {
      // No user and no client ID - can't proceed
      return {
        success: false,
        error: 'No authentication or client identifier available',
        needsClientId: true
      };
    }

    // Check if the story exists
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return { success: false, error: 'Story not found' };
    }

    const storyData = storySnap.data();

    // Check if the user is the author of the story
    // For shadow users, we'll use the clientId to verify ownership
    if (user && !user.isAnonymous) {
      // Regular user - check authorId
      if (storyData.authorId !== user.uid) {
        return { success: false, error: 'You are not authorized to delete this story' };
      }
    } else if (clientId && storyData.isAnonymous) {
      // Shadow user with client ID - we'll allow deletion if the story is anonymous
      // This is a simplified approach - in a real app, you might want to store the clientId with the story
      // But for now, we'll just allow any shadow user to delete anonymous stories
      console.log('Shadow user attempting to delete anonymous story');
    } else {
      return { success: false, error: 'You are not authorized to delete this story' };
    }

    // Delete all comments for this story
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('storyId', '==', storyId));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.forEach((commentDoc) => {
        batch.delete(doc(db, 'comments', commentDoc.id));
      });

      // Delete all reactions for this story
      const reactionsRef = collection(db, 'reactions');
      const reactionsQuery = query(reactionsRef, where('storyId', '==', storyId));
      const reactionsSnapshot = await getDocs(reactionsQuery);

      reactionsSnapshot.forEach((reactionDoc) => {
        batch.delete(doc(db, 'reactions', reactionDoc.id));
      });

      // Commit the batch
      await batch.commit();
      console.log(`Deleted ${querySnapshot.size} comments and ${reactionsSnapshot.size} reactions for story ${storyId}`);
    } catch (error) {
      console.error('Error deleting comments and reactions:', error);
      // Continue with story deletion even if comment deletion fails
    }

    // Delete the story
    await deleteDoc(storyRef);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in deleteStory:', error);

    // Handle the admin-restricted-operation error
    if (error.code === 'auth/admin-restricted-operation') {
      return {
        success: false,
        error: 'This operation is restricted. Please try again with a client ID.',
        errorCode: error.code,
        needsClientId: true
      };
    }

    return { success: false, error: error.message };
  }
};

export const getCommentsByStoryId = async (storyId, limitCount = 100) => {
  try {
    const commentsRef = collection(db, 'comments');

    // Try the ordered query first (requires index)
    try {
      const q = query(
        commentsRef,
        where('storyId', '==', storyId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      const comments = [];
      querySnapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() });
      });

      console.log(`Fetched ${comments.length} comments for story ${storyId}`);
      return { comments, error: null };
    } catch (indexError) {
      // If we get an index error, fall back to an unordered query
      if (indexError.message && indexError.message.includes('requires an index')) {
        console.warn('Index not yet available, falling back to unordered query');
        console.warn('Please create the index using the link in the error message');
        console.warn(indexError.message);

        // Fallback query without ordering
        const fallbackQuery = query(
          commentsRef,
          where('storyId', '==', storyId),
          limit(limitCount)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);

        // Manually sort the results in memory
        const unsortedComments = [];
        fallbackSnapshot.forEach((doc) => {
          unsortedComments.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt in descending order (newest first)
        const sortedComments = unsortedComments.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        console.log(`Fetched ${sortedComments.length} comments for story ${storyId} (unordered query)`);
        return {
          comments: sortedComments,
          error: null,
          indexWarning: 'Comments may not be in perfect order. Please create the required index.'
        };
      } else {
        // If it's not an index error, rethrow it
        throw indexError;
      }
    }
  } catch (error) {
    console.error('Error fetching comments:', error);

    // Provide a more helpful error message for index errors
    if (error.message && error.message.includes('requires an index')) {
      const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
      return {
        comments: [],
        error: 'This query requires a Firestore index. Please create it in the Firebase console.',
        indexUrl: indexUrl ? indexUrl[0] : null
      };
    }

    return { comments: [], error: error.message };
  }
};

export { auth, db };
