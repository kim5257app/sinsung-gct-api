import firebase from './core';

export async function verifyToken(token: string) {
  return firebase.auth().verifyIdToken(token);
}

export async function getUser(uid: string) {
  return firebase.auth().getUser(uid);
}

export async function setCustomUserClaims(uid: string, payload: {[key: string]: string}) {
  return firebase.auth().setCustomUserClaims(uid, payload);
}
