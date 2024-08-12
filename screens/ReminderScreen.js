import React, { useState, useEffect } from 'react';
import { Button, Platform, View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReminderScreen() {
  const [reminders, setReminders] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([new Date().getDay()]);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  useEffect(() => {
    saveReminders();
  }, [reminders]);

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem('reminders');
      if (savedReminders) {
        const reminders = JSON.parse(savedReminders); 
        setReminders(reminders.map(reminder => ({ 
          ...reminder,
          time: reminder.time ? reminder.time : new Date() 
        })));
      }
    } catch (error) {
      console.error('Failed to load reminders from storage', error);
    }
  };

  const saveReminders = async () => {
    try {
      await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('Failed to save reminders to storage', error);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays(prevState =>
      prevState.includes(day) ? prevState.filter(d => d !== day) : [...prevState, day]
    );
  };

  const addReminder = () => {
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select the day.');
      return;
    }

    const newReminder = {
      time: selectedTime,
      days: selectedDays,
    };
    setReminders([...reminders, newReminder]);
    setSelectedDays([new Date().getDay()]); // Reset to today's day
    setShowTimePicker(false);
    setShowReminderSettings(false);
    Alert.alert(
      'Reminder Set',
      `Meditation Reminder set for ${selectedDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}, ${formatTime(selectedTime)}`
    );
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const deleteReminder = (index) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const reminder = reminders[index];
            setReminders(reminders.filter((_, i) => i !== index));

            // Cancel notifications associated with this reminder
            for (const day of reminder.days) {
              const trigger = {
                hour: reminder.time.getHours(),
                minute: reminder.time.getMinutes(),
                weekday: day + 1,
                repeats: true,
              };
              const notificationId = await Notifications.scheduleNotificationAsync({
                content: {},
                trigger,
              });
              await Notifications.cancelScheduledNotificationAsync(notificationId);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const dayButtons = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.dayButton, selectedDays.includes(index) ? styles.selectedDayButton : styles.unselectedDayButton]}
      onPress={() => toggleDay(index)}
    >
      <Text style={[styles.dayButtonText, selectedDays.includes(index) ? styles.selectedDayButtonText : styles.unselectedDayButtonText]}>
        {day}
      </Text>
    </TouchableOpacity>
  ));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowReminderSettings(!showReminderSettings)}
      >
        <Text style={styles.toggleButtonText}>
          {showReminderSettings ? "Hide Reminder Settings" : "Schedule Reminders"}
        </Text>
      </TouchableOpacity>

      {showReminderSettings && (
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Select Time for Reminder:</Text>
          <Button title="Select Time" onPress={() => setShowTimePicker(true)} />
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false} // Enable AM/PM selection
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  setSelectedTime(selectedDate);
                }
              }}
            />
          )}

          <Text style={styles.sectionTitle}>Select Days of the Week:</Text>
          <View style={styles.dayContainer}>
            {dayButtons}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={addReminder}
          >
            <Text style={styles.addButtonText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>
      )}

      {reminders.length > 0 && (
        <View style={styles.remindersContainer}>
          <Text style={styles.remindersTitle}>Scheduled Reminders:</Text>
          {reminders.map((reminder, index) => (
            <View key={index} style={styles.reminderItem}>
              <Text style={styles.reminderText}>
                {`Time: ${formatTime(reminder.time)} - Days: ${reminder.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteReminder(index)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  toggleButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  dayContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dayButton: {
    margin: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#007BFF',
  },
  unselectedDayButton: {
    backgroundColor: '#e0e0e0',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedDayButtonText: {
    color: '#fff',
  },
  unselectedDayButtonText: {
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remindersContainer: {
    marginTop: 20,
  },
  remindersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reminderText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
