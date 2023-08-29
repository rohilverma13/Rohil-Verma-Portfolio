//rohil test
import React, { Component } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, View, Text , TouchableOpacity} from 'react-native';
import {  ListItem, Button, Avatar } from 'react-native-elements';
import firebase from '../Firebase';
import Icon from 'react-native-vector-icons/FontAwesome';

class TimerScreen extends Component {

    constructor(props) {
        super(props);
        this.ref = firebase.firestore().collection('timers').orderBy('name');
        this.unsubscribe = null;
        this.state = {
            isLoading: true,
            timers: []
        };
    }

    onCollectionUpdate = (querySnapshot) => {
        const timers = [];
        querySnapshot.forEach((doc) => {
            const { name, tasks,image } = doc.data();
            timers.push({
                key: doc.id,
                doc, // DocumentSnapshot
                name,
                tasks,
                image
            });
        });
        console.log("Setting state");
        console.log(this.state);
        console.log(timers['name']);
        this.setState({
            timers : timers,
            isLoading: false,
        });
        console.log("After setting state");
        console.log(timers);
    }

    componentDidMount() {
        this.unsubscribe = this.ref.onSnapshot(this.onCollectionUpdate);
    }

    static navigationOptions = ({ navigation }) => {
        return {
            title: 'My Timers',
            headerRight: (
                <Button
                    buttonStyle={{ padding: 0, backgroundColor: 'transparent' }}
                    icon={{ name: 'add-circle', style: { marginRight: 20, fontSize: 28 } }}
                    onPress={() => { navigation.push('AddTimer') }}
                />
            ),
        };
    };


    render() {
        if(this.state.isLoading){
            return(
                <View style={styles.activity}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                </View>
            )
        }
        return (
            <ScrollView style={styles.container}>

                    {
                        this.state.timers.map((item, i) => (
                            <ListItem
                                key={i}
                                bottomDivider
                                onPress={() => {
                                    this.props.navigation.navigate('RunTimer', {
                                        timerkey: `${JSON.stringify(item.key)}`,
                                        timerName: `${JSON.stringify(item.name)}`,
                                    });
                                }}
                            >
                                <Avatar source={{uri: item.image}} />
                                <ListItem.Content>
                                    <ListItem.Title >{item.name}</ListItem.Title>
                                </ListItem.Content>
                                <Icon.Button
                                    name="play"
                                    size={14}
                                    color="black"
                                    backgroundColor="white"
                                    onPress={() => {
                                        this.props.navigation.navigate('RunTimer', {
                                            timerkey: `${JSON.stringify(item.key)}`,
                                            timerName: `${JSON.stringify(item.name)}`,
                                        });
                                    }}
                                >

                                </Icon.Button>
                                <Icon.Button
                                    name="edit"
                                    size={14}
                                    color="black"
                                    backgroundColor="white"
                                    onPress={() => {
                                        this.props.navigation.navigate('TimerDetails', {
                                            timerkey: `${JSON.stringify(item.key)}`,
                                            timerName: `${JSON.stringify(item.name)}`,
                                        });
                                    }}
                                >

                                </Icon.Button>



                            </ListItem>
                        ))
                    }

            </ScrollView>
        );
    }
}

                           // <ListItem key={i} bottomDivider >
                           //     <ListItem.Content>
                           //         <ListItem.Title >{item.name}</ListItem.Title>
//
                            //    </ListItem.Content>

                          //  </ListItem>








const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 22
    },
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
    activity: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default TimerScreen;