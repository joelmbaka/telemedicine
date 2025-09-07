export type Doctor = {
  id: string;
  name: string;
  specialties?: string[]; // array of specialty UUIDs (or names if joined)
  rating?: number; // convenience field for average rating
  rating_avg?: number;
  rating_count?: number;
  available: boolean;
  image_url?: string;
  consultation_fee_dollars?: number;
  bio?: string;
  stripe_account_id?: string;
  created_at?: string;
  // optional full joined info if you query with a join
  specialties_info?: { id: string; name: string; emoji: string }[];
};

export type Drug = {
  id: string;
  name: string;
  unit_price_cents: number;
  description?: string;
  stock_qty?: number;
  image_url?: string;
};

export type Patient = {
  email: string;
  full_name?: string;
};

export type Appointment = {
  id: string;
  doctor: Doctor;
  patient?: Patient & { full_name?: string };
  date: string;
  time: string;
  status: 'requested' | 'awaiting_payment' | 'paid' | 'in_progress' | 'complete' | 'cancelled' | 'refunded';
  notes?: string;
  symptoms?: string;
  fee_cents?: number;
  stripe_payment_intent_id?: string;
  video_call_url?: string;
  scheduled_at?: string;
  created_at?: string;
  updated_at?: string;
};

// Skill categories for physicians: used to browse/filter skill cards
export type SkillCategoryKey =
  | 'primary_care'
  | 'pediatrics'
  | 'cardiology'
  | 'dermatology'
  | 'neurology'
  | 'psychiatry'
  | 'orthopedics'
  | 'obgyn'
  | 'endocrinology'
  | 'gastroenterology'
  | 'pulmonology'
  | 'oncology'
  | 'rheumatology'
  | 'urology'
  | 'ophthalmology'
  | 'ent'
  | 'infectious_disease'
  | 'allergy_immunology'
  | 'nephrology'
  | 'pmr'; // Physical Medicine & Rehabilitation

export type PhysicianSubcategory = {
  key: string;
  name: string;
  emoji?: string;
};

export type PhysicianCategory = {
  key: SkillCategoryKey;
  name: string;
  emoji?: string;
  subs: PhysicianSubcategory[];
};

export const PHYSICIAN_CATEGORIES: PhysicianCategory[] = [
  {
    key: 'primary_care',
    name: 'Primary Care',
    emoji: '🩺',
    subs: [
      { key: 'family_medicine', name: 'Family Medicine' },
      { key: 'internal_medicine', name: 'Internal Medicine' },
      { key: 'geriatrics', name: 'Geriatrics' },
      { key: 'general_practice', name: 'General Practice' },
    ],
  },
  {
    key: 'pediatrics',
    name: 'Pediatrics',
    emoji: '🧒',
    subs: [
      { key: 'neonatology', name: 'Neonatology' },
      { key: 'adolescent_medicine', name: 'Adolescent Medicine' },
      { key: 'peds_cardiology', name: 'Pediatric Cardiology' },
      { key: 'peds_endocrinology', name: 'Pediatric Endocrinology' },
    ],
  },
  {
    key: 'cardiology',
    name: 'Cardiology',
    emoji: '❤️',
    subs: [
      { key: 'interventional', name: 'Interventional' },
      { key: 'electrophysiology', name: 'Electrophysiology' },
      { key: 'heart_failure', name: 'Heart Failure' },
      { key: 'echocardiography', name: 'Echocardiography' },
    ],
  },
  {
    key: 'dermatology',
    name: 'Dermatology',
    emoji: '🧴',
    subs: [
      { key: 'cosmetic', name: 'Cosmetic' },
      { key: 'pediatric_derm', name: 'Pediatric Derm' },
      { key: 'dermatopathology', name: 'Dermatopathology' },
      { key: 'medical_derm', name: 'Medical Derm' },
    ],
  },
  {
    key: 'neurology',
    name: 'Neurology',
    emoji: '🧠',
    subs: [
      { key: 'epilepsy', name: 'Epilepsy' },
      { key: 'stroke', name: 'Stroke' },
      { key: 'movement_disorders', name: 'Movement Disorders' },
      { key: 'headache', name: 'Headache' },
    ],
  },
  {
    key: 'psychiatry',
    name: 'Psychiatry',
    emoji: '🧩',
    subs: [
      { key: 'adult', name: 'Adult' },
      { key: 'child_adolescent', name: 'Child & Adolescent' },
      { key: 'geriatric_psych', name: 'Geriatric' },
      { key: 'addiction', name: 'Addiction' },
    ],
  },
  {
    key: 'orthopedics',
    name: 'Orthopedics',
    emoji: '🦴',
    subs: [
      { key: 'sports_medicine', name: 'Sports Medicine' },
      { key: 'spine', name: 'Spine' },
      { key: 'hand', name: 'Hand' },
      { key: 'joint_replacement', name: 'Joint Replacement' },
    ],
  },
  {
    key: 'obgyn',
    name: 'OB/GYN',
    emoji: '🤰',
    subs: [
      { key: 'maternal_fetal', name: 'Maternal-Fetal' },
      { key: 'reproductive_endocrinology', name: 'Reproductive Endocrinology' },
      { key: 'gyn_oncology', name: 'Gynecologic Oncology' },
      { key: 'urogynecology', name: 'Urogynecology' },
    ],
  },
  {
    key: 'endocrinology',
    name: 'Endocrinology',
    emoji: '🧬',
    subs: [
      { key: 'diabetes', name: 'Diabetes' },
      { key: 'thyroid', name: 'Thyroid' },
      { key: 'metabolic_bone', name: 'Metabolic Bone' },
    ],
  },
  {
    key: 'gastroenterology',
    name: 'Gastroenterology',
    emoji: '🩻',
    subs: [
      { key: 'hepatology', name: 'Hepatology' },
      { key: 'ibd', name: 'Inflammatory Bowel Disease' },
      { key: 'advanced_endoscopy', name: 'Advanced Endoscopy' },
    ],
  },
  {
    key: 'pulmonology',
    name: 'Pulmonology',
    emoji: '🌬️',
    subs: [
      { key: 'sleep_medicine', name: 'Sleep Medicine' },
      { key: 'critical_care', name: 'Critical Care' },
      { key: 'asthma_copd', name: 'Asthma/COPD' },
    ],
  },
  {
    key: 'oncology',
    name: 'Oncology',
    emoji: '🎗️',
    subs: [
      { key: 'medical_oncology', name: 'Medical Oncology' },
      { key: 'radiation_oncology', name: 'Radiation Oncology' },
      { key: 'surgical_oncology', name: 'Surgical Oncology' },
    ],
  },
  {
    key: 'rheumatology',
    name: 'Rheumatology',
    emoji: '🦠',
    subs: [
      { key: 'autoimmune', name: 'Autoimmune' },
      { key: 'lupus', name: 'Lupus' },
      { key: 'arthritis', name: 'Arthritis' },
    ],
  },
  {
    key: 'urology',
    name: 'Urology',
    emoji: '💧',
    subs: [
      { key: 'female_urology', name: 'Female Urology' },
      { key: 'endourology', name: 'Endourology' },
      { key: 'urologic_oncology', name: 'Urologic Oncology' },
    ],
  },
  {
    key: 'ophthalmology',
    name: 'Ophthalmology',
    emoji: '👁️',
    subs: [
      { key: 'retina', name: 'Retina' },
      { key: 'glaucoma', name: 'Glaucoma' },
      { key: 'cornea', name: 'Cornea' },
      { key: 'pediatric_oph', name: 'Pediatric Ophthalmology' },
    ],
  },
  {
    key: 'ent',
    name: 'ENT',
    emoji: '👂',
    subs: [
      { key: 'otology', name: 'Otology' },
      { key: 'rhinology', name: 'Rhinology' },
      { key: 'laryngology', name: 'Laryngology' },
      { key: 'head_neck', name: 'Head & Neck' },
    ],
  },
  {
    key: 'infectious_disease',
    name: 'Infectious Disease',
    emoji: '🧫',
    subs: [
      { key: 'hiv', name: 'HIV' },
      { key: 'tropical_medicine', name: 'Tropical Medicine' },
      { key: 'antimicrobial_stewardship', name: 'Antimicrobial Stewardship' },
    ],
  },
  {
    key: 'allergy_immunology',
    name: 'Allergy & Immunology',
    emoji: '🤧',
    subs: [
      { key: 'adult_allergy', name: 'Adult Allergy' },
      { key: 'peds_allergy', name: 'Pediatric Allergy' },
      { key: 'asthma', name: 'Asthma' },
    ],
  },
  {
    key: 'nephrology',
    name: 'Nephrology',
    emoji: '🩸',
    subs: [
      { key: 'dialysis', name: 'Dialysis' },
      { key: 'transplant', name: 'Transplant' },
      { key: 'hypertension', name: 'Hypertension' },
    ],
  },
  {
    key: 'pmr',
    name: 'Physical Med & Rehab',
    emoji: '🏃',
    subs: [
      { key: 'sports', name: 'Sports' },
      { key: 'pain', name: 'Pain' },
      { key: 'neurorehab', name: 'Neurorehab' },
    ],
  },
];
