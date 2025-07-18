import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DoctorCard from './DoctorCard';
import { Appointment } from '../app/types';

type AppointmentCardProps = {
  appointment: Appointment;
  onPress?: () => void;
};

export default function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <DoctorCard doctor={appointment.doctor} />
      
      <View style={styles.appointmentDetails}>
        <View style={styles.dateTimeContainer}>
          <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
          <Text style={styles.dateTimeText}>{appointment.date}</Text>
          
          <Ionicons name="time-outline" size={16} color="#7f8c8d" style={styles.timeIcon} />
          <Text style={styles.dateTimeText}>{appointment.time}</Text>
        </View>
        
        <View style={[
          styles.statusContainer,
          {
            backgroundColor: 
              appointment.status === 'upcoming' ? '#e3f2fd' : 
              appointment.status === 'past' ? '#e8f5e9' : '#ffebee'
          }
        ]}>
          <Text style={[
            styles.statusText,
            {
              color: 
                appointment.status === 'upcoming' ? '#1976d2' : 
                appointment.status === 'past' ? '#2E7D32' : '#d32f2f'
            }
          ]}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Text>
        </View>
      </View>
      
      {appointment.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{appointment.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    marginLeft: 4,
    color: '#34495e',
  },
  timeIcon: {
    marginLeft: 16,
  },
  statusContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  notesText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});
