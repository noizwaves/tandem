import {EventEmitter} from 'events';

const $ = require('NodObjC');

$.import('Foundation');
$.import('Cocoa')
$.import('Carbon');
$.import('AppKit')
$.import('ApplicationServices');
$.import('/System/Library/Frameworks/ApplicationServices.framework/Versions/A/Frameworks/HIServices.framework')
$.import('/System/Library/Frameworks/Carbon.framework/Versions/A/Frameworks/HIToolbox.framework')


const pool = $.NSAutoreleasePool('alloc')('init');

// Initialise this app to be hidden
// const app = $.NSApplication('sharedApplication');
// app('setActivationPolicy', $.NSApplicationActivationPolicyProhibited);

export function canDisableShortcuts(): boolean {
  return $.AXIsProcessTrusted();
}


let previous;

export function disableShortcuts(): void {
  if (previous) {
    return;
  }

  previous = $.PushSymbolicHotKeyMode($.kHIHotKeyModeAllDisabled);
}

export function restoreShortcuts(): void {
  if (!previous) {
    return;
  }

  $.PopSymbolicHotKeyMode(previous);
  previous = null;
}


function isShiftModifier(modifierFlags) {
  return ($.NSEventModifierFlagShift & modifierFlags) === $.NSEventModifierFlagShift;
}

function isOptionModifier(modifierFlags) {
  return ($.NSEventModifierFlagOption & modifierFlags) === $.NSEventModifierFlagOption;
}

function isCommandModifier(modifierFlags) {
  return ($.NSEventModifierFlagCommand & modifierFlags) === $.NSEventModifierFlagCommand;
}

function isControlModifier(modifierFlags) {
  return ($.NSEventModifierFlagControl & modifierFlags) === $.NSEventModifierFlagControl;
}

let monitor = null;

function convertFlagsToModifiersList(flags) {
  const output = [];

  if (isCommandModifier(flags)) {
    // go with left
    output.push('MetaLeft');
  }

  if (isControlModifier(flags)) {
    output.push('ControlLeft');
  }

  if (isOptionModifier(flags)) {
    output.push('AltLeft');
  }

  if (isShiftModifier(flags)) {
    output.push('ShiftLeft');
  }

  return output;
}

function buildKeyMap() {
  //   kVK_ForwardDelete: 117,
  //   kVK_Help: 114,
  //   kVK_ISO_Section: 10,
  //   kVK_JIS_Eisu: 102,
  //   kVK_JIS_Kana: 104,
  //   kVK_JIS_KeypadComma: 95,
  //   kVK_JIS_Underscore: 94,
  //   kVK_JIS_Yen: 93,
  //   kVK_Mute: 74,
  //   kVK_VolumeDown: 73,
  //   kVK_VolumeUp: 72,

  const keymap = {};

  keymap[$.kVK_ANSI_A] = 'KeyA';
  keymap[$.kVK_ANSI_B] = 'KeyB';
  keymap[$.kVK_ANSI_C] = 'KeyC';
  keymap[$.kVK_ANSI_D] = 'KeyD';
  keymap[$.kVK_ANSI_E] = 'KeyE';
  keymap[$.kVK_ANSI_F] = 'KeyF';
  keymap[$.kVK_ANSI_G] = 'KeyG';
  keymap[$.kVK_ANSI_H] = 'KeyH';
  keymap[$.kVK_ANSI_I] = 'KeyI';
  keymap[$.kVK_ANSI_J] = 'KeyJ';
  keymap[$.kVK_ANSI_K] = 'KeyK';
  keymap[$.kVK_ANSI_L] = 'KeyL';
  keymap[$.kVK_ANSI_M] = 'KeyM';
  keymap[$.kVK_ANSI_N] = 'KeyN';
  keymap[$.kVK_ANSI_O] = 'KeyO';
  keymap[$.kVK_ANSI_P] = 'KeyP';
  keymap[$.kVK_ANSI_Q] = 'KeyQ';
  keymap[$.kVK_ANSI_R] = 'KeyR';
  keymap[$.kVK_ANSI_S] = 'KeyS';
  keymap[$.kVK_ANSI_T] = 'KeyT';
  keymap[$.kVK_ANSI_U] = 'KeyU';
  keymap[$.kVK_ANSI_V] = 'KeyV';
  keymap[$.kVK_ANSI_W] = 'KeyW';
  keymap[$.kVK_ANSI_X] = 'KeyX';
  keymap[$.kVK_ANSI_Y] = 'KeyY';
  keymap[$.kVK_ANSI_Z] = 'KeyZ';

  keymap[$.kVK_ANSI_0] = 'Digit0';
  keymap[$.kVK_ANSI_1] = 'Digit1';
  keymap[$.kVK_ANSI_2] = 'Digit2';
  keymap[$.kVK_ANSI_3] = 'Digit3';
  keymap[$.kVK_ANSI_4] = 'Digit4';
  keymap[$.kVK_ANSI_5] = 'Digit5';
  keymap[$.kVK_ANSI_6] = 'Digit6';
  keymap[$.kVK_ANSI_7] = 'Digit7';
  keymap[$.kVK_ANSI_8] = 'Digit8';
  keymap[$.kVK_ANSI_9] = 'Digit9';

  keymap[$.kVK_F1] = 'F1';
  keymap[$.kVK_F2] = 'F2';
  keymap[$.kVK_F3] = 'F3';
  keymap[$.kVK_F4] = 'F4';
  keymap[$.kVK_F5] = 'F5';
  keymap[$.kVK_F6] = 'F6';
  keymap[$.kVK_F7] = 'F7';
  keymap[$.kVK_F8] = 'F8';
  keymap[$.kVK_F9] = 'F9';
  keymap[$.kVK_F10] = 'F10';
  keymap[$.kVK_F11] = 'F11';
  keymap[$.kVK_F12] = 'F12';
  // keymap[$.kVK_F13] = 'F13';
  // keymap[$.kVK_F14] = 'F14';
  // keymap[$.kVK_F15] = 'F15';
  // keymap[$.kVK_F16] = 'F16';
  // keymap[$.kVK_F17] = 'F17';
  // keymap[$.kVK_F18] = 'F18';
  // keymap[$.kVK_F19] = 'F19';
  // keymap[$.kVK_F20] = 'F20';

  keymap[$.kVK_Command] = 'MetaLeft';
  keymap[$.kVK_Option] = 'AltLeft';
  keymap[$.kVK_Shift] = 'ShiftLeft';
  keymap[$.kVK_Control] = 'ControlLeft';

  keymap[$.kVK_RightCommand] = 'MetaRight';
  keymap[$.kVK_RightOption] = 'AltRight';
  keymap[$.kVK_RightShift] = 'ShiftRight';
  keymap[$.kVK_RightControl] = 'ControlRight';

  //   kVK_End: 119,
  //   kVK_Home: 115,
  //   kVK_PageDown: 121,
  //   kVK_PageUp: 116,

  keymap[$.kVK_RightArrow] = 'ArrowRight';
  keymap[$.kVK_UpArrow] = 'ArrowUp';
  keymap[$.kVK_LeftArrow] = 'ArrowLeft';
  keymap[$.kVK_DownArrow] = 'ArrowDown';

  keymap[$.kVK_CapsLock] = 'CapsLock';
  keymap[$.kVK_Function] = 'Function';

  keymap[$.kVK_Tab] = 'Tab';
  keymap[$.kVK_Space] = 'Space';
  keymap[$.kVK_Delete] = 'Backspace';
  keymap[$.kVK_Return] = 'Enter';
  keymap[$.kVK_Escape] = 'Escape';

  keymap[$.kVK_ANSI_Backslash] = 'Backslash';
  keymap[$.kVK_ANSI_Comma] = 'Comma';
  keymap[$.kVK_ANSI_Equal] = 'Equal';
  // keymap[$.kVK_ANSI_Grave] = '';
  keymap[$.kVK_ANSI_LeftBracket] = 'BracketLeft';
  keymap[$.kVK_ANSI_Minus] = 'Minus';
  keymap[$.kVK_ANSI_Period] = 'Period';
  keymap[$.kVK_ANSI_Quote] = 'Quote';
  keymap[$.kVK_ANSI_RightBracket] = 'BracketRight';
  keymap[$.kVK_ANSI_Semicolon] = 'Semicolon';
  keymap[$.kVK_ANSI_Slash] = 'Slash';

  //   kVK_ANSI_Keypad0: 82,
  //   kVK_ANSI_Keypad1: 83,
  //   kVK_ANSI_Keypad2: 84,
  //   kVK_ANSI_Keypad3: 85,
  //   kVK_ANSI_Keypad4: 86,
  //   kVK_ANSI_Keypad5: 87,
  //   kVK_ANSI_Keypad6: 88,
  //   kVK_ANSI_Keypad7: 89,
  //   kVK_ANSI_Keypad8: 91,
  //   kVK_ANSI_Keypad9: 92,

  //   kVK_ANSI_KeypadClear: 71,
  //   kVK_ANSI_KeypadDecimal: 65,
  //   kVK_ANSI_KeypadDivide: 75,
  //   kVK_ANSI_KeypadEnter: 76,
  //   kVK_ANSI_KeypadEquals: 81,
  //   kVK_ANSI_KeypadMinus: 78,
  //   kVK_ANSI_KeypadMultiply: 67,
  //   kVK_ANSI_KeypadPlus: 69,

  return keymap;
}

const keyMap = buildKeyMap();

function convertKeyCodeToKey(keyCode) {
  return keyMap[keyCode];
}

// TODO: score this handler somewhere as it's being GC'ed
// TODO: pull this into a class instance soon
let handler;
export function captureKeyEvents() {
  const emitter = new EventEmitter();

  const func = function (self, event) {
    const eventType = event('type');

    if (eventType === $.NSEventTypeFlagsChanged) {
      flagsChangedFunc(self, event);
    } else if (eventType === $.NSEventTypeKeyUp) {
      keyUpFunc(self, event);
    }
  };

  const flagsChangedFunc = function (self, event) {
    const modifierFlags = event('modifierFlags');
    const modifiers = convertFlagsToModifiersList(modifierFlags);
    console.log('modifier changed', modifiers);
    emitter.emit('modifier', modifiers);
  };

  const keyUpFunc = function (self, event) {
    const modifierFlags = event('modifierFlags');
    const modifiers = convertFlagsToModifiersList(modifierFlags);

    const keyCode = event('keyCode');
    const key = convertKeyCodeToKey(keyCode);

    console.log('key up', key, modifiers);
    emitter.emit('keyup', key, modifiers);
  };

  const handlerTypes = [$.void, [$.id, $.id]];
  handler = $(func, handlerTypes);

  monitor = $.NSEvent('addLocalMonitorForEventsMatchingMask',
    ($.NSEventMaskFlagsChanged | $.NSEventMaskKeyUp),
    'handler', handler);

  return emitter;
}

export function stopCaptureKeyEvents() {
  if (monitor) {
    $.NSEvent('removeMonitor', monitor);
    monitor = null;
  }
}


export function deInit(): void {
  exports.restoreShortcuts();
  // pool('drain');
}
