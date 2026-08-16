export interface AddressDetails {
  building: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface StudentUser {
  id: string;
  fullName: string;
  email: string;
  personalEmail: string;
  mobile: string;
  graduationYear: number;
  onboardingComplete: boolean;
  profile: StudentProfile | null;
  createdAt: string;
}

export interface StudentProfile {
  dateOfBirth: string;
  gender: string;
  permanentAddress: AddressDetails;
  currentAddress: AddressDetails;
  photoDeclaration: boolean;
  profilePhoto: {
    name: string;
    mimeType: string;
  } | null;
}

export interface JobProfile {
  id: string;
  title: string;
  company: string;
  city: string;
  sector: string;
  positionType: string;
  posted: string;
  closes: string;
  ctc: string;
  category: string;
  description: string;
  requirements: string[];
}

export interface RegistrationDetails {
  fullName: string;
  email: string;
  personalEmail: string;
  mobile: string;
  enrollmentKey: string;
  password: string;
}

export interface OnboardingDetails {
  dateOfBirth: string;
  gender: string;
  permanentAddress: AddressDetails;
  currentAddress: AddressDetails;
  photoDeclaration: boolean;
  placementConsent: boolean;
  profilePhoto: File | null;
}
