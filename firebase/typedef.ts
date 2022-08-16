export interface FCMPayload {
  title: string,
  body: string,
  url?: string,
}

export interface MsgInfo {
  text: string;
  [key: string]: string | number,
}
