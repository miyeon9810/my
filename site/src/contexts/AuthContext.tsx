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
import { auth, googleProvider } from "@/lib/firebase";
import { ensureUserDoc, subscribeUserProfile } from "@/lib/user-service";
import type { UserProfile } from "@/types/game";

type AuthContextValue = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) await ensureUserDoc(nextUser);
      setLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeUserProfile(user.uid, setProfile);
  }, [user]);

  const value: AuthContextValue = {
    user,
    profile: user ? profile : null,
    loading,
    signInWithGoogle: async () => {
      await signInWithPopup(auth, googleProvider);
    },
    signOut: async () => {
      await firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
