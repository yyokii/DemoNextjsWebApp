import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { User } from '../models/User'
import { atom, useRecoilState } from 'recoil'
import { useEffect } from 'react'

const userState = atom<User>({
  key: 'user',
  default: null,
})

export function useAuthentication() {
  const [user, setUser] = useRecoilState(userState)

  useEffect(() => {
    if (user !== null) {
      return
    }
    const auth = getAuth()

    signInAnonymously(auth).catch(function (error) {
      console.error(error)
    })

    onAuthStateChanged(auth, function (firebaseUser) {
      if (firebaseUser) {
        const loginUser: User = {
          uid: firebaseUser.uid,
          isAnonymous: firebaseUser.isAnonymous,
          name: "",
        }
        setUser(loginUser)
        createUserIfNotFound(loginUser)
      } else {
        setUser(null)
      }
    })
  }, [])

  return { user }
}

async function createUserIfNotFound(user: User) {
  const db = getFirestore()
  const usersCollection = collection(db, 'users')
  const userRef = doc(usersCollection, user.uid)
  const document = await getDoc(userRef)
  if (document.exists()) {
    return
  }

  await setDoc(userRef, {
    name: + new Date().getTime(),
  })
}