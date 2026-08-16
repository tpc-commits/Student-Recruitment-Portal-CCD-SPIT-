"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { completeStudentOnboarding } from "../../services/portal-api";
import type { AddressDetails, OnboardingDetails, StudentUser } from "../../types/portal";
import ProfilePhotoCropper from "./ProfilePhotoCropper";

const steps = [
  ["Basic Details", "Let’s get you started"],
  ["Contact Details", "Confirm how CCD can reach you"],
  ["Current Education", "Imported from the Exam Cell"],
  ["Previous Education", "Verified school records"],
  ["Photo & Documents", "Complete your student identity"],
  ["Enroll for Placements", "Confirm your placement cycle"],
] as const;

const emptyAddress = (): AddressDetails => ({ building: "", street: "", city: "", state: "", pinCode: "" });

interface StudentOnboardingProps {
  student: StudentUser;
  onComplete: (student: StudentUser) => void;
  onLogout: () => Promise<void> | void;
}

export default function StudentOnboarding({ student, onComplete, onLogout }: StudentOnboardingProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [sameAddress, setSameAddress] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [sourcePhotoUrl, setSourcePhotoUrl] = useState("");
  const [sourcePhotoName, setSourcePhotoName] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [isCroppingPhoto, setIsCroppingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [details, setDetails] = useState<Omit<OnboardingDetails, "profilePhoto">>({
    dateOfBirth: "",
    gender: "",
    permanentAddress: emptyAddress(),
    currentAddress: emptyAddress(),
    photoDeclaration: false,
    placementConsent: false,
  });

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  }, [photoPreviewUrl]);

  useEffect(() => () => {
    if (sourcePhotoUrl) URL.revokeObjectURL(sourcePhotoUrl);
  }, [sourcePhotoUrl]);

  function updateDetail(field: keyof typeof details, value: string | boolean) {
    setDetails((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateAddress(addressType: "permanentAddress" | "currentAddress", field: keyof AddressDetails, value: string) {
    setDetails((current) => {
      const updatedAddress = { ...current[addressType], [field]: value };
      return {
        ...current,
        [addressType]: updatedAddress,
        ...(addressType === "permanentAddress" && sameAddress ? { currentAddress: { ...updatedAddress } } : {}),
      };
    });
  }

  function goToStep(step: number) {
    setErrorMessage("");
    setActiveStep(Math.max(0, Math.min(step, steps.length - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function isStepComplete(step: number) {
    if (step === 0) return Boolean(details.dateOfBirth && details.gender);
    if (step === 1) return addressIsComplete(details.permanentAddress) && addressIsComplete(details.currentAddress);
    if (step === 2 || step === 3) return true;
    if (step === 4) return Boolean(profilePhoto && details.photoDeclaration);
    return details.placementConsent;
  }

  function proceed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    goToStep(activeStep + 1);
  }

  function chooseProfilePicture(file: File | null) {
    setProfilePhoto(null);
    setPhotoPreviewUrl("");
    setDetails((current) => ({ ...current, photoDeclaration: false }));
    setSourcePhotoName(file?.name ?? "");
    setSourcePhotoUrl(file ? URL.createObjectURL(file) : "");
    setIsCroppingPhoto(Boolean(file));
  }

  function acceptCroppedPhoto(file: File) {
    setIsCroppingPhoto(false);
    setProfilePhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setDetails((current) => ({ ...current, photoDeclaration: false }));
  }

  async function finishOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const updatedStudent = await completeStudentOnboarding({ ...details, profilePhoto });
      onComplete(updatedStudent);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Onboarding could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const firstName = student.fullName.split(/\s+/)[0];

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <div className="onboarding-brand"><Image src="/ccd-logo-light.png" alt="CCD SPIT" width={48} height={48} priority unoptimized /><div><small>Career Development Department</small><strong>Student Registration</strong></div></div>
        <div className="onboarding-account"><span>{student.email}</span><button type="button" onClick={() => void onLogout()}>Sign out</button></div>
      </header>

      <div className="onboarding-layout">
        <aside className="onboarding-stepper">
          <span className="onboarding-kicker">Profile setup</span>
          <h1>Welcome, {firstName}.</h1>
          <p>Complete these details once to access your placement portal.</p>
          <ol>
            {steps.map(([title, description], index) => {
              const complete = isStepComplete(index);
              return <li className={index === activeStep ? "active" : complete ? "complete" : ""} key={title}><button className="onboarding-step-button" type="button" aria-current={index === activeStep ? "step" : undefined} onClick={() => goToStep(index)}><span>{complete && index !== activeStep ? "✓" : index + 1}</span><div><strong>{title}</strong><small>{description}</small></div></button></li>;
            })}
          </ol>
        </aside>

        <section className="onboarding-content">
          <div className="onboarding-progress"><span style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} /></div>

          {activeStep === 0 && (
            <form className="onboarding-form" onSubmit={proceed}>
              <FormHeading step={1} title="Basic details" description="Enter personal details used to verify your student identity." />
              <div className="onboarding-grid">
                <label className="wide">Full name<input value={student.fullName} readOnly /></label>
                <label>Date of birth<input type="date" value={details.dateOfBirth} onChange={(event) => updateDetail("dateOfBirth", event.target.value)} required /></label>
                <label>Gender<select value={details.gender} onChange={(event) => updateDetail("gender", event.target.value)} required><option value="" disabled>Select an option</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option></select></label>
                <label className="wide">College email<input value={student.email} readOnly /><small>Verified through your enrollment invitation</small></label>
              </div>
              <FormActions activeStep={activeStep} onStepChange={goToStep} />
            </form>
          )}

          {activeStep === 1 && (
            <form className="onboarding-form" onSubmit={proceed}>
              <FormHeading step={2} title="Contact details" description="Confirm your verified contact information and addresses." />
              <div className="verified-contact-grid"><div><span>College email</span><strong>{student.email}</strong><small>✓ Verified</small></div><div><span>Personal email</span><strong>{student.personalEmail}</strong><small>✓ Verified</small></div><div><span>Mobile number</span><strong>{student.mobile}</strong><small>✓ Verified</small></div></div>
              <div className="address-sections">
                <AddressFields title="Permanent address" address={details.permanentAddress} onChange={(field, value) => updateAddress("permanentAddress", field, value)} />
                <label className="onboarding-check same-address-check"><input type="checkbox" checked={sameAddress} onChange={(event) => { const checked = event.target.checked; setSameAddress(checked); if (checked) setDetails((current) => ({ ...current, currentAddress: { ...current.permanentAddress } })); }} /><span>Current address is the same as permanent address</span></label>
                <AddressFields title="Current address" address={details.currentAddress} disabled={sameAddress} onChange={(field, value) => updateAddress("currentAddress", field, value)} />
              </div>
              <FormActions activeStep={activeStep} onStepChange={goToStep} />
            </form>
          )}

          {activeStep === 2 && (
            <form className="onboarding-form" onSubmit={proceed}>
              <FormHeading step={3} title="Current education" description="Your highest level of education is imported from the Exam Cell." />
              <ExamCellNotice />
              <dl className="imported-record-grid"><div><dt>Institute</dt><dd>Sardar Patel Institute of Technology</dd></div><div><dt>Programme</dt><dd>B.Tech · Computer Engineering</dd></div><div><dt>Admission year</dt><dd>{student.graduationYear - 4}</dd></div><div><dt>Expected graduation</dt><dd>{student.graduationYear}</dd></div><div><dt>Current semester</dt><dd>As per latest Exam Cell record</dd></div><div><dt>Academic status</dt><dd><span className="imported-status">Verified</span></dd></div></dl>
              <FormActions activeStep={activeStep} onStepChange={goToStep} />
            </form>
          )}

          {activeStep === 3 && (
            <form className="onboarding-form" onSubmit={proceed}>
              <FormHeading step={4} title="Previous education" description="Your Class 10 and Class 12 records are read-only Exam Cell imports." />
              <ExamCellNotice />
              <div className="school-records"><article><span>12</span><div><small>Class 12 or equivalent</small><h3>Higher Secondary Certificate</h3><p>Maharashtra State Board · Science</p></div><strong>Verified</strong></article><article><span>10</span><div><small>Class 10 or equivalent</small><h3>Secondary School Certificate</h3><p>Maharashtra State Board</p></div><strong>Verified</strong></article></div>
              <p className="correction-hint">If an imported record is incorrect, you can raise a correction request from Education Details after onboarding.</p>
              <FormActions activeStep={activeStep} onStepChange={goToStep} />
            </form>
          )}

          {activeStep === 4 && (
            <form className="onboarding-form" onSubmit={proceed}>
              <FormHeading step={5} title="Profile photo and documents" description="A clear, recent profile photo is required for placement verification." />
              <label className="photo-upload"><span className={photoPreviewUrl ? "photo-placeholder photo-preview" : "photo-placeholder"} style={photoPreviewUrl ? { backgroundImage: `url(${photoPreviewUrl})` } : undefined}>{photoPreviewUrl ? "" : student.fullName.split(/\s+/).slice(0, 2).map((name) => name[0]).join("")}</span><div><strong>{profilePhoto ? profilePhoto.name : "Upload profile photo"}</strong><p>Choose a picture, then resize and crop it inside the portal.</p><input type="file" accept="image/*" required={!profilePhoto && !isCroppingPhoto} onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ""; chooseProfilePicture(file); }} /></div></label>
              {isCroppingPhoto && sourcePhotoUrl && <ProfilePhotoCropper imageUrl={sourcePhotoUrl} originalName={sourcePhotoName} onCancel={() => setIsCroppingPhoto(false)} onConfirm={acceptCroppedPhoto} />}
              {!isCroppingPhoto && sourcePhotoUrl && <button className="photo-recrop-button" type="button" onClick={() => setIsCroppingPhoto(true)}>{profilePhoto ? "Adjust crop" : "Resume cropping"}</button>}
              <ul className="photo-rules"><li>Crop the picture so your full face is clearly visible.</li><li>Use a recent individual photo with no other people in the frame.</li><li>Check the final preview before confirming your photo.</li></ul>
              <label className="onboarding-check photo-declaration"><input type="checkbox" checked={details.photoDeclaration} disabled={!profilePhoto || isCroppingPhoto} onChange={(event) => updateDetail("photoDeclaration", event.target.checked)} required /><span>I confirm that my face is clearly visible in the cropped photo and that the photo shows only me.</span></label>
              <div className="document-import-summary"><span>✓</span><div><strong>Academic documents connected</strong><p>Marksheets and official academic records will be supplied by the Exam Cell integration.</p></div></div>
              <FormActions activeStep={activeStep} onStepChange={goToStep} nextDisabled={!profilePhoto || !details.photoDeclaration || isCroppingPhoto} />
            </form>
          )}

          {activeStep === 5 && (
            <form className="onboarding-form" onSubmit={finishOnboarding}>
              <FormHeading step={6} title="Enroll for placements" description={`Confirm your enrollment in the class of ${student.graduationYear} placement cycle.`} />
              <div className="enrollment-summary"><span>Class of</span><strong>{student.graduationYear}</strong><p>You will only see jobs, assessments, interviews, events, and notices published for your graduating batch.</p></div>
              <label className="onboarding-check declaration"><input type="checkbox" checked={details.placementConsent} onChange={(event) => updateDetail("placementConsent", event.target.checked)} required /><span>I confirm that my information is accurate and agree to follow CCD placement rules and policies.</span></label>
              {errorMessage && <p className="onboarding-error" role="alert">{errorMessage}</p>}
              <div className="onboarding-actions"><button className="onboarding-back" type="button" onClick={() => goToStep(4)}>Back</button><button className="onboarding-next" type="submit" disabled={isSubmitting}>{isSubmitting ? "Completing setup…" : "Complete setup and enter portal"}</button></div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function FormHeading({ step, title, description }: { step: number; title: string; description: string }) {
  return <div className="onboarding-heading"><span>Step {step} of {steps.length}</span><h2>{title}</h2><p>{description}</p></div>;
}

function FormActions({ activeStep, onStepChange, nextDisabled = false }: { activeStep: number; onStepChange: (step: number) => void; nextDisabled?: boolean }) {
  return <div className="onboarding-actions"><button className="onboarding-back" type="button" disabled={activeStep === 0} onClick={() => onStepChange(activeStep - 1)}>Back</button><button className="onboarding-next" type="submit" disabled={nextDisabled}>Save and proceed</button></div>;
}

function AddressFields({ title, address, disabled = false, onChange }: { title: string; address: AddressDetails; disabled?: boolean; onChange: (field: keyof AddressDetails, value: string) => void }) {
  return <fieldset className="address-fieldset" disabled={disabled}><legend>{title}</legend><div className="address-fields"><label className="wide">Building / Flat / House<input autoComplete="address-line1" value={address.building} onChange={(event) => onChange("building", event.target.value)} required /></label><label className="wide">Street<input autoComplete="address-line2" value={address.street} onChange={(event) => onChange("street", event.target.value)} required /></label><label>City<input autoComplete="address-level2" value={address.city} onChange={(event) => onChange("city", event.target.value)} required /></label><label>State<input autoComplete="address-level1" value={address.state} onChange={(event) => onChange("state", event.target.value)} required /></label><label>PIN code<input autoComplete="postal-code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} value={address.pinCode} onChange={(event) => onChange("pinCode", event.target.value.replace(/\D/g, ""))} required /></label></div></fieldset>;
}

function addressIsComplete(address: AddressDetails) {
  return Boolean(address.building.trim() && address.street.trim() && address.city.trim() && address.state.trim() && /^[1-9][0-9]{5}$/.test(address.pinCode));
}

function ExamCellNotice() {
  return <div className="exam-import-notice"><span>EC</span><div><strong>Imported from Exam Cell</strong><p>These official records are read-only and will stay synchronized with the institute system.</p></div></div>;
}
