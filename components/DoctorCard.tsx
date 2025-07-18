import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Doctor } from '../app/types';

type DoctorCardProps = {
  doctor: Doctor;
  onPress?: () => void;
};

export default function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {doctor.image ? (
          <Image source={{ uri: doctor.image }} style={styles.image} />
        ) : (
          <Ionicons name="person-circle-outline" size={70} color="#95a5a6" />
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
        </View>
        
        <View style={styles.availabilityContainer}>
          <View style={[styles.availabilityDot, 
            { backgroundColor: doctor.available ? '#2E7D32' : '#d32f2f' }]} 
          />
          <Text style={styles.availabilityText}>
            {doctor.available ? 'Available Today' : 'Not Available'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  specialty: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 4,
    color: '#f39c12',
    fontWeight: '600',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});
