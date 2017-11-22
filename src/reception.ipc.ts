import {TypedMessageChannel, MessageChannel} from './ipc-messaging';

export const RequestOffer = new MessageChannel('request-offer');

export const ReceiveOffer = new TypedMessageChannel<string>('receive-offer');

export const RequestAnswer = new TypedMessageChannel<string>('request-answer');

export const ReceiveAnswer = new TypedMessageChannel<string>('receive-answer');

export const GiveAnswer = new TypedMessageChannel<string>('give-answer');

export const ConnectionStateChanged = new TypedMessageChannel<boolean>('connection-state-changed');

export const ReadyToHost = new TypedMessageChannel<any[]>('ready-to-host');

export const ReadyToJoin = new TypedMessageChannel<any[]>('ready-to-join');

export const RequestProcessTrust = new MessageChannel('request-process-trust');

export const ProcessTrust = new TypedMessageChannel<boolean>('process-trust');
