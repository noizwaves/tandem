import {TypedMessageChannel, MessageChannel} from './ipc-messaging';

export const RequestOffer = new MessageChannel('dc-request-offer');

export const ReceiveOffer = new TypedMessageChannel<string>('dc-receive-offer');

export const RequestAnswer = new TypedMessageChannel<string>('dc-request-answer');

export const ReceiveAnswer = new TypedMessageChannel<string>('dc-receive-answer');

export const GiveAnswer = new TypedMessageChannel<string>('dc-give-answer');

export const ScreenSize = new TypedMessageChannel<{height: number, width: number}>('dc-screensize');

export const ExternalKeyboardRequest = new MessageChannel('dc-external-keyboard-req');

export const ExternalKeyboardResponse = new TypedMessageChannel<boolean>('dc-external-keyboard-res');

export const ConnectionStateChanged = new TypedMessageChannel<boolean>('dc-connection-state-changed');

export const ReadyToHost = new TypedMessageChannel<any[]>('dc-ready-to-host');

export const ReadyToJoin = new TypedMessageChannel<any[]>('dc-ready-to-join');

export const CloseSession = new MessageChannel('dc-close-session');

export const EnterFullScreen = new TypedMessageChannel<{height: number, width: number}>('dc-enter-full-screen');

export const LeaveFullScreen = new MessageChannel('dc-leave-full-screen');
