import React, { Component } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, View  , TouchableOpacity} from 'react-native';
import {  ListItem, Text, Card, Button , Avatar} from 'react-native-elements';
import firebase from '../Firebase';
import {  Alert } from "react-native";
import DraggableFlatList from 'react-native-draggable-flatlist'
import Image from "react-native-web/dist/exports/Image";
import Icon from 'react-native-vector-icons/FontAwesome';

class TimerDetailScreen extends Component {

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
        };
    }

    renderItem = ({ item , sequenceNumber, drag, isActive}) => {
        return (
            <TouchableOpacity
                style={{
                    height: 50,
                    marginBottom : 15,
                    borderColor : 'blue',
                    backgroundColor: isActive ? "blue" : item.backgroundColor,
                    borderBottomColor: 'gray',
                    borderBottomWidth: 1,
                }}
                onLongPress={drag}

            >

                    <View style={styles.rowStyle}>
                        <View style={{flex:.1}} >
                            <Avatar
                                source={{
                                    uri:
                                        item.image,
                                }}
                            >

                            </Avatar>


                        </View>
                        <View style={{flex:.5}} >


                            <Text
                                style={{
                                    color: "black",
                                    fontSize: 15
                                }}
                            >
                                {item.taskName}
                            </Text>
                        </View>
                        <View style={{flex:.2 }} >
                            <Text
                                style={{
                                    color: "black",
                                    fontSize: 15
                                }}
                            >
                                {item.timeSeconds} Secs
                            </Text>
                        </View>
                        <View style={{flex:.1 ,margin:-5}} >
                            <Icon.Button
                                name="edit"
                                size={16}
                                color="gray"
                                style={{
                                    paddingBottom: 5
                                }}
                                backgroundColor="white"
                                onPress={() => {
                                    this.props.navigation.navigate('EditTask', {
                                        timerkey: `${JSON.stringify(this.state.key)}`,
                                        taskkey : `${JSON.stringify(item.key)}`,
                                    });
                                }}
                            >

                            </Icon.Button>
                        </View>
                        <View style={{flex:.1,margin:-5 }} >
                            <Icon.Button
                                name="remove"
                                size={16}
                                color="gray"
                                backgroundColor="white"
                                onPress={() => this.deleteTask(this.state.key,item.key)}
                            >

                            </Icon.Button>
                        </View>

                    </View>


            </TouchableOpacity>
        )
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
        tasks.sort((a, b) => (Number(a.sequenceNumber) > Number(b.sequenceNumber)) ? 1 : -1)
        this.setState({
            tasks : tasks
        });
        console.log("After setting the state");
        console.log(tasks.length);
        console.log(tasks[0]);


    }




    deleteTimer(key) {
        const { navigation } = this.props;
        this.setState({
            isLoading: true
        });
        firebase.firestore().collection('timers').doc(key).delete().then(() => {
            console.log("Document successfully deleted!");
            this.setState({
                isLoading: false
            });
            navigation.navigate('Timer');
        }).catch((error) => {
            console.error("Error removing document: ", error);
            this.setState({
                isLoading: false
            });
        });

    }

    deleteTask(key,taskKey) {
        const { navigation } = this.props;
        this.setState({
            isLoading: true
        });
        firebase.firestore().collection('timers').doc(key).collection('tasks').doc(taskKey).delete().then(() => {
            console.log("Document successfully deleted!");
            this.setState({
                isLoading: false
            });

        }).catch((error) => {
            console.error("Error removing document: ", error);
            this.setState({
                isLoading: false
            });
        });

    }

    createTwoButtonAlert(key) {
        console.log("In the alert function",key);
        //alert('Alert with one button');
        Alert.alert(
            "Confirm",
            "Do you really want to delete",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel"
                },
                {
                    text: "Ok",
                    onPress: () => this.deleteTimer(this.state.key)
                }
            ],
            { cancelable: true }
        );
    }

    reorder(data) {
        const newTasks = data;
        console.log("new tasks ",newTasks);
        const taskList=[];

        const arrayLength = newTasks.length;
        console.log("new tasks length ",newTasks.length);
        for (let i = 0; i < arrayLength; i++) {
            console.log("Setting up task ");
            console.log(newTasks[i]);
            const task={};
            task.taskName = newTasks[i].taskName;
            task.timeSeconds = newTasks[i].timeSeconds;
            task.sequenceNumber = i;
            task.key = newTasks[i].key;
            task.doc = newTasks[i].doc;
            if  (newTasks[i].image) {task.image = newTasks[i].image;};
            if  (!newTasks[i].image) {task.image = '';};
            taskList.push(task);
            if (task.key && task.key.length>0) {

                const updateRef = firebase.firestore().collection('timers').doc(this.state.key).collection('tasks').doc(task.key);
                updateRef.set({
                    taskName: task.taskName,
                    timeSeconds: task.timeSeconds,
                    sequenceNumber: task.sequenceNumber,
                    image: task.image
                }).then((docRef) => {
                    console.log("null ref");


                })
                    .catch((error) => {
                        console.error("Error adding document: ", error);
                        this.setState({
                            isLoading: false,
                        });
                    });
            }

        }



        console.log("ordered tasks ",taskList);
        this.setState({
            tasks : taskList
        });
        console.log("this.state.tasks ",this.state.tasks);
    }



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

                        <View style={{ flex: 1 }}>
                            <DraggableFlatList
                                data={this.state.tasks}
                                renderItem={this.renderItem}
                                keyExtractor={(item, sequenceNumber) => `draggable-item-${item.sequenceNumber}`}
                                onDragEnd={({ data }) => this.reorder(data)}

                            />
                        </View>

                    <View style={styles.detailButton}>
                        
                        <View style={{flex:1 , marginLeft:10}} >
                        <Button
                            titleStyle={{
                                color: "white",
                                fontSize: 10,
                            }}
                            small
                            icon={
                                <Icon
                                    name="plus-circle"
                                    size={15}
                                    color="white"
                                />
                            }
                            title="    Add Task"
                            onPress={() => {
                                this.props.navigation.navigate('AddTask', {
                                    timerkey: `${JSON.stringify(this.state.timerkey)}`,
                                });
                            }} />
                        </View>
                        <View style={{flex:1 , marginLeft:10}} >
                        <Button
                            titleStyle={{
                                color: "white",
                                fontSize: 10,
                            }}
                            small
                            icon={
                                <Icon
                                    name="edit"
                                    size={15}
                                    color="white"
                                />
                            }
                            title="    Edit Timer"
                            onPress={() => {
                                this.props.navigation.navigate('EditTimer', {
                                    timerkey: `${JSON.stringify(this.state.key)}`,
                                });
                            }} />
                        </View>
                        <View style={{flex:1 , marginLeft:10}} >
                        <Button
                            titleStyle={{
                                color: "white",
                                fontSize: 10,
                            }}
                            small
                            icon={
                                <Icon
                                    name="trash"
                                    size={15}
                                    color="white"
                                />
                            }
                            title="    Delete"
                            onPress={() => this.createTwoButtonAlert(this.state.key)} />



                        </View>


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
        marginTop: 10,
        flexDirection: 'row' },
    tinyLogo: {
        width: 30,
        height: 30,
    },
    rowStyle: {
        marginTop: 10,
        marginBottom: 20,

        flexDirection: 'row' },
    containerAlert: {
        flex: 1,
        justifyContent: "space-around",
        alignItems: "center"
    }

})

export default TimerDetailScreen;