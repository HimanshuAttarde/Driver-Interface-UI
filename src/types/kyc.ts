export type VerificationStatus = 'INCOMPLETE' | 'UNDER_REVIEW' | 'VERIFIED';

export interface KycUploadedFile {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  previewUrl?: string;
  uploadedAt: string;
}

export interface DrivingLicenseDoc {
  dlNumber: string;
  expiryDate: string;
  frontPhoto: KycUploadedFile | null;
  backPhoto: KycUploadedFile | null;
}

export interface VehicleRegistrationDoc {
  registrationNumber: string;
  registeredOwner: string;
  frontPhoto: KycUploadedFile | null;
}

export interface CommercialInsuranceDoc {
  policyNumber: string;
  expiryDate: string;
  documentFile: KycUploadedFile | null;
}

export interface DriverKycData {
  verificationStatus: VerificationStatus;
  statusNotes?: string;
  drivingLicense: DrivingLicenseDoc;
  vehicleRegistration: VehicleRegistrationDoc;
  commercialInsurance: CommercialInsuranceDoc;
  submittedAt?: string;
  verifiedAt?: string;
}
