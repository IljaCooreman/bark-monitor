import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { settings } from './lib'
import {startRecording, stopRecording} from './script'
var firebaseui = require('firebaseui')

var firebaseConfig = {
  apiKey: 'AIzaSyCsiHEF5K76NueqJC14yLYG7jU0zKolpB0',
  authDomain: 'barkmonitor-141a8.firebaseapp.com',
  projectId: 'barkmonitor-141a8',
  storageBucket: 'barkmonitor-141a8.appspot.com',
  messagingSenderId: '516597251527',
  appId: '1:516597251527:web:2820152ea71a82ccc96de2',
  measurementId: 'G-YSHW1PBTWK'
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// ############# FirebaseUI login ################# //
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true
    },
    uiShown: function () {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none'
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',
  signInSuccessUrl: 'barkmonitor.html',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.PhoneAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: '<your-tos-url>',
  // Privacy policy url.
  privacyPolicyUrl: '<your-privacy-policy-url>'
}
// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth())
ui.start('#firebaseui-auth-container', uiConfig)

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    settings.isLoggedIn = true
    listenForSettings(settings)
  } else {
    settings.isLoggedIn = false
  }
})

// ############# firestore stuff ################# //

export function storeBark (sessionId, volume, type = 'bark') {
  var user = firebase.auth().currentUser
  if (!user) {
    console.log('not signed in, not uploading to cloud')
    return
  }
  const db = firebase.firestore()
  return db
    .collection('users').doc(user.email)
    .collection('sessions').doc(String(sessionId))
    .collection('barks')
    .add({
      timestamp: firebase.firestore.Timestamp.fromDate(new Date()),
      user: user.email,
      type,
      volume
    })
    .catch(err => {
      console.log(err)
    })
}

export function listenForSettings (settings) {
  var user = firebase.auth().currentUser
  if (!user) {
    console.log('not signed in, could not fetch settings')
    return
  }
  const db = firebase.firestore()
  db.collection('users').doc(user.email)
    .onSnapshot((doc) => {
      console.log('Current data: ', doc.data())
      settings.recording = doc.data().recording
      doc.data().recording ? startRecording() : stopRecording()
    })
}

export function setRecording (recording) {
  settings.recording = recording
  var user = firebase.auth().currentUser
  if (!user) {
    console.log('not signed in, not uploading to cloud')
    return
  }
  const db = firebase.firestore()
  return db
    .collection('users').doc(user.email)
    .update({
      recording
    })
    .catch(err => {
      console.log(err)
    })
}
