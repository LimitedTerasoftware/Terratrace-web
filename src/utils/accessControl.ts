// src/utils/accessControl.ts

export interface User {
  id: number;
  name: string;
  email: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

const VIEW_ONLY_EMAILS = "wb@terasoftware.com";
const DOWNLOAD_EMAILS = "nexus@terasoftware.com";

const DOWNLOAD_ONLY_EMAILS = ["nexus@terasoftware.com", "admin@terasoftware.com"];

export const getUser = (): User | null => {
  const user = localStorage.getItem("userData");
  return user ? JSON.parse(user) as User : null;
};

export const hasViewOnlyAccess = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return email === VIEW_ONLY_EMAILS || email === DOWNLOAD_EMAILS;
};

export const hasDownloadAccess = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return DOWNLOAD_ONLY_EMAILS.includes(email ?? "");
};




