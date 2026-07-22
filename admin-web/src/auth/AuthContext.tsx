import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
  } from "react";
  import { api } from "../api/client";
  
  type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  
  type LoginResponse = {
    accessToken: string;
    user: AdminUser;
  };
  
  type AuthContextValue = {
    user: AdminUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
  };
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  const TOKEN_KEY = "admin_access_token";
  const USER_KEY = "admin_user";
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() =>
      localStorage.getItem(TOKEN_KEY)
    );
  
    const [user, setUser] = useState<AdminUser | null>(() => {
      const storedUser = localStorage.getItem(USER_KEY);
  
      if (!storedUser) return null;
  
      try {
        return JSON.parse(storedUser) as AdminUser;
      } catch {
        localStorage.removeItem(USER_KEY);
        return null;
      }
    });
  
    useEffect(() => {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }, [token]);
  
    useEffect(() => {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }, [user]);
  
    async function login(email: string, password: string) {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
  
      const { accessToken, user } = response.data;
  
      setToken(accessToken);
      setUser(user);
    }
  
    function logout() {
      setToken(null);
      setUser(null);
    }
  
    const value = useMemo<AuthContextValue>(
      () => ({
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === "ADMIN",
        login,
        logout,
      }),
      [token, user]
    );
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  export function useAuth() {
    const context = useContext(AuthContext);
  
    if (!context) {
      throw new Error("useAuth must be used inside AuthProvider");
    }
  
    return context;
  }