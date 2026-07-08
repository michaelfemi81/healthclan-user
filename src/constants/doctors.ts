export type SpecialtyName =
    | 'Cardiology'
    | 'Dermatology'
    | 'General Medicine'
    | 'Gynecology'
    | 'Oncology'
    | 'Orthopedics'
    | 'Ophthalmology'
    | 'Dentistry';

export const specialties = [
    { name: 'Cardiology' as SpecialtyName, slug: 'cardiology', summary: 'Heart, blood pressure, and chest pain care' },
    { name: 'Dermatology' as SpecialtyName, slug: 'dermatology', summary: 'Skin, hair, allergies, and acne support' },
    { name: 'General Medicine' as SpecialtyName, slug: 'general-medicine', summary: 'Everyday illness, checkups, and family care' },
    { name: 'Gynecology' as SpecialtyName, slug: 'gynecology', summary: 'Women health, wellness checks, and pregnancy care' },
    { name: 'Oncology' as SpecialtyName, slug: 'oncology', summary: 'Cancer screening, referrals, and care planning' },
    { name: 'Orthopedics' as SpecialtyName, slug: 'orthopedics', summary: 'Bones, joints, sports injuries, and mobility' },
    { name: 'Ophthalmology' as SpecialtyName, slug: 'ophthalmology', summary: 'Vision, eye irritation, and routine exams' },
    { name: 'Dentistry' as SpecialtyName, slug: 'dentistry', summary: 'Oral checks, tooth pain, and gum health' },
] as const;

export const fallbackDoctor = {
    id: '',
    name: 'Doctor profile unavailable',
    specialty: 'General Medicine',
    experience: 'Experience not available',
    rating: 'New',
    location: 'Available online',
    bio: 'Doctor details will appear here once this profile is available.',
    image: require('../../assets/images/default-doctor-illustration.png'),
};

export const doctors: typeof fallbackDoctor[] = [];

export function getSpecialtyBySlug(slug?: string | string[]) {
    const rawSlug = Array.isArray(slug) ? slug[0] : slug;
    return specialties.find(item => item.slug === rawSlug) ?? specialties[0];
}

export function getSpecialtyByName(name: string) {
    return specialties.find(item => item.name.toLowerCase() === name.toLowerCase()) ?? specialties[0];
}

export function getDoctorsBySpecialty(name: string) {
    return doctors.filter(doctor => doctor.specialty === name);
}

export function getDoctorById(id?: string | string[]) {
    const rawId = Array.isArray(id) ? id[0] : id;
    return doctors.find(doctor => doctor.id === rawId) ?? fallbackDoctor;
}
