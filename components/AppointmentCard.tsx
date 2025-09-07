import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle, Image, ImageStyle } from 'react-native';
import { Appointment } from '../lib/types';

type AppointmentCardProps = {
  appointment: Appointment;
  onPress?: () => void;
};

const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, string> = {
    'requested': 'Requested',
    'awaiting_payment': 'Awaiting Payment',
    'paid': 'Paid',
    'in_progress': 'In Progress',
    'complete': 'Completed',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return { bg: '#e8f5e9', text: '#2E7D32' };
    case 'in_progress':
      return { bg: '#e3f2fd', text: '#1976d2' };
    case 'complete':
      return { bg: '#e8f5e9', text: '#2E7D32' };
    case 'cancelled':
      return { bg: '#ffebee', text: '#d32f2f' };
    case 'requested':
      return { bg: '#fff3e0', text: '#ff8f00' };
    default:
      return { bg: '#f5f5f5', text: '#757575' };
  }
};

export default function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const statusColors = getStatusColor(appointment.status);

  return (
    <TouchableOpacity style={styles.card} onPress={() => {
      console.log('AppointmentCard pressed for appointment:', appointment.id);
      onPress?.();
    }}>
      <View style={styles.header}>
        <View style={styles.patientInfo}>
          <View style={styles.avatar}>
            {appointment.doctor?.image_url ? (
              <Image source={{ uri: appointment.doctor.image_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#7f8c8d" />
            )}
          </View>
          <View>
            <Text style={styles.patientName}>
              {appointment.doctor?.name || 'Doctor'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.dateTimeContainer}>
          <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
          <Text style={styles.dateTimeText}>{appointment.date}</Text>
          
          <Ionicons 
            name="time-outline" 
            size={16} 
            color="#7f8c8d" 
            style={styles.timeIcon} 
          />
          <Text style={styles.dateTimeText}>{appointment.time}</Text>
        </View>
        
        <View style={[styles.statusContainer, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {getStatusDisplay(appointment.status)}
          </Text>
        </View>
      </View>

      {appointment.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2} ellipsizeMode="tail">
            {appointment.notes}
          </Text>
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
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  } as ViewStyle,
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  } as ImageStyle,
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  } as TextStyle,
  patientEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  } as TextStyle,
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  } as ViewStyle,
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  dateTimeText: {
    marginLeft: 4,
    marginRight: 12,
    color: '#7f8c8d',
    fontSize: 14,
  } as TextStyle,
  timeIcon: {
    marginLeft: 16,
  } as TextStyle,
  statusContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  } as ViewStyle,
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  } as ViewStyle,
  notesText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
  } as TextStyle,
});