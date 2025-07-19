export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  available: boolean;
  image?: string;
};

export type Appointment = {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  status: 'upcoming' | 'past' | 'cancelled';
  notes?: string;
};
