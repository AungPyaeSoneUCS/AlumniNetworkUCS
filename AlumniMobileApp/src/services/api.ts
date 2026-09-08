// file: src/services/api.ts
import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const BASE_URL = "https://alumni.ucsh.edu.mm/api";

export interface UserSession {
  _id: string;
  token?: string;
  [key: string]: any;
}

export interface UserExperienceItem {
  _id?: string;
  company: string;
  position: string;
  employmentType?: string;
  location?: string;
  phone?: string;
  email?: string;
  salary?: string;
  website?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  experienceYear?: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  experiences?: UserExperienceItem[];
  createdAt?: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  location?: string;
  jobType?: string;
  salary?: string;
  description: string;
  requirements?: string;
  contactEmail?: string;
  applicationUrl?: string;
  companyLogo?: string;
  image?: string;
  author?: {
    _id: string;
    name: string;
    image?: string;
  };
  views?: number;
  createdAt?: string;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "x-device-platform": Platform.OS,
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const sessionData = await SecureStore.getItemAsync("user_session");

      if (sessionData) {
        const user: UserSession = JSON.parse(sessionData);

        if (user && user._id) {
          config.headers = config.headers || {};
          config.headers["x-user-id"] = user._id;

          const authToken = user.token || user._id;
          config.headers["Authorization"] = `Bearer ${authToken}`;
        }
      }
    } catch (error) {
      console.error("[API Request Error] Failed to attach token:", error);
    }

    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      console.warn("[API Network Error] Request timed out or network unavailable.");
    }

    if (error.response && error.response.status === 401) {
      console.warn("[API Auth] 401 Unauthorized. Clearing session.");
      try {
        await SecureStore.deleteItemAsync("user_session");
      } catch (e) {
        console.error("[API Auth] Failed to clear SecureStore:", e);
      }
    }

    if (error.response && error.response.status >= 500) {
      console.warn(`[API Server Error] ${error.response.status} returned from backend.`);
    }

    return Promise.reject(error);
  }
);

// User Profile & Experience API
export const userApi = {
  getUsers: () => api.get<UserProfile[] | UserProfile>("/users"),
  getCurrentUser: () => api.get<UserProfile>("/users/me"),
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post<{ success: boolean; message: string }>("/me/change-password", data),
};

// Notifications API (in-app + push)
export const notificationsApi = {
  getNotifications: () => api.get<any>("/notifications"),
  markAllRead: () => api.patch("/notifications"),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  registerPushToken: (expoPushToken: string, platform: string) =>
    api.post("/notifications/register-push", { expoPushToken, platform }),
};

// Jobs Services (Driven by User Experiences Data)
export const jobsApi = {
  // Extract & transform experience items into job items
  getJobsFromExperiences: async (): Promise<Job[]> => {
    let usersList: UserProfile[] = [];

    try {
      const response = await userApi.getUsers();
      if (Array.isArray(response.data)) {
        usersList = response.data;
      } else if (response.data && typeof response.data === "object") {
        usersList = [response.data];
      }
    } catch (err) {
      // Fallback to /users/me endpoint if /users fails
      const meResponse = await userApi.getCurrentUser();
      if (meResponse.data) {
        usersList = [meResponse.data];
      }
    }

    const extractedJobs: Job[] = [];

    usersList.forEach((user) => {
      if (user.experiences && Array.isArray(user.experiences)) {
        user.experiences.forEach((exp, idx) => {
          extractedJobs.push({
            _id: exp._id || `${user._id}_exp_${idx}`,
            title: exp.position || "Developer",
            company: exp.company || "Company",
            location: exp.location || "",
            jobType: exp.employmentType || "Full-time",
            salary: exp.salary ? `${exp.salary} MMK` : "",
            description: `${exp.position} at ${exp.company}. Location: ${
              exp.location || "N/A"
            }. ${exp.experienceYear ? exp.experienceYear + " year(s) experience." : ""}`,
            contactEmail: exp.email || exp.phone || "",
            applicationUrl: exp.website || "",
            author: {
              _id: user._id,
              name: user.name,
              image: user.image,
            },
            createdAt: exp.startDate || user.createdAt,
          });
        });
      }
    });

    return extractedJobs;
  },

  applyForJob: (jobId: string, data: { experienceId?: string; coverLetter?: string; name?: string; email?: string; phone?: string }) =>
    api.post(`/jobs/${jobId}/apply`, data),
};

// Job Applications API
export const jobApplicationsApi = {
  getMyApplications: () => api.get<any>("/jobs/applications/mine"),
  getAllApplications: () => api.get<any>("/jobs/applications"),
  updateApplicationStatus: (applicationId: string, status: string) =>
    api.patch(`/jobs/applications/${applicationId}`, { status }),
};

export default api;