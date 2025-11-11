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
const SmartInvViewEmail = "survey@terasoftware.com";
const SmartInvView = ["survey@terasoftware.com", "admin@terasoftware.com"];
const DOWNLOAD_ONLY_EMAILS = ["nexus@terasoftware.com", "admin@terasoftware.com"];

// Restricted user who cannot access file operations (Upload KMZ/KML, Download, External Files)
const RESTRICTED_FILE_OPS_EMAIL = "survey@terasoftware.com";

// IE user with limited sidebar access (Survey, GIS Inventory, Route Planning only)
const IE_USER_EMAIL = "ie@terasoftware.com";

// Users with installation page access
const INSTALLATION_ACCESS_EMAILS = ["survey@terasoftware.com"];

export const getUser = (): User | null => {
  const user = localStorage.getItem("userData");
  return user ? JSON.parse(user) as User : null;
};

export const hasViewOnlyAccess = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return email === VIEW_ONLY_EMAILS || email === DOWNLOAD_EMAILS || email === SmartInvViewEmail;
};

export const hasDownloadAccess = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return DOWNLOAD_ONLY_EMAILS.includes(email ?? "");
};

export const hasInvOnlyAccess = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return SmartInvView.includes(email ?? "");
};

/**
 * Check if user is restricted from file operations
 * Returns true if user should NOT see Upload KMZ/KML, Download, and External Files buttons
 */
export const isRestrictedFromFileOperations = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return email === RESTRICTED_FILE_OPS_EMAIL.toLowerCase();
};

/**
 * Check if user can access file operations (Upload/Download/External Files)
 * Returns true if user CAN see the file operation buttons
 */
export const canAccessFileOperations = (): boolean => {
  return !isRestrictedFromFileOperations();
};

/**
 * Check if user is IE user with limited sidebar access
 * Returns true if user can only see Survey, GIS Inventory, and Route Planning
 */
export const isIEUser = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return email === IE_USER_EMAIL.toLowerCase();
};

/**
 * Check if user has installation page access
 * Returns true if user can access the installation section
 */
export const hasInstallationAccess = (): boolean => {
  const user = getUser();
  const email = user?.email?.toLowerCase();
  return INSTALLATION_ACCESS_EMAILS.includes(email ?? "");
};

/**
 * Check if user can access HOTO Survey
 * Returns false for IE users
 */
export const canAccessHotoSurvey = (): boolean => {
  return !isIEUser();
};