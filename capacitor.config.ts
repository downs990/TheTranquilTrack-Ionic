import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.raifuzu.app',
  appName: 'the_tranquil_track',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
