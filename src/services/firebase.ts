import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  enableIndexedDbPersistence,
  Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import type { Workflow, Folder, CustomCategory, AppSettings } from '../types';

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
  measurementId?: string;
}

// Default Firebase configuration for Flowna Config
const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyA3-66jq9BQG1Vf0M8nrmBUl6q8255KuWo",
  authDomain: "flowna-config.firebaseapp.com",
  databaseURL: "https://flowna-config-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "flowna-config",
  storageBucket: "flowna-config.firebasestorage.app",
  messagingSenderId: "1051913712097",
  appId: "1:1051913712097:web:e2036ca1b71c588cc022a0",
  measurementId: "G-GWHNKHQ6JQ"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let currentUser: User | null = null;

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  const config = getStoredFirebaseConfig();
  return !!(config && config.apiKey && config.projectId);
}

// Get stored Firebase config from localStorage
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  const stored = localStorage.getItem('flowna_firebase_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

// Save Firebase config to localStorage (encrypted in production)
export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem('flowna_firebase_config', JSON.stringify(config));
}

// Initialize Firebase with provided config
export async function initializeFirebase(config: FirebaseConfig): Promise<boolean> {
  try {
    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);

    // Enable offline persistence
    try {
      await enableIndexedDbPersistence(db);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence enabled in first tab only');
      } else if (error.code === 'unimplemented') {
        console.warn('Browser does not support persistence');
      }
    }

    saveFirebaseConfig(config);
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

// Auto-initialize from stored config or use default
export async function autoInitializeFirebase(): Promise<boolean> {
  const config = getStoredFirebaseConfig() || DEFAULT_FIREBASE_CONFIG;
  return initializeFirebase(config);
}

// Get the default Firebase config
export function getDefaultFirebaseConfig(): FirebaseConfig {
  return DEFAULT_FIREBASE_CONFIG;
}

// Authentication functions
export async function signInAnonymouslyToFirebase(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await signInAnonymously(auth);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    console.error('Anonymous sign in error:', error);
    return null;
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) return null;
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    console.error('Google sign in error:', error);
    return null;
  }
}

export async function signOutFromFirebase(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
    currentUser = null;
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function isAuthenticated(): boolean {
  return !!currentUser;
}

// Firestore operations - Workflows
export async function saveWorkflowToFirestore(workflow: Workflow): Promise<boolean> {
  if (!db || !currentUser) return false;
  try {
    const workflowRef = doc(db, 'users', currentUser.uid, 'workflows', workflow.id);
    await setDoc(workflowRef, {
      ...workflow,
      updatedAt: serverTimestamp(),
      createdAt: workflow.createdAt || serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error saving workflow:', error);
    return false;
  }
}

export async function getWorkflowsFromFirestore(): Promise<Workflow[]> {
  if (!db || !currentUser) return [];
  try {
    const workflowsRef = collection(db, 'users', currentUser.uid, 'workflows');
    const q = query(workflowsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        lastOpenedAt: data.lastOpenedAt instanceof Timestamp ? data.lastOpenedAt.toMillis() : data.lastOpenedAt,
      } as Workflow;
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    return [];
  }
}

export async function deleteWorkflowFromFirestore(workflowId: string): Promise<boolean> {
  if (!db || !currentUser) return false;
  try {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'workflows', workflowId));
    return true;
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return false;
  }
}

// Firestore operations - Folders
export async function saveFoldersToFirestore(folders: Folder[]): Promise<boolean> {
  if (!db || !currentUser) return false;
  try {
    for (const folder of folders) {
      const folderRef = doc(db, 'users', currentUser.uid, 'folders', folder.id);
      await setDoc(folderRef, {
        ...folder,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving folders:', error);
    return false;
  }
}

export async function getFoldersFromFirestore(): Promise<Folder[]> {
  if (!db || !currentUser) return [];
  try {
    const foldersRef = collection(db, 'users', currentUser.uid, 'folders');
    const q = query(foldersRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
      } as Folder;
    });
  } catch (error) {
    console.error('Error getting folders:', error);
    return [];
  }
}

// Firestore operations - Custom Categories
export async function saveCategoriesToFirestore(categories: CustomCategory[]): Promise<boolean> {
  if (!db || !currentUser) return false;
  try {
    for (const category of categories) {
      const categoryRef = doc(db, 'users', currentUser.uid, 'categories', category.id);
      await setDoc(categoryRef, category);
    }
    return true;
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }
}

export async function getCategoriesFromFirestore(): Promise<CustomCategory[]> {
  if (!db || !currentUser) return [];
  try {
    const categoriesRef = collection(db, 'users', currentUser.uid, 'categories');
    const snapshot = await getDocs(categoriesRef);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as CustomCategory));
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

// Firestore operations - Settings
export async function saveSettingsToFirestore(settings: AppSettings): Promise<boolean> {
  if (!db || !currentUser) return false;
  try {
    const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'main');
    await setDoc(settingsRef, settings);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

export async function getSettingsFromFirestore(): Promise<AppSettings | null> {
  if (!db || !currentUser) return null;
  try {
    const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'main');
    const snapshot = await getDoc(settingsRef);
    if (snapshot.exists()) {
      return snapshot.data() as AppSettings;
    }
    return null;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}

// Test Firebase connection
export async function testFirebaseConnection(): Promise<{ success: boolean; message: string; userId?: string }> {
  if (!db || !auth) {
    return { success: false, message: 'Firebase not initialized' };
  }
  try {
    // Try to authenticate
    const user = await signInAnonymouslyToFirebase();
    if (!user) {
      return { success: false, message: 'Authentication failed' };
    }
    // Try to write a test document
    const testRef = doc(db, 'users', user.uid, 'test', 'connection');
    await setDoc(testRef, { timestamp: serverTimestamp() });
    await deleteDoc(testRef);
    return { success: true, message: 'Connection successful', userId: user.uid };
  } catch (error) {
    console.error('Connection test error:', error);
    return { success: false, message: `Connection failed: ${error}` };
  }
}

// Get Firebase connection status
export function getFirebaseStatus(): 'connected' | 'disconnected' | 'error' {
  if (!app || !db || !auth) return 'disconnected';
  if (!currentUser) return 'disconnected';
  return 'connected';
}

// Sync all data to Firestore
export async function syncAllDataToFirestore(data: {
  workflows: Workflow[];
  folders: Folder[];
  categories: CustomCategory[];
  settings: AppSettings;
}): Promise<boolean> {
  if (!isAuthenticated()) return false;
  try {
    await Promise.all([
      ...data.workflows.map(w => saveWorkflowToFirestore(w)),
      saveFoldersToFirestore(data.folders),
      saveCategoriesToFirestore(data.categories),
      saveSettingsToFirestore(data.settings),
    ]);
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    return false;
  }
}

// Load all data from Firestore
export async function loadAllDataFromFirestore(): Promise<{
  workflows: Workflow[];
  folders: Folder[];
  categories: CustomCategory[];
  settings: AppSettings | null;
} | null> {
  if (!isAuthenticated()) return null;
  try {
    const [workflows, folders, categories, settings] = await Promise.all([
      getWorkflowsFromFirestore(),
      getFoldersFromFirestore(),
      getCategoriesFromFirestore(),
      getSettingsFromFirestore(),
    ]);
    return { workflows, folders, categories, settings };
  } catch (error) {
    console.error('Load error:', error);
    return null;
  }
}
