// src/utils/accessControl.ts

export interface User {
  id: number;
  name: string;
  email: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export const getUser = (): User | null => {
  const user = localStorage.getItem("userData");
  return user ? JSON.parse(user) as User : null;
};

export const hasViewOnlyAccess = (): boolean => {
  const user = getUser();
  return user?.email?.toLowerCase() === "wb@terasoftware.com";
};
