// Commit
import React, { Component } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, View, TouchableOpacity, Image } from 'react-native';
import {  ListItem, Text, Card, Button } from 'react-native-elements';
import firebase from '../Firebase';
import moment from "moment"
import { Audio } from 'expo-av';

import * as Speech from 'expo-speech';

//abcd



class RunTimerScreen extends Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: JSON.parse(navigation.getParam('timerName', 'Timer Details')),
        };
    };

    constructor(props) {
        super(props);
        const { navigation } = this.props;
        this.refDetails = firebase.firestore().collection('timers').doc(JSON.parse(navigation.getParam('timerkey'))).collection('tasks').orderBy('sequenceNumber');

        this.state = {
            isLoading: true,
            timers: {},
            key: '',
            image: '',
            currentTimer: '10:00',
            sessionInProgress: false,
            eventDate:moment.duration().add({days:0,hours:0,minutes:0,seconds:10}), // add 9 full days, 3 hours, 40 minutes and 50 seconds
            days:0,
            hours:0,
            mins:0,
            secs:0,
            timerCompleted : false
        };

    }

    componentDidMount() {
        const { navigation } = this.props;

        const ref = firebase.firestore().collection('timers').doc(JSON.parse(navigation.getParam('timerkey')));
        this.unsubscribe = this.refDetails.onSnapshot(this.onCollectionUpdate);
        ref.get().then((doc) => {
            if (doc.exists) {
                this.setState({
                    timer: doc.data(),
                    key: doc.id,
                    isLoading: false,
                    timerkey:JSON.parse(navigation.getParam('timerkey')),
                });

            } else {
                console.log("No such document!");
            }
        });
        this.sound = new Audio.Sound();
        const status = {
            shouldPlay: false,
            playsInSilentModeIOS: true

        };

        this.sound.loadAsync(require('../assets/bell.mp3'), status, false);
        const speak = () => {
            const thingToSay = 'hello';
            Speech.speak(thingToSay);
        };

    }

    componentWillUnmount() {
        clearInterval(this.state.timerF );
    }


    onCollectionUpdate = (querySnapshot) => {
        const tasks = [];
        querySnapshot.forEach((doc) => {
            const { taskName, timeSeconds, sequenceNumber, image } = doc.data();
            console.log("Tasks data")
            console.log(doc.data());
            tasks.push({
                key: doc.id,
                doc, // DocumentSnapshot
                taskName,
                timeSeconds,
                sequenceNumber,
                image
            });
        });
        console.log("Setting state");
        console.log(this.state);
        this.setState({
            tasks : tasks,
            numberOfTasks : tasks.length,
            currentTask : 0,
            playing : false,
            timerCompleted : false
        });



        if (this.state.tasks.length>0) {
            this.state.secs = this.state.tasks[0].timeSeconds;
            this.state.currentTaskName = this.state.tasks[0].taskName;
            this.state.image = this.state.tasks[0].image;
            this.state.image = this.state.tasks[0].image;

        } else if (this.state.tasks.taskName == null) {
            this.state.secs = 0;
            this.state.currentTaskName = 'Please add some tasks first!';
            this.state.currentTask--;

        }




    }




    playTone () {
        this.sound.replayAsync();

    }

    playDelayed(){
        setTimeout(this.onSpeak, 500)
    }


    resetTimer () {}
    startTimer () {
        this.playDelayed();


        this.state.timerF = setInterval(()=>{

            let { eventDate} = this.state

            if(eventDate <=0){
                clearInterval(this.state.timerF )
                this.playTone()
                this.state.currentTask ++;
                if (this.state.currentTask < this.state.tasks.length) {
                    this.state.eventDate = moment.duration().add({days:0,hours:0,minutes:0,seconds:this.state.tasks[this.state.currentTask].timeSeconds});
                    this.state.currentTaskName = this.state.tasks[this.state.currentTask].taskName;
                    this.state.image = this.state.tasks[this.state.currentTask].image;
                    this.playTone()
                    this.startTimer()

                }
                if (eventDate <=0 && this.state.currentTask == this.state.tasks.length)
                {
                    this.state.currentTask --;
                    this.setState({timerCompleted:true});
                    console.log("Timer done");
                    this.playTone()
                }







            }else {
                if (this.state.sessionInProgress) {
                eventDate = eventDate.subtract(1,"s")
                const days = eventDate.days()
                const hours = eventDate.hours()
                const mins = eventDate.minutes()
                const secs = eventDate.seconds()

                this.setState({
                    days,
                    hours,
                    mins,
                    secs,
                    eventDate
                })
            }
            }
        },1000)

    }
    beginSession = () => {



        if (!this.state.playing ) {
            this.state.eventDate = moment.duration().add({days:0,hours:0,minutes:0,seconds:this.state.tasks[0].timeSeconds});
            this.state.currentTaskName = this.state.tasks[0].taskName;
            this.state.playing = true;
            this.startTimer()
            this.playTone()

        } else {
            this.startTimer()

        }

        this.setState({
            sessionInProgress: true
        })
    }
    stopSession = () => {

        this.state.timerF = clearInterval(this.state.timerF);
        this.setState({
            sessionInProgress: false
        })

    }


    onSpeak = () => {
        Speech.speak(this.state.currentTaskName, {
            language: 'en',
            pitch: 1,
            rate: .6,
        });
    }

    _maybeRenderUploadingOverlay = () => {
        if (this.state.uploading) {
            return (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                    ]}>
                    <ActivityIndicator color="#fff" animating size="large" />
                </View>
            );
        }
    };

    _maybeRenderImage = () => {
        let { image } = this.state;
        if (!image) {
            return;
        }

        return (
            <View
                style={{
                    marginTop: 30,
                    width: 150,
                    borderRadius: 3,
                    elevation: 2,
                }}>
                <View
                    style={{
                        borderTopRightRadius: 3,
                        borderTopLeftRadius: 3,
                        shadowColor: 'rgba(0,0,0,1)',
                        shadowOpacity: 0.2,
                        shadowOffset: { width: 4, height: 4 },
                        shadowRadius: 5,
                        overflow: 'hidden',
                    }}>
                    <Image source={{ uri: image }} style={{ width: 150, height: 150 }} />
                </View>

            </View>
        );
    };



    render() {
        if(this.state.isLoading){
            return(
                <View style={styles.activity}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )
        }
        return (
            <ScrollView>
                <Card style={styles.container}>
                    <View style={styles.subContainer}>
                        <View>
                            <Text h3>{this.state.timer.name}</Text>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.headerText}>Task {this.state.currentTask+1}/{this.state.numberOfTasks}</Text>
                        </View>



                        <View >
                            <Text style={styles.timer} >{` ${this.state.mins}:${this.state.secs}`}</Text>
                        </View>

                        <Text style={styles.instructions}>{this.state.currentTaskName}</Text>

                        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}} >
                            <Image source={{ uri: this.state.image }} style={{ width: 150, height: 150 }} />
                        </View>


                        {!this.state.sessionInProgress && this.state.numberOfTasks > 0 && !this.state.timerCompleted &&
                        <TouchableOpacity style={styles.beginButton} onPress={this.beginSession}>
                            <Text style={styles.colorWhite}>Start</Text>
                        </TouchableOpacity>
                        }
                        { this.state.sessionInProgress && this.state.numberOfTasks > 0 && !this.state.timerCompleted &&
                        <TouchableOpacity style={styles.stopButton} onPress={this.stopSession}>
                            <Text style={styles.colorWhite}>Pause</Text>
                        </TouchableOpacity>
                        }
                         { this.state.timerCompleted && this.state.numberOfTasks > 0 &&
                         <TouchableOpacity style={styles.beginButton} onPress={this.stopSession}>
                            <Text style={styles.colorWhite}>Great Job !</Text>
                        </TouchableOpacity>
                        }

                    </View>

                </Card>
            </ScrollView>
        );
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    subContainer: {
        flex: 1,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#CCCCCC',
    },
    activity: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    detailButton: {
        marginTop: 10
    },
    header: {
        position: 'absolute',
        top: 0,
        height: 60,
        width: '100%',
        backgroundColor: '#4CAF50',
    },
    headerText: {
        fontSize: 24,
        color: '#fff',
        paddingTop: 15,
        paddingLeft: 10,
        textAlign: 'center'
    },
    "timer": {
        fontSize: 80,
        textAlign: 'center',
        margin: 10,
        paddingTop: 30,
    },
    "instructions": {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
        paddingTop: 15,
    },
    beginButton: {
        margin: 40,
        padding: 40,
        backgroundColor: '#4CAF50',
        width: '80%',
    },
    stopButton: {
        margin: 40,
        padding: 40,
        backgroundColor: '#F44336',
        width: '80%',
    },
    colorWhite: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 26
    },
})

export default RunTimerScreen;