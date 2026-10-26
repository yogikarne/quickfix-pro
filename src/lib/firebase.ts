import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer, 
  setDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
}

// Test Firebase connection on boot
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, 'system', 'connection_test');
    await getDocFromServer(testDoc);
    console.log("Firebase connection established successfully.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firebase client is currently offline or connecting...");
    }
    return false;
  }
}

// Auth Helpers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign In Error:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Email Sign In Error:", error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (error) {
    console.error("Email Registration Error:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

// Firestore Database Real-World Operations with Error Handling

/**
 * Save / sync booking order to Firestore
 */
export async function syncBookingToFirestore(booking: any) {
  try {
    const bookingDocRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingDocRef, {
      id: booking.id,
      userId: auth.currentUser?.uid || 'guest_user',
      providerId: booking.provider?.id || 'unknown_provider',
      serviceType: booking.serviceType,
      status: booking.status,
      otpCode: booking.otpCode,
      createdAt: booking.createdAt,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod || null,
      costBreakdown: booking.costBreakdown,
      userLocation: booking.userLocation,
      vehicle: booking.vehicle,
      rating: booking.rating || null,
      reviewText: booking.reviewText || null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `bookings/${booking.id}`);
    return false;
  }
}

/**
 * Update booking status and optional metadata
 */
export async function updateFirestoreBookingStatus(bookingId: string, status: string, metadata?: Record<string, any>) {
  try {
    const bookingDocRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingDocRef, {
      status,
      updatedAt: new Date().toISOString(),
      ...(metadata || {})
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    return false;
  }
}

/**
 * Broadcast emergency SOS to Firestore
 */
export async function broadcastSosAlertToFirestore(alert: {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  location: { lat: number; lng: number; address: string };
  status: 'active' | 'resolved';
}) {
  try {
    const sosRef = doc(db, 'sos_alerts', alert.id);
    await setDoc(sosRef, {
      id: alert.id,
      userId: auth.currentUser?.uid || alert.userId || 'emergency_broadcast',
      userName: alert.userName,
      userPhone: alert.userPhone,
      address: alert.location.address,
      lat: alert.location.lat,
      lng: alert.location.lng,
      status: alert.status,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `sos_alerts/${alert.id}`);
    return false;
  }
}

/**
 * Save user profile to Firestore
 */
export async function saveUserProfileToFirestore(userProfile: any) {
  try {
    const userRef = doc(db, 'users', userProfile.id);
    await setDoc(userRef, {
      id: userProfile.id,
      name: userProfile.name,
      phone: userProfile.phone,
      email: userProfile.email,
      avatar: userProfile.avatar,
      emergencyContacts: userProfile.emergencyContacts || [],
      vehicles: userProfile.vehicles || [],
      savedLocations: userProfile.savedLocations || [],
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userProfile.id}`);
    return false;
  }
}

/**
 * Fetch user profile from Firestore
 */
export async function fetchUserProfileFromFirestore(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

