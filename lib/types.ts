export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  available: boolean;
  image?: string;
  consultation_fee_cents?: number;
};

export type Patient = {
  email: string;
};

export type Appointment = {
  id: string;
  doctor: Doctor;
  patient?: Patient;
  date: string;
  time: string;
  status: 'upcoming' | 'past' | 'cancelled' | 'awaiting_payment' | 'paid';
  notes?: string;
  fee_cents?: number;
  stripe_payment_intent_id?: string;
};
