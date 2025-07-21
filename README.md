# Telemedicine App

A modern telemedicine application built with React Native, Expo, and Supabase. This application connects patients with healthcare providers for virtual consultations and appointment scheduling.

## Features

- **User Authentication**: Secure sign-up and login for both patients and doctors
- **Appointment Scheduling**: Book, view, and manage medical appointments
- **Doctor Profiles**: View doctor specialties, availability, and ratings
- **Video Consultations**: Built-in video calling for remote consultations
- **Cross-Platform**: Works on iOS, Android, and web

## Tech Stack

- **Frontend**: React Native with TypeScript
- **Navigation**: Expo Router
- **UI Components**: React Native Elements UI
- **Backend**: Supabase (Authentication, Database)
- **State Management**: React Context API
- **Date Handling**: date-fns
- **Icons**: @expo/vector-icons

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase URL and anon key

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run the app**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan the QR code with your mobile device (Expo Go app required)
   - Press `w` to open in web browser

## Project Structure

```
/
├── app/                    # Main application code
│   ├── (tabs)/            # Main tab navigation
│   ├── (doctor)/          # Doctor-specific screens
│   ├── (modals)/          # Modal screens
│   ├── auth/              # Authentication screens
│   └── _layout.tsx        # Root layout
├── assets/                # Static assets (images, fonts)
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

## Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser
- `npm run build:web` - Build for web deployment
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
