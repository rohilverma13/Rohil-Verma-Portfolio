import React, { Component } from 'react';
import {StyleSheet, ScrollView, ActivityIndicator, View, FlatList, TextInput, Image, StatusBar} from 'react-native';
import {  ListItem, Text, Card, Button } from 'react-native-elements';
import firebase from '../Firebase';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import moment from "moment"


class EditTaskScreen extends Component {
    static navigationOptions = {
        title: 'Edit Task',
    };

    constructor(props) {
        super(props);
        const { navigation } = this.props;
        this.ref = firebase.firestore().collection('timers').doc(JSON.parse(navigation.getParam('timerkey'))).collection('tasks');

        this.state = {
            isLoading: true,
            tasks: {},
            key: '',
            image: '',
        };
    }

    async componentDidMount() {
        await Permissions.askAsync(Permissions.CAMERA_ROLL);
        await Permissions.askAsync(Permissions.CAMERA);
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
        console.log("uploaded ",this.state.image);
        if (!image) {
            return;
        }

        return (
            <View
                style={{
                    marginTop: 30,
                    width: 50,
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
                    <Image source={{ uri: image }} style={{ width: 50, height: 50 }} />
                </View>

            </View>
        );
    };

    _share = () => {
        Share.share({
            message: this.state.image,
            title: 'Check out this photo',
            url: this.state.image,
        });
    };

    _copyToClipboard = () => {
        Clipboard.setString(this.state.image);
        alert('Copied image URL to clipboard');
    };

    _takePhoto = async () => {
        let pickerResult = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
        });

        this._handleImagePicked(pickerResult);
    };

    _pickImage = async () => {
        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
        });

        this._handleImagePicked(pickerResult);
    };

    _handleImagePicked = async pickerResult => {
        try {
            this.setState({ uploading: true });

            if (!pickerResult.cancelled) {
                const uploadUrl = await uploadImageAsync(pickerResult.uri);
                this.setState({ image: uploadUrl });
            }
        } catch (e) {
            console.log(e);
            alert('Upload failed, sorry :(');
        } finally {
            this.setState({ uploading: false });
        }
    };





    onCollectionUpdate = (querySnapshot) => {
        const tasks = [];
        const { navigation } = this.props;
        querySnapshot.forEach((doc) => {
            const { taskName, timeSeconds, sequenceNumber, image } = doc.data();
            console.log("Tasks data")
            console.log(doc.id);
            console.log(JSON.parse(navigation.getParam('taskkey')));
            if (JSON.parse(navigation.getParam('taskkey')) == doc.id) {
                console.log("Identified task",doc.data());
                const task = doc.data();
                this.setState({
                    key: JSON.parse(navigation.getParam('timerkey')),
                    taskKey: doc.id,
                    taskName: task.taskName,
                    timeSeconds: task.timeSeconds,
                    sequenceNumber: task.sequenceNumber,
                    image: task.image,
                });
                if (!task.image) {
                    this.state.image='';
                }
            }
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
            isLoading: false,
        });
        console.log("After setting the state");
        console.log(tasks.length);
        console.log(tasks[0]);


    }

    componentDidMount() {

        this.unsubscribe = this.ref.onSnapshot(this.onCollectionUpdate);
    }


    updateTextInput = (text, field) => {
        const state = this.state
        state[field] = text;
        this.setState(state);
        console.log("setting field",text,field);
    }

    updateTimerTask() {

        this.setState({
            isLoading: true,
        });
        const { navigation } = this.props;
        console.log("updating field ",this.state.taskName);
        const updateRef = firebase.firestore().collection('timers').doc(this.state.key).collection('tasks').doc(JSON.parse(navigation.getParam('taskkey')));
        updateRef.set({
            taskName: this.state.taskName,
            timeSeconds: this.state.timeSeconds,
            sequenceNumber: this.state.sequenceNumber,
            image: this.state.image,
        }).then((docRef) => {
            console.log("null ref");
            this.setState({
                key: '',
                taskName: '',
                isLoading: false,
            });
            this.props.navigation.goBack();
        })
            .catch((error) => {
                console.error("Error adding document: ", error);
                this.setState({
                    isLoading: false,
                });
            });
    }




    render() {
        let { image } = this.state;

        if(this.state.isLoading){
            return(
                <View style={styles.activity}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                </View>
            )
        }
        return (
            <ScrollView style={styles.container}>
                <View style={styles.subContainer}>
                    <TextInput
                        placeholder={'Name'}
                        value={this.state.taskName}
                        style={{height: 40,
                           }}
                        onChangeText={(text) => this.updateTextInput(text, 'taskName')}
                    />
                    <TextInput
                        placeholder={'Time'}
                        style={{height: 40,}}
                        value={this.state.timeSeconds}
                        onChangeText={(text) => this.updateTextInput(text, 'timeSeconds')}
                        keyboardType={'numeric'}
                    />
                </View>
                <View>




                    {this._maybeRenderImage()}
                    {this._maybeRenderUploadingOverlay()}

                    <StatusBar barStyle="default" />
                </View>


                <View style={styles.imageButton}>
                    <View style={{flex:1 }} >
                        <Button
                            onPress={this._pickImage}
                            title="Pick image"
                        />
                    </View>

                    <View style={{flex:1 , marginLeft:10}} >
                        <Button onPress={this._takePhoto} title="Take photo" />
                    </View>


                </View>
                <View style={{flex:1 , marginTop:10}} >
                    <Button
                        large
                        leftIcon={{name: 'update'}}
                        title='Update'
                        onPress={() => this.updateTimerTask()} />
                </View>
            </ScrollView>
        );

        if(this.state.isLoading){
            return(
                <View style={styles.activity}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                </View>
            )
        }
        return (
            <ScrollView style={styles.container}>
                <View style={styles.subContainer}>
                    <TextInput
                        placeholder={'Task'}
                        style={{height: 40,
                            borderColor: 'gray',
                            borderWidth: 1,}}
                        value={this.state.taskName}
                        onChangeText={(text) => this.updateTextInput(text, 'taskName')}
                    />
                    <TextInput
                        placeholder={'Time'}
                        style={{height: 40,
                            borderColor: 'gray',
                            borderWidth: 1,}}
                        value={this.state.timeSeconds}
                        onChangeText={(text) => this.updateTextInput(text, 'timeSeconds')}
                        keyboardType={'numeric'}
                    />

                </View>
                <View >

                    {this._maybeRenderImage()}
                    {this._maybeRenderUploadingOverlay()}

                    <StatusBar barStyle="default" />
                </View>

                <View style={styles.button}>
                    <Button
                        large
                        leftIcon={{name: 'update'}}
                        title='Update'
                        onPress={() => this.updateTimerTask()} />
                </View>
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

    imageButton: {
    marginTop: 10,
        flexDirection: 'row' }
})
async function uploadImageAsync(uri) {
    // Why are we using XMLHttpRequest? See:
    // https://github.com/expo/expo/issues/2402#issuecomment-443726662
    const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            resolve(xhr.response);
        };
        xhr.onerror = function(e) {
            console.log(e);
            reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
    });

    const ref = firebase
        .storage()
        .ref()
        .child(Date.now()+'taskimage');
    console.log("in uploadimage ",ref);
    const snapshot = await ref.put(blob);


    // We're done with the blob, close and release it
    //blob.close();

    return await snapshot.ref.getDownloadURL();
}
export default EditTaskScreen;