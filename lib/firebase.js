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
  serverTimestamp
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
    return { user: null, error: error.message };
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
        const anonResult = await signInAnonymously(auth);
        if (anonResult.user) {
          user = anonResult.user;
          console.log("Created anonymous user:", user.uid);
        } else {
          console.error("Failed to create anonymous user - no user returned");
          return { success: false, error: 'Failed to create anonymous user' };
        }
      } catch (authError) {
        console.error("Anonymous auth error:", authError);
        return { success: false, error: 'Authentication error: ' + authError.message };
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

export const likeStory = async (storyId, reactionType = 'like') => {
  try {
    let user = auth.currentUser;

    // If no user is logged in, create an anonymous user
    if (!user) {
      try {
        const anonResult = await signInAnonymously(auth);
        if (anonResult.user) {
          user = anonResult.user;
          console.log("Created anonymous user:", user.uid);
        } else {
          console.error("Failed to create anonymous user - no user returned");
          return { success: false, error: 'Failed to create anonymous user' };
        }
      } catch (authError) {
        console.error("Anonymous auth error:", authError);
        return { success: false, error: 'Authentication error: ' + authError.message };
      }
    }

    // Check if the story exists first
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return { success: false, error: 'Story not found' };
    }

    // Check if the user has already reacted to the story
    const reactionRef = doc(db, 'reactions', `${user.uid}_${storyId}`);
    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists()) {
      const currentReaction = reactionSnap.data().type;

      // If the same reaction type, remove it
      if (currentReaction === reactionType) {
        // User has already reacted with this type, so remove it
        await deleteDoc(reactionRef);

        // Decrement the reaction count
        const storyRef = doc(db, 'stories', storyId);
        const storyData = (await getDoc(storyRef)).data();

        const updateData = {};
        if (reactionType === 'like') {
          updateData.likes = (storyData.likes || 0) - 1;
        } else if (reactionType === 'love') {
          updateData.loves = (storyData.loves || 0) - 1;
        }

        await updateDoc(storyRef, updateData);

        return { success: true, reacted: false, type: null, error: null };
      } else {
        // User is changing reaction type
        // First, decrement the old reaction type
        const storyRef = doc(db, 'stories', storyId);
        const storyData = (await getDoc(storyRef)).data();

        const updateData = {};
        if (currentReaction === 'like') {
          updateData.likes = (storyData.likes || 0) - 1;
        } else if (currentReaction === 'love') {
          updateData.loves = (storyData.loves || 0) - 1;
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
        userId: user.uid,
        storyId: storyId,
        type: reactionType,
        createdAt: serverTimestamp()
      });

      // Increment the reaction count
      const storyRef = doc(db, 'stories', storyId);
      const storyData = (await getDoc(storyRef)).data();

      const updateData = {};
      if (reactionType === 'like') {
        updateData.likes = (storyData.likes || 0) + 1;
      } else if (reactionType === 'love') {
        updateData.loves = (storyData.loves || 0) + 1;
      }

      await updateDoc(storyRef, updateData);

      return { success: true, reacted: true, type: reactionType, error: null };
    }
  } catch (error) {
    return { success: false, reacted: null, type: null, error: error.message };
  }
};

export const checkReaction = async (storyId) => {
  try {
    const user = auth.currentUser;

    // If no user is logged in, just return false (no need to create anonymous user yet)
    if (!user) {
      return { reacted: false, type: null, error: null };
    }

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
    return { reacted: false, type: null, error: error.message };
  }
};

export const addComment = async (storyId, commentText) => {
  try {
    let user = auth.currentUser;

    // If no user is logged in, create an anonymous user
    if (!user) {
      try {
        console.log("Creating anonymous user for comment");
        const anonResult = await signInAnonymously(auth);
        if (anonResult.user) {
          user = anonResult.user;
          console.log("Created anonymous user:", user.uid);
        } else {
          console.error("Failed to create anonymous user - no user returned");
          return { success: false, error: 'Failed to create anonymous user' };
        }
      } catch (authError) {
        console.error("Anonymous auth error:", authError);
        return { success: false, error: 'Authentication error: ' + authError.message };
      }
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
      authorId: user.uid,
      author: user.isAnonymous ? 'زائر مجهول' : (user.displayName || 'زائر'),
      isAnonymous: user.isAnonymous,
      content: commentText,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'comments'), newComment);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCommentsByStoryId = async (storyId) => {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('storyId', '==', storyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const comments = [];
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });

    return { comments, error: null };
  } catch (error) {
    return { comments: [], error: error.message };
  }
};

export { auth, db };
