import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { ensureUserDoc, subscribeUserProfile } from "@/lib/user-service";
import { getOrCreateGuestId, guestSubscribeProfile, hasGuestId, peekGuestId } from "@/lib/guest-store";
import type { UserProfile } from "@/types/game";

// A stand-in for FirebaseUser so components can read `.uid`/`.displayName`/
// `.photoURL` the same way for a real account and for local guest mode.
export type EffectiveUser = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
};

type AuthContextValue = {
  user: FirebaseUser | null;
  isGuest: boolean;
  effectiveUser: EffectiveUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  enterGuestMode: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Seeded synchronously from localStorage: with no Firebase project
  // configured, guest mode works fully offline and there's nothing to wait
  // on, so start "resumed" immediately instead of flashing a loading state.
  const [isGuest, setIsGuest] = useState(() => !isFirebaseConfigured && hasGuestId());
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await ensureUserDoc(nextUser);
        setIsGuest(false);
      } else if (hasGuestId()) {
        // Returning guest on this device — resume without asking again.
        setIsGuest(true);
      }
      setLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (user) return subscribeUserProfile(user.uid, setProfile);
    if (isGuest) return guestSubscribeProfile(setProfile);
  }, [user, isGuest]);

  const effectiveUser: EffectiveUser | null = user
    ? { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL }
    : isGuest
      ? { uid: peekGuestId() ?? getOrCreateGuestId(), displayName: profile?.name ?? "게스트 모험가", photoURL: null }
      : null;

  const value: AuthContextValue = {
    user,
    isGuest,
    effectiveUser,
    profile: user || isGuest ? profile : null,
    loading,
    signInWithGoogle: async () => {
      if (!isFirebaseConfigured) {
        throw new Error("Firebase가 아직 설정되지 않았어. 지금은 게스트 모드만 이용할 수 있어.");
      }
      await signInWithPopup(auth, googleProvider);
    },
    enterGuestMode: () => {
      getOrCreateGuestId();
      setIsGuest(true);
    },
    signOut: async () => {
      if (user) await firebaseSignOut(auth);
      setIsGuest(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
