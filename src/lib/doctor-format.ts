import type { SpecialtyName } from '../constants/doctors';
import type { ImageSourcePropType } from 'react-native';

const fallbackImage = require('../../assets/images/default-doctor-illustration.png');

const knownSpecialties = new Set([
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Gynecology',
  'Oncology',
  'Orthopedics',
  'Ophthalmology',
  'Dentistry',
]);

export type AppDoctor = {
  id: string;
  name: string;
  specialty: SpecialtyName | string;
  experience: string;
  rating: string;
  location: string;
  bio: string;
  image: ImageSourcePropType;
  services?: any[];
};

function normalizeSpecialty(value?: string) {
  if (!value) return 'General Medicine';
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, SpecialtyName> = {
    cardiologist: 'Cardiology',
    cardiology: 'Cardiology',
    dermatologist: 'Dermatology',
    dermatology: 'Dermatology',
    'general practitioner': 'General Medicine',
    gp: 'General Medicine',
    'general medicine': 'General Medicine',
    gynecologist: 'Gynecology',
    gynaecologist: 'Gynecology',
    gynecology: 'Gynecology',
    gynaecology: 'Gynecology',
    oncologist: 'Oncology',
    oncology: 'Oncology',
    orthopedic: 'Orthopedics',
    orthopaedic: 'Orthopedics',
    orthopedics: 'Orthopedics',
    ophthalmologist: 'Ophthalmology',
    ophthalmology: 'Ophthalmology',
    dentist: 'Dentistry',
    dentistry: 'Dentistry',
  };

  if (aliases[normalized]) return aliases[normalized];
  return knownSpecialties.has(value) ? value : 'General Medicine';
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function formatDoctor(raw: any): AppDoctor {
  const profile = raw?.profile || raw?.doctorProfile || raw?.doctor?.profile || {};
  const user = raw?.doctor || raw?.user || raw;
  const specialty = normalizeSpecialty(profile.specialization || raw?.specialty);
  const city = user?.address?.city || raw?.city;
  const country = user?.address?.country || raw?.country;
  const avatar = user?.avatar || raw?.avatar || profile?.avatar;

  return {
    id: String(user?._id || raw?._id || raw?.id),
    name: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'HealthClan Doctor',
    specialty,
    experience: profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : 'HealthClan partner',
    rating: String(profile.ratingAverage || raw?.rating || 'New'),
    location: [city, country].filter(Boolean).join(', ') || 'Available online',
    bio: profile.bio || 'Verified HealthClan doctor available for secure video consultation.',
    image: avatar ? { uri: avatar } : fallbackImage,
    services: raw?.services || [],
  };
}

export function formatFavorite(raw: any) {
  return formatDoctor(raw?.doctor || raw);
}
