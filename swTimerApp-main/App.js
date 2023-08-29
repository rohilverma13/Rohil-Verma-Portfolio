import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import TimerScreen from './components/TimerScreen';
import TimerDetailScreen from './components/TimerDetailScreen';
import EditTaskScreen from './components/EditTaskScreen';
import AddTaskScreen from './components/AddTaskScreen';
import AddTimerScreen from './components/AddTimerScreen';
import EditTimerScreen from './components/EditTimerScreen';
import RunTimerScreen from './components/RunTimerScreen';
import AuthScreen from './components/AuthScreen';



import * as GoogleSignIn from 'expo-google-sign-in';

const RootStack =  createAppContainer(
    createStackNavigator(
        {
            Timer: TimerScreen,
            TimerDetails: TimerDetailScreen,
            AddTimer: AddTimerScreen,
            EditTask:  EditTaskScreen,
            AddTask:  AddTaskScreen,
            EditTimer: EditTimerScreen,
            RunTimer: RunTimerScreen,
            Auth: AuthScreen
        },
        {
            initialRouteName: 'Auth',
            navigationOptions: {
                headerStyle: {
                    backgroundColor: '#777777',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            },
        },
    ),
);

const RootStack1 = createStackNavigator(
    {
      Timer: TimerScreen,
      TimerDetails: TimerDetailScreen,
      AddTimer: AddTimerScreen, EditTask:  EditTaskScreen, AddTask: AddTaskScreen,
      EditTimer: EditTimerScreen,
    },
    {
      initialRouteName: 'Timer',
        
      navigationOptions: {
        headerStyle: {
          backgroundColor: '#777777',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      },
    },
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

//const { URLSchemes } = AppAuth;