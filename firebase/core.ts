import * as admin from 'firebase-admin';

const firebaseConfig = require('../config/firebase-admin.json');

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

export default admin;
