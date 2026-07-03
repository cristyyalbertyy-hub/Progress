import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithCustomToken,
  type User,
} from 'firebase/auth';
import {
  ACCOUNT_URL,
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from '../lib/firebase';
import { loadActiveEntitlements } from '../lib/progress-client';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  configured: boolean;
  entitledPackageIds: string[];
  accountUrl: string;
  refreshEntitlements: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function trySessionHandoff(auth: ReturnType<typeof getFirebaseAuth>) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('studio9_handoff');
  if (!token) return;
  await signInWithCustomToken(auth, token);
  params.delete('studio9_handoff');
  const rest = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!configured);
  const [entitledPackageIds, setEntitledPackageIds] = useState<string[]>([]);

  const refreshEntitlements = useCallback(async () => {
    if (!configured || !user) {
      setEntitledPackageIds([]);
      return;
    }
    const ids = await loadActiveEntitlements(getFirebaseDb(), user.uid);
    setEntitledPackageIds(ids);
  }, [configured, user]);

  useEffect(() => {
    if (!configured) return;

    const auth = getFirebaseAuth();
    let active = true;

    (async () => {
      try {
        await trySessionHandoff(auth);
      } catch (err) {
        console.warn('Session handoff failed:', err);
      }

      onAuthStateChanged(auth, (nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setReady(true);
      });
    })();

    return () => {
      active = false;
    };
  }, [configured]);

  useEffect(() => {
    void refreshEntitlements();
  }, [refreshEntitlements]);

  const value = useMemo(
    () => ({
      user,
      ready,
      configured,
      entitledPackageIds,
      accountUrl: ACCOUNT_URL,
      refreshEntitlements,
    }),
    [user, ready, configured, entitledPackageIds, refreshEntitlements],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function initialPackageFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('package');
}
