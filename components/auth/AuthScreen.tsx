"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { loginStudent, registerStudent } from "../../services/portal-api";
import type { StudentUser } from "../../types/portal";

type AuthMode = "login" | "register";

interface AuthScreenProps {
  onAuthenticated: (student: StudentUser) => void;
  checkingSession?: boolean;
  systemMessage?: string;
}

export default function AuthScreen({ onAuthenticated, checkingSession = false, systemMessage = "" }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const student = await loginStudent(String(form.get("email")), String(form.get("password")));
      onAuthenticated(student);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirmPassword"))) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const student = await registerStudent({
        fullName: String(form.get("fullName")),
        email: String(form.get("email")),
        personalEmail: String(form.get("personalEmail")),
        mobile: String(form.get("mobile")),
        enrollmentKey: String(form.get("enrollmentKey")),
        password,
      });
      onAuthenticated(student);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-lockup">
          <span className="auth-logo"><Image src="/ccd-logo-light.png" alt="CCD SPIT" width={62} height={62} priority unoptimized /></span>
          <div><small>Career Development Department</small><strong>Student Recruitment Portal</strong></div>
        </div>
        <div className="auth-intro">
          <span className="auth-eyebrow">Verified campus access</span>
          <h1>One profile for every placement opportunity.</h1>
          <p>Use the invitation sent to your college email. Your enrollment key places you in the correct graduating batch.</p>
        </div>
        <ol className="auth-steps" aria-label="Registration process">
          <li className="complete"><span>1</span><div><strong>College invitation</strong><small>Use your @spit.ac.in email and key</small></div></li>
          <li className={mode === "register" ? "active" : ""}><span>2</span><div><strong>Create your account</strong><small>Add verified contact information</small></div></li>
          <li><span>3</span><div><strong>Exam Cell profile</strong><small>Academic details are imported securely</small></div></li>
        </ol>
        <p className="auth-support">Need help? Contact <a href="mailto:ccd@spit.ac.in">ccd@spit.ac.in</a></p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-shell">
          <div className="auth-form-heading">
            <span className="auth-eyebrow">CCD · SPIT</span>
            <h2>{mode === "login" ? "Welcome back" : "Create student account"}</h2>
            <p>{mode === "login" ? "Sign in with your registered college email." : "Registration is limited to invited students."}</p>
          </div>

          <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setErrorMessage(""); }}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setErrorMessage(""); }}>Register</button>
          </div>

          {checkingSession ? (
            <div className="auth-loading" role="status"><span />Checking your session…</div>
          ) : mode === "login" ? (
            <form className="auth-form" onSubmit={submitLogin}>
              <label>College email address<input name="email" type="email" autoComplete="username" placeholder="name@spit.ac.in" required /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label>
              <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</button>
            </form>
          ) : (
            <form className="auth-form registration-form" onSubmit={submitRegistration}>
              <div className="auth-field-grid">
                <label className="full-field">Full name<input name="fullName" autoComplete="name" placeholder="As per college records" required /></label>
                <label>College email<input name="email" type="email" autoComplete="username" placeholder="name@spit.ac.in" required /></label>
                <label>Enrollment key<input name="enrollmentKey" autoCapitalize="characters" placeholder="From your invitation email" required /></label>
                <label>Personal email<input name="personalEmail" type="email" autoComplete="email" placeholder="name@example.com" required /></label>
                <label>Mobile number<input name="mobile" type="tel" autoComplete="tel" placeholder="+91 9876543210" required /></label>
                <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Minimum 8 characters" required /></label>
                <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} placeholder="Re-enter password" required /></label>
              </div>
              <label className="auth-consent"><input type="checkbox" required /><span>I confirm these details are mine and agree to the portal access policy.</span></label>
              <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</button>
            </form>
          )}

          {(errorMessage || systemMessage) && <p className="auth-error" role="alert">{errorMessage || systemMessage}</p>}
          <p className="auth-privacy">Your graduating year comes from the enrollment key and is enforced by the server when placement content is loaded.</p>
        </div>
      </section>
    </main>
  );
}
