import type { JobProfile, OnboardingDetails, RegistrationDetails, StudentUser } from "../types/portal";

export const portalApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL
  ?? process.env.NEXT_PUBLIC_RESUME_API_URL
  ?? "http://127.0.0.1:3002";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${portalApiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const body = await response.json() as T & { message?: string };
  if (!response.ok) throw new ApiError(body.message ?? "The request could not be completed.", response.status);
  return body;
}

export async function getCurrentUser() {
  const response = await request<{ user: StudentUser }>("/api/auth/me");
  return response.user;
}

export async function loginStudent(email: string, password: string) {
  const response = await request<{ user: StudentUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return response.user;
}

export async function registerStudent(details: RegistrationDetails) {
  const response = await request<{ user: StudentUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
  return response.user;
}

export async function completeStudentOnboarding(details: OnboardingDetails) {
  const body = new FormData();
  body.set("dateOfBirth", details.dateOfBirth);
  body.set("gender", details.gender);
  body.set("permanentAddress", JSON.stringify(details.permanentAddress));
  body.set("currentAddress", JSON.stringify(details.currentAddress));
  body.set("photoDeclaration", String(details.photoDeclaration));
  body.set("placementConsent", String(details.placementConsent));
  if (details.profilePhoto) body.set("profilePhoto", details.profilePhoto);

  const response = await request<{ user: StudentUser }>("/api/onboarding", {
    method: "POST",
    body,
  });
  return response.user;
}

export function logoutStudent() {
  return request<void>("/api/auth/logout", { method: "POST" });
}

export async function getJobs() {
  const response = await request<{ jobs: JobProfile[] }>("/api/jobs");
  return response.jobs;
}
