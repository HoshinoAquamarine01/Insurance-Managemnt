import { createContext, useContext, useState, ReactNode } from "react";
import { loginRequest, type ApiUser } from "../services/api";

export type UserRole =
  | "creator"
  | "insured"
  | "accountant"
  | "supervisor"
  | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountType?: "employee" | "customer";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = window.localStorage.getItem("insurance_user");

    if (!stored) return null;

    try {
      return JSON.parse(stored) as User;
    } catch {
      window.localStorage.removeItem("insurance_user");
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    const apiUser = response as ApiUser;

    const authenticatedUser: User = {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      accountType: (apiUser as any).accountType,
    };

    setUser(authenticatedUser);
    window.localStorage.setItem(
      "insurance_user",
      JSON.stringify(authenticatedUser),
    );

    return authenticatedUser;
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;

      const nextUser = { ...prevUser, ...updates };
      window.localStorage.setItem("insurance_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("insurance_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUser,
        logout,
        isAuthenticated: !!user,
        isReady: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
