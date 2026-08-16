"use client";

import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, getJobs, logoutStudent } from "../services/portal-api";
import type { JobProfile, StudentUser } from "../types/portal";
import AuthScreen from "./auth/AuthScreen";
import StudentOnboarding from "./onboarding/StudentOnboarding";
import StudentPortal from "./student-portal/StudentPortal";

type SessionState = "checking" | "guest" | "onboarding" | "authenticated";

export default function StudentRecruitmentApp() {
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [systemMessage, setSystemMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentStudent = await getCurrentUser();
        if (!active) return;
        setStudent(currentStudent);
        if (!currentStudent.onboardingComplete) {
          setSessionState("onboarding");
          return;
        }
        const currentJobs = await getJobs();
        if (!active) return;
        setJobs(currentJobs);
        setSessionState("authenticated");
      } catch (error) {
        if (!active) return;
        setSessionState("guest");
        if (!(error instanceof ApiError) || error.status !== 401) {
          setSystemMessage("The portal service is unavailable. Start the Express API and try again.");
        }
      }
    }

    restoreSession();
    return () => { active = false; };
  }, []);

  async function finishAuthentication(currentStudent: StudentUser) {
    setStudent(currentStudent);
    setSystemMessage("");
    if (!currentStudent.onboardingComplete) {
      setSessionState("onboarding");
      return;
    }

    await openPortal(currentStudent);
  }

  async function openPortal(currentStudent: StudentUser) {
    try {
      const currentJobs = await getJobs();
      setStudent(currentStudent);
      setJobs(currentJobs);
      setSystemMessage("");
      setSessionState("authenticated");
    } catch (error) {
      setSystemMessage(error instanceof Error ? error.message : "Placement content could not be loaded.");
    }
  }

  async function finishOnboarding(currentStudent: StudentUser) {
    await openPortal(currentStudent);
  }

  async function signOut() {
    try {
      await logoutStudent();
    } finally {
      setStudent(null);
      setJobs([]);
      setSessionState("guest");
      window.history.replaceState(null, "", "#home");
    }
  }

  if (student && sessionState !== "guest" && !student.onboardingComplete) {
    return <StudentOnboarding student={student} onComplete={finishOnboarding} onLogout={signOut} />;
  }

  if (sessionState !== "authenticated" || !student) {
    return (
      <AuthScreen
        checkingSession={sessionState === "checking"}
        onAuthenticated={finishAuthentication}
        systemMessage={systemMessage}
      />
    );
  }

  return <StudentPortal student={student} jobProfiles={jobs} onLogout={signOut} />;
}
