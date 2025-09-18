import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthService } from '../services/AuthService';
import { User } from '../types';

export default function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    loadUser();
  }, []);
  const loadUser = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
  };
  const handleLogout = async () => {
    await AuthService.logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue !</Text>
      <Text style={styles.subtitle}>Hello {user?.name}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informations utilisateur</Text>
        <Text style={styles.info}>Email: {user?.email}</Text>
        <Text style={styles.info}>ID: {user?.id}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4f46e5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  info: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
