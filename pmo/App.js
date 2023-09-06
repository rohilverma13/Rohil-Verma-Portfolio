import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';

const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#1E1E1E',
    text: '#FFFFFF',
    primary: '#4ED9F9',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppNavigator />
    </NavigationContainer>
  );
}
