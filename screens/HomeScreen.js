import React, {useState, useEffect, useContext } from 'react';
import { Button, Image, StyleSheet, View, ImageBackground, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backgroundImage = require("../media/Meditate.gif");
const meditationImage = require("../media/meditation.gif");

export default function HomeScreen() {
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({ med_minutes: 0, med_seconds: 0, rest_minutes: 0, rest_seconds: 0 });
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('stopped');
  const [sound1, setSound1] = useState(null);
  const [sound2, setSound2] = useState(null);
  const [goalTime, setGoalTime] = useState(0);
  const [background, setBackground] = useState(backgroundImage);

  useEffect(() => {
    const loadSounds = async () => {
      const { sound: sound1Instance } = await Audio.Sound.createAsync(require('../media/sound1.mp3'));
      setSound1(sound1Instance);

      const { sound: sound2Instance } = await Audio.Sound.createAsync(require('../media/sound2.mp3'));
      setSound2(sound2Instance);
    };
    loadSounds();

    return () => {
      sound1 && sound1.unloadAsync().catch((error) => console.error('Error unloading sound1:', error));
      sound2 && sound2.unloadAsync().catch((error) => console.error('Error unloading sound2:', error));
    };
  }, []);

  useEffect(() => {
    if (started && !paused) {
      const medTime = parseInt(time.med_minutes) * 60 + parseInt(time.med_seconds);
      const restTime = time.rest_minutes * 60 + time.rest_seconds;
      const total = medTime + restTime;
      const interval = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount <= 0) {
            clearInterval(interval);
            return 0;
          }

          const newCount = prevCount - 1;
          if (total - newCount === restTime) {
            sound1.playAsync();
            setBackground(meditationImage);
            setPhase('rest');
          }

          if (total - newCount === total) {
            sound2.playAsync();
            setBackground(backgroundImage);
            setStarted(false);
            setPaused(false);
            setPhase('stopped');
            setTime({ med_minutes: 0, med_seconds: 0, rest_minutes: 0, rest_seconds: 0 });
            saveMeditationHistory();
          }

          return newCount;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [started, paused, sound1, sound2, time, count]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onPickerChange = (field, value) => {
    setTime(prevTime => {
        const updatedTime = { ...prevTime, [field]: parseInt(value, 10) };
        const totalMeditation = parseInt(updatedTime.med_minutes, 10) * 60 + parseInt(updatedTime.med_seconds, 10);
        const totalRest = parseInt(updatedTime.rest_minutes, 10) * 60 + parseInt(updatedTime.rest_seconds, 10);
        const newCount = totalMeditation + totalRest;
        setCount(newCount);
        return updatedTime;
    });
};


  const start = () => {
    if(!started && !paused){
      setGoalTime(count);
    }
    setStarted(true);
    setPhase("meditation")
  };

  const stop = () => {
    setStarted(false);
    setCount(0);
    setPhase('stopped')
    setTime({ med_minutes: 0, med_seconds: 0, rest_minutes: 0, rest_seconds: 0 });
    setBackground(backgroundImage);
  };

  const pause = () => {
    setPaused(!paused);
    setPhase("paused")
  };

  const resume = () => {
    setPaused(false);
  };

  const saveMeditationHistory = async () => {
    const currentDate = new Date();
    const newEntry = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
        hour: currentDate.getHours(),
        minute: currentDate.getMinutes(),
        duration: formatTime(goalTime - count),
    };

    try {
        const localHistory = await AsyncStorage.getItem('meditationHistory');
        let historyArray = localHistory ? JSON.parse(localHistory) : []; // Initialize as an empty array if null

        historyArray.push(newEntry);

        await AsyncStorage.setItem('meditationHistory', JSON.stringify(historyArray));

        console.log('Meditation history saved:', await AsyncStorage.getItem('meditationHistory'));
        Alert.alert("Meditation Complete", "Your meditation session has been saved.");
    } catch (error) {
        Alert.alert('Error saving meditation history');
        console.error('Error saving meditation history:', error);
    }
  };

  const toTimeFormat = (time)=>(Math.floor(time/60) + " : " + Math.floor(time%60));

  return (
    <ImageBackground source={background} style={styles.background}>
      <View style={styles.content}>
        <Image source={require('../media/AppLogo.png')} style={styles.logo} />
        <Text style={styles.text} className="count">{toTimeFormat(count)}</Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <Picker
              selectedValue={time.med_minutes}
              style={styles.picker}
              onValueChange={(value) => onPickerChange('med_minutes', value)}
            >
              {Array.from({ length: 61 }, (_, i) => (
                <Picker.Item key={i} label={`${i} Min`} value={i} />
              ))}
            </Picker>
            <Picker
              selectedValue={time.med_seconds}
              style={styles.picker}
              onValueChange={(value) => onPickerChange('med_seconds', value)}
            >
              {Array.from({ length: 61 }, (_, i) => (
                <Picker.Item key={i} label={`${i} Sec`} value={i} />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>Meditation Time</Text>
          <View style={styles.inputRow}>
            <Picker
              selectedValue={time.rest_minutes}
              style={styles.picker}
              onValueChange={(value) => onPickerChange('rest_minutes', value)}
            >
              {Array.from({ length: 61 }, (_, i) => (
                <Picker.Item key={i} label={`${i} Min`} value={i} />
              ))}
            </Picker>
            <Picker
              selectedValue={time.rest_seconds}
              style={styles.picker}
              onValueChange={(value) => onPickerChange('rest_seconds', value)}
            >
              {Array.from({ length: 61 }, (_, i) => (
                <Picker.Item key={i} label={`${i} Sec`} value={i} />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>Rest Time</Text>
        </View>
        <View style={styles.buttonContainer}>
          {started ? (
            <TouchableOpacity style={styles.button} onPress={stop}>
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.button} onPress={start}>
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
          )}
          {started && !paused ? (
            <TouchableOpacity style={styles.button} onPress={pause}>
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
          ) : null}
          {started && paused ? (
            <TouchableOpacity style={styles.button} onPress={resume}>
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
  },
  text: {
    color: 'white',
    fontSize: 24,
    marginBottom: 20,
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: 150,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    marginHorizontal: 5,
    borderRadius: 5,
  },
  label: {
    color: 'white',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
});
