import firebase from "firebase";import firestore from 'firebase/firestore'

const settings = {};

const config = {
  apiKey: "AIzaSyCwNFSRdcSR-dg34hgVtaL25BpvFxMZYMQ",
  authDomain: "timerapp-b24f8.firebaseapp.com",
  databaseURL: "https://timerapp-b24f8.firebaseio.com",
  projectId: "timerapp-b24f8",
  storageBucket: "timerapp-b24f8.appspot.com",
  messagingSenderId: "827071971350",
};

firebase.initializeApp(config);

firebase.firestore().settings(settings);

export default firebase;


