import React, { useState, useEffect, useRef } from 'react'; // Added useRef import
import { Button, View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function ReminderScreen() {
    const [reminders, setReminders] = useState([]);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [selectedDays, setSelectedDays] = useState([new Date().getDay()]);
    const [showReminderSettings, setShowReminderSettings] = useState(false);
    const prevRemindersRef = useRef(null); // Initialize prevRemindersRef

    useEffect(() => {
        loadReminders();
        requestNotificationPermissions();
    }, []);

    useEffect(() => {
      const areRemindersEqual = (prev, curr) => {
          if (prev === curr) return true;
          if (prev.length !== curr.length) return false;
          for (let i = 0; i < prev.length; i++) {
              if (prev[i].time.getTime() !== curr[i].time.getTime() ||
                  JSON.stringify(prev[i].days) !== JSON.stringify(curr[i].days) ||
                  JSON.stringify(prev[i].notificationIds) !== JSON.stringify(curr[i].notificationIds)) {
                  return false;
              }
          }
          return true;
      };

      if (!prevRemindersRef.current || !areRemindersEqual(prevRemindersRef.current, reminders)) {
          console.log('Reminders changed:', reminders);
          // ... (saveReminders, scheduleAllReminders)
          prevRemindersRef.current = reminders;
      }
  }, [reminders]);
  
  

    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
          Alert.alert('Notification Permission', 'Please enable notifications in settings to receive reminders.');
      }
  };

  const loadReminders = async () => {
      try {
          const savedReminders = await AsyncStorage.getItem('reminders');
          if (savedReminders) {
              const reminders = JSON.parse(savedReminders);
              setReminders(reminders.map(reminder => ({
                  ...reminder,
                  time: reminder.time ? reminder.time : new Date(),
                  notificationIds: reminder.notificationIds || [],
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
          notificationIds: [],
      };
      setReminders([...reminders, newReminder]);
      setSelectedDays([new Date().getDay()]);
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
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
  };

  const scheduleAllReminders = async () => {
      const updatedReminders = reminders.map(reminder => ({ ...reminder })); //create a copy
      for (const reminder of updatedReminders) {
          if (reminder.notificationIds && reminder.notificationIds.length > 0) {
              for (const notificationId of reminder.notificationIds) {
                  await Notifications.cancelScheduledNotificationAsync(notificationId);
              }
              reminder.notificationIds = [];
          }
      }

      for (const reminder of updatedReminders) {
          const notificationIds = [];
          for (const day of reminder.days) {
              const trigger = {
                  hour: reminder.time.getHours(),
                  minute: reminder.time.getMinutes(),
                  weekday: day + 1,
                  repeats: true,
              };
              const notificationId = await Notifications.scheduleNotificationAsync({
                  content: {
                      title: 'Meditation Reminder',
                      body: 'Time for your meditation!',
                  },
                  trigger,
              });
              notificationIds.push(notificationId);
          }
          reminder.notificationIds = notificationIds;
      }
      setReminders(updatedReminders);
  };

  const deleteReminder = async (index) => {
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
                      for (const notificationId of reminder.notificationIds) {
                          await Notifications.cancelScheduledNotificationAsync(notificationId);
                      }
                      setReminders(reminders.filter((_, i) => i !== index));
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
              is24Hour={false}
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
