import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ReminderScreen from '../screens/ReminderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { HistoryProvider } from '../context/HistoryContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';


const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <HistoryProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="home-variant-outline" size={24} color="black" />
              ),
            }}
          />
          <Tab.Screen name="Reminder" 
           component={ReminderScreen} 
           options={{
            tabBarIcon: ({ color, size }) => ( <Ionicons name="notifications-outline" size={24} color="black" />),
           }}
           />

        <Tab.Screen name="Profile" component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size }) => (<Ionicons name="person-outline" color={color} size={size} /> ),
            }}
            />
        </Tab.Navigator>
      </NavigationContainer>
    </HistoryProvider>
  );
}
