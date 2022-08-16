import firebase from './core';

export async function verifyToken(token: string) {
  return firebase.auth().verifyIdToken(token);
}

export async function setCustomUserClaims(uid: string, payload: {[key: string]: string}) {
  return firebase.auth().setCustomUserClaims(uid, payload);
}
