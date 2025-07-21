export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating_avg?: number;
  rating_count?: number;
  available: boolean;
  image_url?: string;
  consultation_fee_cents?: number;
  bio?: string;
  stripe_account_id?: string;
  created_at?: string;
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
