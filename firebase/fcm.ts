import firebase from './core';
import { FCMPayload, MsgInfo } from './typedef';
import { BatchResponse } from 'firebase-admin/lib/messaging/messaging-api';

async function sendFCM_(tokens: string[], payload: FCMPayload) {
  return firebase.messaging().sendMulticast({
    tokens,
    android: {
      priority: 'high',
      data: {
        title: payload.title,
        body: payload.body,
        channelId: 'DEFAULT_CHANNEL',
      },
    },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
      },
      fcmOptions: {
        link: (payload.url != null) ? payload.url : 'http://localhost:8080/#/',
      }
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          contentAvailable: true,
        },
      },
    },
  });
}

export async function sendFCM(fcmTokens: string[], payload: FCMPayload) {
  let tokens = fcmTokens;
  const requests: Promise<BatchResponse>[] = [];

  while(tokens.length > 0) {
    requests.push(sendFCM_(tokens.slice(0, 1024), payload));
    tokens = tokens.slice(1024);
  }

  return Promise.all(requests);
}
