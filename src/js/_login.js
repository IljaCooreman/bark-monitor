import { signIn } from './firebase'
import { googleSignInPopup } from './google-signin'
import firebase from 'firebase/app'
import 'firebase/auth'

const loginButon = document.getElementById('login-button')
loginButon.addEventListener('click', () => {
  const username = document.getElementById('un').value
  const password = document.getElementById('pass').value
  signIn(username, password)
})

const googleLoginButton = document.getElementById('google-login-button')
googleLoginButton.addEventListener('click', () => {
  var provider = new firebase.auth.GoogleAuthProvider()
  googleSignInPopup(provider)
})
