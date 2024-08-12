import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen() {
  const [history, setHistory] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [totalMeditationTime, setTotalMeditationTime] = useState(0);

  useEffect(() => {
    getHistory();
    getProfileName();
  }, []);

  const getHistory = async () => {
    try {
      let localHistory = await AsyncStorage.getItem('meditationHistory');
      if (localHistory) {
        const parsedHistory = JSON.parse(localHistory);
        setHistory(parsedHistory);
        calculateTotalMeditationTime(parsedHistory);
      }
    } catch (error) {
      console.log("Error fetching history:", error);
    }
  };

  const getProfileName = async () => {
    try {
      let name = await AsyncStorage.getItem('profileName');
      if (name) {
        setProfileName(name);
      }
    } catch (error) {
      console.log("Error fetching profile name:", error);
    }
  };

  const saveProfileName = async (name) => {
    try {
      await AsyncStorage.setItem('profileName', name);
      setProfileName(name);
      setEditingName(false);
    } catch (error) {
      console.log("Error saving profile name:", error);
    }
  };

  const calculateTotalMeditationTime = (history) => {
    const totalSeconds = history.reduce((total, entry) => {
      const [minutes, seconds] = entry.duration.split(':').map(Number);
      return total + (minutes * 60 + seconds);
    }, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    setTotalMeditationTime(`${minutes} Min ${seconds} Sec`);
  };

  const exportHistoryAsTxt = async () => {
    if (history.length === 0) {
      Alert.alert("No history available to export.");
      return;
    }
  
    const fileName = 'meditation_history.txt';
    const directory = FileSystem.documentDirectory;
  
    let historyText = history.map(entry => {
      return `Date: ${entry.year}-${entry.month}-${entry.day}\nTime: ${entry.hour}:${entry.minute}\nDuration: ${entry.duration}\n\n`;
    }).join('');
  
    try {
      const filePath = `${directory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, historyText);
      Alert.alert('Export Successful!', `Meditation history saved to "${fileName}" in app storage.`);
    } catch (error) {
      console.error('Error exporting history:', error);
      Alert.alert('Export Failed!', 'An error occurred while exporting history.');
    }
  };

  const handleNameChange = () => {
    if (newName.trim() === '') {
      Alert.alert("Name cannot be empty.");
      return;
    }
    saveProfileName(newName);
  };

  const handleDeleteName = async () => {
    try {
      await AsyncStorage.removeItem('profileName');
      setProfileName('');
    } catch (error) {
      console.log("Error deleting profile name:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.profileSection}>
        <Text style={styles.label}>Name:</Text>
        {editingName ? (
          <View style={styles.nameEditContainer}>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name"
            />
            <TouchableOpacity style={styles.button} onPress={handleNameChange}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setEditingName(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameDisplayContainer}>
            <Text style={styles.name}>{profileName || 'No name set'}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setEditingName(true)}>
              <Text style={styles.buttonText}>Edit Name</Text>
            </TouchableOpacity>
            {profileName ? (
              <TouchableOpacity style={styles.button} onPress={handleDeleteName}>
                <Text style={styles.buttonText}>Delete Name</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
      
      <Text style={styles.label}>Total Meditation Time:</Text>
      <Text style={styles.totalTime}>{totalMeditationTime}</Text>
      
      <Text style={styles.label}>Meditation History</Text>
      <ScrollView style={styles.historyContainer}>
        {history.length > 0 ? (
          history.map((entry, index) => (
            <View key={index} style={styles.historyEntry}>
              <Text style={styles.date}>{`${entry.year}-${entry.month}-${entry.day}`}</Text>
              <Text style={styles.time}>{`${entry.hour}:${entry.minute}`}</Text>
              <Text style={styles.duration}>{`Duration: ${entry.duration}`}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noHistory}>No meditation history available.</Text>
        )}
      </ScrollView>
      
      <TouchableOpacity style={styles.button} onPress={exportHistoryAsTxt}>
        <Text style={styles.buttonText}>Export History as TXT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileSection: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameDisplayContainer: {
    alignItems: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flex: 1,
    marginRight: 10,
    padding: 5,
  },
  name: {
    fontSize: 20,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  totalTime: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
  },
  historyEntry: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 16,
  },
  duration: {
    fontSize: 16,
    color: '#555',
  },
  noHistory: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
  },
});
