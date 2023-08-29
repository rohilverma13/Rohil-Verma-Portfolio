import React from "react";
import { StyleSheet, View, Button } from "react-native";
import * as Google from "expo-google-app-auth";

const AuthScreen = ({ navigation }) => {
    const signInAsync = async () => {
        try {
            const { type, user } = await Google.logInAsync({
                iosClientId: `827071971350-ki6ap65f5j68e4gopi21fbhumnisjips.apps.googleusercontent.com`,
                //androidClientId: `<YOUR_ANDROID_CLIENT_ID>`,
            });

            if (type === "success") {
                // Then you can use the Google REST API
                console.log("LoginScreen.js 17 | success, navigating to profile");
                navigation.navigate("Timer", { user });
            }
        } catch (error) {
            console.log("LoginScreen.js 19 | error with login", error);
        }
    };

    return (
        <View style={styles.container}>
            <Button title="Login" onPress={signInAsync} />
            
        </View>
    );


};

export default AuthScreen;

const styles = StyleSheet.create({});