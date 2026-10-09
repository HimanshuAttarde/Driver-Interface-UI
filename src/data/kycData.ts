import { DriverKycData } from '../types/kyc';

export const INITIAL_KYC_STATE: DriverKycData = {
  verificationStatus: 'INCOMPLETE',
  statusNotes: 'Regulatory compliance required for carrying pooled passengers across express corridors.',
  drivingLicense: {
    dlNumber: 'MH12 20180012345',
    expiryDate: '2032-08-15',
    frontPhoto: {
      id: 'dl-front-1',
      name: 'dl_front_sameer_khan.jpg',
      sizeBytes: 1845200, // 1.8 MB
      type: 'image/jpeg',
      previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
      uploadedAt: 'Today, 10:14 AM',
    },
    backPhoto: null, // Left null so initial state is legitimately INCOMPLETE
  },
  vehicleRegistration: {
    registrationNumber: 'MH 14 JM 8821',
    registeredOwner: 'Sameer Khan',
    frontPhoto: {
      id: 'rc-front-1',
      name: 'rc_smartcard_front.jpg',
      sizeBytes: 2140000, // 2.1 MB
      type: 'image/jpeg',
      previewUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
      uploadedAt: 'Today, 10:18 AM',
    },
  },
  commercialInsurance: {
    policyNumber: 'HDFC-ERGO-COMM-998231',
    expiryDate: '2027-03-31',
    documentFile: null, // Left null so user can experience uploading or submitting
  },
};

export const MOCK_VERIFIED_KYC_STATE: DriverKycData = {
  verificationStatus: 'VERIFIED',
  statusNotes: 'Verified Captain • Full Access Granted to NH48 Express Corridors',
  submittedAt: 'Oct 08, 2026',
  verifiedAt: 'Oct 08, 2026, 4:20 PM',
  drivingLicense: {
    dlNumber: 'MH12 20180012345',
    expiryDate: '2032-08-15',
    frontPhoto: {
      id: 'dl-front-v',
      name: 'dl_front_sameer_khan.jpg',
      sizeBytes: 1845200,
      type: 'image/jpeg',
      previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
      uploadedAt: 'Oct 08, 2026',
    },
    backPhoto: {
      id: 'dl-back-v',
      name: 'dl_back_endorsements.jpg',
      sizeBytes: 1620000,
      type: 'image/jpeg',
      previewUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80',
      uploadedAt: 'Oct 08, 2026',
    },
  },
  vehicleRegistration: {
    registrationNumber: 'MH 14 JM 8821',
    registeredOwner: 'Sameer Khan',
    frontPhoto: {
      id: 'rc-front-v',
      name: 'rc_smartcard_front.jpg',
      sizeBytes: 2140000,
      type: 'image/jpeg',
      previewUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
      uploadedAt: 'Oct 08, 2026',
    },
  },
  commercialInsurance: {
    policyNumber: 'HDFC-ERGO-COMM-998231',
    expiryDate: '2027-03-31',
    documentFile: {
      id: 'ins-doc-v',
      name: 'hdfc_commercial_passenger_policy.pdf',
      sizeBytes: 3410000, // 3.4 MB
      type: 'application/pdf',
      uploadedAt: 'Oct 08, 2026',
    },
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
