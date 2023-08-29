import React, { Component } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, View, TextInput , StatusBar, Image, Text} from 'react-native';
import { Button } from 'react-native-elements';
import firebase from '../Firebase';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import uuid from 'uuid';
import moment from "moment"

class AddTimerScreen extends Component {
    static navigationOptions = {
        title: 'Add Timer',
    };
    constructor(props) {
        super(props);
        this.ref = firebase.firestore().collection('timers');
        this.state = {
            name: '',
            isLoading: false,
            image: null,
        };
    }

    async componentDidMount() {
        await Permissions.askAsync(Permissions.CAMERA_ROLL);
        await Permissions.askAsync(Permissions.CAMERA);
    }

    updateTextInput = (text, field) => {
        const state = this.state
        state[field] = text;
        this.setState(state);
    }

    saveTimer() {
        this.setState({
            isLoading: true,
        });
        const newTimer = this.ref.add({
            name: this.state.name,
            image:this.state.image,
        }).then((docRef) => {

            this.setState({
                name: '',
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
                        maxLength={20}
                        placeholder={'Name'}
                        value={this.state.name}
                        onChangeText={(text) => this.updateTextInput(text, 'name')}
                    />
                </View>
                <View >




                    {this._maybeRenderImage()}
                    {this._maybeRenderUploadingOverlay()}

                    <StatusBar barStyle="default" />
                </View>


                <View style={styles.button}>
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
                        leftIcon={{name: 'save'}}
                        title='Save'
                        onPress={() => this.saveTimer()} />
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
        marginBottom: 20,
        padding: 5,
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
    button: {
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

export default AddTimerScreen;