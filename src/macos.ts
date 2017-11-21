import {Observable, Subject} from 'rxjs';
import * as Rx from 'rxjs';
import {Keyboard, KeyCode, KeyDownEvent, KeyUpEvent, ModifierCode, Modifiers} from './keyboard';
import {SystemIntegrator} from './system-integrator';

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

function disableShortcuts(): void {
  return $.PushSymbolicHotKeyMode($.kHIHotKeyModeAllDisabled);
}

function restoreShortcuts(previous): void {
  if (!previous) {
    return;
  }

  $.PopSymbolicHotKeyMode(previous);
}

// TODO: model this better
type MacModifierFlags = number;

enum MacKeyCode {
  kVK_ANSI_A = $.kVK_ANSI_A,
  kVK_ANSI_B = $.kVK_ANSI_B,
  kVK_ANSI_C = $.kVK_ANSI_C,
  kVK_ANSI_D = $.kVK_ANSI_D,
  kVK_ANSI_E = $.kVK_ANSI_E,
  kVK_ANSI_F = $.kVK_ANSI_F,
  kVK_ANSI_G = $.kVK_ANSI_G,
  kVK_ANSI_H = $.kVK_ANSI_H,
  kVK_ANSI_I = $.kVK_ANSI_I,
  kVK_ANSI_J = $.kVK_ANSI_J,
  kVK_ANSI_K = $.kVK_ANSI_K,
  kVK_ANSI_L = $.kVK_ANSI_L,
  kVK_ANSI_M = $.kVK_ANSI_M,
  kVK_ANSI_N = $.kVK_ANSI_N,
  kVK_ANSI_O = $.kVK_ANSI_O,
  kVK_ANSI_P = $.kVK_ANSI_P,
  kVK_ANSI_Q = $.kVK_ANSI_Q,
  kVK_ANSI_R = $.kVK_ANSI_R,
  kVK_ANSI_S = $.kVK_ANSI_S,
  kVK_ANSI_T = $.kVK_ANSI_T,
  kVK_ANSI_U = $.kVK_ANSI_U,
  kVK_ANSI_V = $.kVK_ANSI_V,
  kVK_ANSI_W = $.kVK_ANSI_W,
  kVK_ANSI_X = $.kVK_ANSI_X,
  kVK_ANSI_Y = $.kVK_ANSI_Y,
  kVK_ANSI_Z = $.kVK_ANSI_Z,
  kVK_ANSI_0 = $.kVK_ANSI_0,
  kVK_ANSI_1 = $.kVK_ANSI_1,
  kVK_ANSI_2 = $.kVK_ANSI_2,
  kVK_ANSI_3 = $.kVK_ANSI_3,
  kVK_ANSI_4 = $.kVK_ANSI_4,
  kVK_ANSI_5 = $.kVK_ANSI_5,
  kVK_ANSI_6 = $.kVK_ANSI_6,
  kVK_ANSI_7 = $.kVK_ANSI_7,
  kVK_ANSI_8 = $.kVK_ANSI_8,
  kVK_ANSI_9 = $.kVK_ANSI_9,

  kVK_F1 = $.kVK_F1,
  kVK_F2 = $.kVK_F2,
  kVK_F3 = $.kVK_F3,
  kVK_F4 = $.kVK_F4,
  kVK_F5 = $.kVK_F5,
  kVK_F6 = $.kVK_F6,
  kVK_F7 = $.kVK_F7,
  kVK_F8 = $.kVK_F8,
  kVK_F9 = $.kVK_F9,
  kVK_F10 = $.kVK_F10,
  kVK_F11 = $.kVK_F11,
  kVK_F12 = $.kVK_F12,

  kVK_F13 = $.kVK_F13,
  kVK_F14 = $.kVK_F14,
  kVK_F15 = $.kVK_F15,
  kVK_F16 = $.kVK_F16,
  kVK_F17 = $.kVK_F17,
  kVK_F18 = $.kVK_F18,
  kVK_F19 = $.kVK_F19,
  kVK_F20 = $.kVK_F20,

  kVK_Command = $.kVK_Command,
  kVK_Option = $.kVK_Option,
  kVK_Shift = $.kVK_Shift,
  kVK_Control = $.kVK_Control,

  kVK_RightCommand = $.kVK_RightCommand,
  kVK_RightOption = $.kVK_RightOption,
  kVK_RightShift = $.kVK_RightShift,
  kVK_RightControl = $.kVK_RightControl,

  kVK_RightArrow = $.kVK_RightArrow,
  kVK_UpArrow = $.kVK_UpArrow,
  kVK_LeftArrow = $.kVK_LeftArrow,
  kVK_DownArrow = $.kVK_DownArrow,

  kVK_Function = $.kVK_Function,
  kVK_ForwardDelete = $.kVK_ForwardDelete,
  kVK_Home = $.kVK_Home,
  kVK_End = $.kVK_End,
  kVK_PageUp = $.kVK_PageUp,
  kVK_PageDown = $.kVK_PageDown,

  kVK_ANSI_Grave = $.kVK_ANSI_Grave,
  kVK_CapsLock = $.kVK_CapsLock,
  kVK_Tab = $.kVK_Tab,
  kVK_Space = $.kVK_Space,
  kVK_Delete = $.kVK_Delete,
  kVK_Return = $.kVK_Return,
  kVK_Escape = $.kVK_Escape,
  kVK_ANSI_Backslash = $.kVK_ANSI_Backslash,
  kVK_ANSI_Comma = $.kVK_ANSI_Comma,
  kVK_ANSI_Equal = $.kVK_ANSI_Equal,
  kVK_ANSI_LeftBracket = $.kVK_ANSI_LeftBracket,
  kVK_ANSI_Minus = $.kVK_ANSI_Minus,
  kVK_ANSI_Period = $.kVK_ANSI_Period,
  kVK_ANSI_Quote = $.kVK_ANSI_Quote,
  kVK_ANSI_RightBracket = $.kVK_ANSI_RightBracket,
  kVK_ANSI_Semicolon = $.kVK_ANSI_Semicolon,
  kVK_ANSI_Slash = $.kVK_ANSI_Slash,

  kVK_ANSI_Keypad0 = $.kVK_ANSI_Keypad0,
  kVK_ANSI_Keypad1 = $.kVK_ANSI_Keypad1,
  kVK_ANSI_Keypad2 = $.kVK_ANSI_Keypad2,
  kVK_ANSI_Keypad3 = $.kVK_ANSI_Keypad3,
  kVK_ANSI_Keypad4 = $.kVK_ANSI_Keypad4,
  kVK_ANSI_Keypad5 = $.kVK_ANSI_Keypad5,
  kVK_ANSI_Keypad6 = $.kVK_ANSI_Keypad6,
  kVK_ANSI_Keypad7 = $.kVK_ANSI_Keypad7,
  kVK_ANSI_Keypad8 = $.kVK_ANSI_Keypad8,
  kVK_ANSI_Keypad9 = $.kVK_ANSI_Keypad9,

  kVK_ANSI_KeypadClear = $.kVK_ANSI_KeypadClear,
  kVK_ANSI_KeypadDecimal = $.kVK_ANSI_KeypadDecimal,
  kVK_ANSI_KeypadDivide = $.kVK_ANSI_KeypadDivide,
  kVK_ANSI_KeypadEnter = $.kVK_ANSI_KeypadEnter,
  kVK_ANSI_KeypadEquals = $.kVK_ANSI_KeypadEquals,
  kVK_ANSI_KeypadMinus = $.kVK_ANSI_KeypadMinus,
  kVK_ANSI_KeypadMultiply = $.kVK_ANSI_KeypadMultiply,
  kVK_ANSI_KeypadPlus = $.kVK_ANSI_KeypadPlus,

  // ## Unhandled but known
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
}

function isShiftModifier(modifierFlags: MacModifierFlags): boolean {
  return ($.NSEventModifierFlagShift & modifierFlags) === $.NSEventModifierFlagShift;
}

function isOptionModifier(modifierFlags: MacModifierFlags): boolean {
  return ($.NSEventModifierFlagOption & modifierFlags) === $.NSEventModifierFlagOption;
}

function isCommandModifier(modifierFlags: MacModifierFlags): boolean {
  return ($.NSEventModifierFlagCommand & modifierFlags) === $.NSEventModifierFlagCommand;
}

function isControlModifier(modifierFlags: MacModifierFlags): boolean {
  return ($.NSEventModifierFlagControl & modifierFlags) === $.NSEventModifierFlagControl;
}

function convertToModifiers(flags: MacModifierFlags): Modifiers {
  const output: Modifiers = [];

  if (isCommandModifier(flags)) {
    // go with left
    output.push(ModifierCode.MetaLeft);
  }

  if (isControlModifier(flags)) {
    output.push(ModifierCode.ControlLeft);
  }

  if (isOptionModifier(flags)) {
    output.push(ModifierCode.AltLeft);
  }

  if (isShiftModifier(flags)) {
    output.push(ModifierCode.ShiftLeft);
  }

  return output;
}

function convertToKeyCode(code: MacKeyCode): KeyCode {
  switch (code) {
    case MacKeyCode.kVK_ANSI_A:
      return KeyCode.KeyA;
    case MacKeyCode.kVK_ANSI_B:
      return KeyCode.KeyB;
    case MacKeyCode.kVK_ANSI_C:
      return KeyCode.KeyC;
    case MacKeyCode.kVK_ANSI_D:
      return KeyCode.KeyD;
    case MacKeyCode.kVK_ANSI_E:
      return KeyCode.KeyE;
    case MacKeyCode.kVK_ANSI_F:
      return KeyCode.KeyF;
    case MacKeyCode.kVK_ANSI_G:
      return KeyCode.KeyG;
    case MacKeyCode.kVK_ANSI_H:
      return KeyCode.KeyH;
    case MacKeyCode.kVK_ANSI_I:
      return KeyCode.KeyI;
    case MacKeyCode.kVK_ANSI_J:
      return KeyCode.KeyJ;
    case MacKeyCode.kVK_ANSI_K:
      return KeyCode.KeyK;
    case MacKeyCode.kVK_ANSI_L:
      return KeyCode.KeyL;
    case MacKeyCode.kVK_ANSI_M:
      return KeyCode.KeyM;
    case MacKeyCode.kVK_ANSI_N:
      return KeyCode.KeyN;
    case MacKeyCode.kVK_ANSI_O:
      return KeyCode.KeyO;
    case MacKeyCode.kVK_ANSI_P:
      return KeyCode.KeyP;
    case MacKeyCode.kVK_ANSI_Q:
      return KeyCode.KeyQ;
    case MacKeyCode.kVK_ANSI_R:
      return KeyCode.KeyR;
    case MacKeyCode.kVK_ANSI_S:
      return KeyCode.KeyS;
    case MacKeyCode.kVK_ANSI_T:
      return KeyCode.KeyT;
    case MacKeyCode.kVK_ANSI_U:
      return KeyCode.KeyU;
    case MacKeyCode.kVK_ANSI_V:
      return KeyCode.KeyV;
    case MacKeyCode.kVK_ANSI_W:
      return KeyCode.KeyW;
    case MacKeyCode.kVK_ANSI_X:
      return KeyCode.KeyX;
    case MacKeyCode.kVK_ANSI_Y:
      return KeyCode.KeyY;
    case MacKeyCode.kVK_ANSI_Z:
      return KeyCode.KeyZ;

    case MacKeyCode.kVK_ANSI_0:
      return KeyCode.Digit0;
    case MacKeyCode.kVK_ANSI_1:
      return KeyCode.Digit1;
    case MacKeyCode.kVK_ANSI_2:
      return KeyCode.Digit2;
    case MacKeyCode.kVK_ANSI_3:
      return KeyCode.Digit3;
    case MacKeyCode.kVK_ANSI_4:
      return KeyCode.Digit4;
    case MacKeyCode.kVK_ANSI_5:
      return KeyCode.Digit5;
    case MacKeyCode.kVK_ANSI_6:
      return KeyCode.Digit6;
    case MacKeyCode.kVK_ANSI_7:
      return KeyCode.Digit7;
    case MacKeyCode.kVK_ANSI_8:
      return KeyCode.Digit8;
    case MacKeyCode.kVK_ANSI_9:
      return KeyCode.Digit9;

    case MacKeyCode.kVK_F1:
      return KeyCode.F1;
    case MacKeyCode.kVK_F2:
      return KeyCode.F2;
    case MacKeyCode.kVK_F3:
      return KeyCode.F3;
    case MacKeyCode.kVK_F4:
      return KeyCode.F4;
    case MacKeyCode.kVK_F5:
      return KeyCode.F5;
    case MacKeyCode.kVK_F6:
      return KeyCode.F6;
    case MacKeyCode.kVK_F7:
      return KeyCode.F7;
    case MacKeyCode.kVK_F8:
      return KeyCode.F8;
    case MacKeyCode.kVK_F9:
      return KeyCode.F9;
    case MacKeyCode.kVK_F10:
      return KeyCode.F10;
    case MacKeyCode.kVK_F11:
      return KeyCode.F11;
    case MacKeyCode.kVK_F12:
      return KeyCode.F12;

    case MacKeyCode.kVK_F13:
      return KeyCode.F13;
    case MacKeyCode.kVK_F14:
      return KeyCode.F14;
    case MacKeyCode.kVK_F15:
      return KeyCode.F15;
    case MacKeyCode.kVK_F16:
      return KeyCode.F16;
    case MacKeyCode.kVK_F17:
      return KeyCode.F17;
    case MacKeyCode.kVK_F18:
      return KeyCode.F18;
    case MacKeyCode.kVK_F19:
      return KeyCode.F19;
    case MacKeyCode.kVK_F20:
      return KeyCode.F20;

    case MacKeyCode.kVK_Command:
      return KeyCode.MetaLeft;
    case MacKeyCode.kVK_Option:
      return KeyCode.AltLeft;
    case MacKeyCode.kVK_Shift:
      return KeyCode.ShiftLeft;
    case MacKeyCode.kVK_Control:
      return KeyCode.ControlLeft;

    case MacKeyCode.kVK_RightCommand:
      return KeyCode.MetaRight;
    case MacKeyCode.kVK_RightOption:
      return KeyCode.AltRight;
    case MacKeyCode.kVK_RightShift:
      return KeyCode.ShiftRight;
    case MacKeyCode.kVK_RightControl:
      return KeyCode.ControlRight;

    case MacKeyCode.kVK_RightArrow:
      return KeyCode.ArrowRight;
    case MacKeyCode.kVK_UpArrow:
      return KeyCode.ArrowUp;
    case MacKeyCode.kVK_LeftArrow:
      return KeyCode.ArrowLeft;
    case MacKeyCode.kVK_DownArrow:
      return KeyCode.ArrowDown;

    case MacKeyCode.kVK_Function:
      return KeyCode.Function;
    case MacKeyCode.kVK_ForwardDelete:
      return KeyCode.Delete;
    case MacKeyCode.kVK_Home:
      return KeyCode.Home;
    case MacKeyCode.kVK_End:
      return KeyCode.End;
    case MacKeyCode.kVK_PageUp:
      return KeyCode.PageUp;
    case MacKeyCode.kVK_PageDown:
      return KeyCode.PageDown;

    case MacKeyCode.kVK_ANSI_Grave:
      return KeyCode.Backquote;
    case MacKeyCode.kVK_CapsLock:
      return KeyCode.CapsLock;
    case MacKeyCode.kVK_Tab:
      return KeyCode.Tab;
    case MacKeyCode.kVK_Space:
      return KeyCode.Space;
    case MacKeyCode.kVK_Delete:
      return KeyCode.Backspace;
    case MacKeyCode.kVK_Return:
      return KeyCode.Enter;
    case MacKeyCode.kVK_Escape:
      return KeyCode.Escape;

    case MacKeyCode.kVK_ANSI_Backslash:
      return KeyCode.Backslash;
    case MacKeyCode.kVK_ANSI_Comma:
      return KeyCode.Comma;
    case MacKeyCode.kVK_ANSI_Equal:
      return KeyCode.Equal;
    case MacKeyCode.kVK_ANSI_LeftBracket:
      return KeyCode.BracketLeft;
    case MacKeyCode.kVK_ANSI_Minus:
      return KeyCode.Minus;
    case MacKeyCode.kVK_ANSI_Period:
      return KeyCode.Period;
    case MacKeyCode.kVK_ANSI_Quote:
      return KeyCode.Quote;
    case MacKeyCode.kVK_ANSI_RightBracket:
      return KeyCode.BracketRight;
    case MacKeyCode.kVK_ANSI_Semicolon:
      return KeyCode.Semicolon;
    case MacKeyCode.kVK_ANSI_Slash:
      return KeyCode.Slash;

    case MacKeyCode.kVK_ANSI_Keypad0:
      return KeyCode.Numpad0;
    case MacKeyCode.kVK_ANSI_Keypad1:
      return KeyCode.Numpad1;
    case MacKeyCode.kVK_ANSI_Keypad2:
      return KeyCode.Numpad2;
    case MacKeyCode.kVK_ANSI_Keypad3:
      return KeyCode.Numpad3;
    case MacKeyCode.kVK_ANSI_Keypad4:
      return KeyCode.Numpad4;
    case MacKeyCode.kVK_ANSI_Keypad5:
      return KeyCode.Numpad5;
    case MacKeyCode.kVK_ANSI_Keypad6:
      return KeyCode.Numpad6;
    case MacKeyCode.kVK_ANSI_Keypad7:
      return KeyCode.Numpad7;
    case MacKeyCode.kVK_ANSI_Keypad8:
      return KeyCode.Numpad8;
    case MacKeyCode.kVK_ANSI_Keypad9:
      return KeyCode.Numpad9;

    case MacKeyCode.kVK_ANSI_KeypadClear:
      return KeyCode.NumLock;
    case MacKeyCode.kVK_ANSI_KeypadDecimal:
      return KeyCode.NumpadDecimal;
    case MacKeyCode.kVK_ANSI_KeypadDivide:
      return KeyCode.NumpadDivide;
    case MacKeyCode.kVK_ANSI_KeypadEnter:
      return KeyCode.NumpadEnter;
    case MacKeyCode.kVK_ANSI_KeypadEquals:
      return KeyCode.NumpadEqual;
    case MacKeyCode.kVK_ANSI_KeypadMinus:
      return KeyCode.NumpadSubtract;
    case MacKeyCode.kVK_ANSI_KeypadMultiply:
      return KeyCode.NumpadMultiply;
    case MacKeyCode.kVK_ANSI_KeypadPlus:
      return KeyCode.NumpadAdd;
  }

  throw new Error(`MacKeyCode of ${code} not present in map, the Elm compiler would have protected us here...`);
}

export class MacOsKeyboard implements Keyboard {
  keyDown: Observable<KeyDownEvent>;
  keyUp: Observable<KeyUpEvent>;

  private readonly _keyDown = new Subject<KeyDownEvent>();
  private readonly _keyUp = new Subject<KeyUpEvent>();

  private readonly _handler;
  private _monitor = null;
  private _previous = null;

  constructor() {
    this.keyDown = this._keyDown;
    this.keyUp = this._keyUp;
    const _this = this;
    const func = function (self, event) {
      const eventType = event('type');

      if (eventType === $.NSEventTypeFlagsChanged) {
        flagsChangedFunc(self, event);
      } else if (eventType === $.NSEventTypeKeyDown) {
        keyDownFunc(self, event);
      } else if (eventType === $.NSEventTypeKeyUp) {
        keyUpFunc(self, event);
      }
    };

    // a modifier key up or down
    const flagsChangedFunc = function (self, event) {
      const keyCodeId = <number> event('keyCode');

      if (!(keyCodeId in MacKeyCode)) {
        console.log(`Unhandled NSEvent keyCode of ${keyCodeId}, ignoring event`);
        return;
      }

      const macCode = <MacKeyCode> keyCodeId;
      const modifierFlags = <MacModifierFlags> event('modifierFlags');

      let subject;
      switch (macCode) {
        case MacKeyCode.kVK_Command:
        case MacKeyCode.kVK_RightCommand:
          if (isCommandModifier(modifierFlags)) {
            subject = _this._keyDown;
          } else {
            subject = _this._keyUp;
          }
          break;
        case MacKeyCode.kVK_Shift:
        case MacKeyCode.kVK_RightShift:
          if (isShiftModifier(modifierFlags)) {
            subject = _this._keyDown;
          } else {
            subject = _this._keyUp;
          }
          break;
        case MacKeyCode.kVK_Control:
        case MacKeyCode.kVK_RightControl:
          if (isControlModifier(modifierFlags)) {
            subject = _this._keyDown;
          } else {
            subject = _this._keyUp;
          }
          break;
        case MacKeyCode.kVK_Option:
        case MacKeyCode.kVK_RightOption:
          if (isOptionModifier(modifierFlags)) {
            subject = _this._keyDown;
          } else {
            subject = _this._keyUp;
          }
          break;
        default:
          return;
      }

      const key = convertToKeyCode(<MacKeyCode> keyCodeId);
      const modifiers = convertToModifiers(modifierFlags);
      subject.next({key, modifiers});
    };

    const keyDownFunc = function (self, event) {
      if (event('isARepeat')) {
        return;
      }

      const modifierFlags = <MacModifierFlags> event('modifierFlags');
      const modifiers = convertToModifiers(modifierFlags);

      const keyCodeId = <number> event('keyCode');
      if (!(keyCodeId in MacKeyCode)) {
        console.log(`Unhandled NSEvent keyCode of ${keyCodeId}, ignoring event`);
        return;
      }

      const key: KeyCode = convertToKeyCode(<MacKeyCode> keyCodeId);

      _this._keyDown.next({key, modifiers})
    };

    const keyUpFunc = function (self, event) {
      const modifierFlags = <MacModifierFlags> event('modifierFlags');
      const modifiers = convertToModifiers(modifierFlags);

      const keyCodeId = <number> event('keyCode');
      if (!(keyCodeId in MacKeyCode)) {
        console.log(`Unhandled NSEvent keyCode of ${keyCodeId}, ignoring event`);
        return;
      }

      const key: KeyCode = convertToKeyCode(<MacKeyCode> keyCodeId);

      _this._keyUp.next({key, modifiers})
    };

    this._handler = $(func, [$.void, [$.id, $.id]]);
  }

  plugIn(): void {
    this._monitor = $.NSEvent('addLocalMonitorForEventsMatchingMask',
      ($.NSEventMaskFlagsChanged | $.NSEventMaskKeyUp | $.NSEventMaskKeyDown),
      'handler', this._handler);

    if (canDisableShortcuts()) {
      console.log('Enabling MacOS integrations');
      this._previous = disableShortcuts();
    }
  }

  unplug(): void {
    $.NSEvent('removeMonitor', this._monitor);

    if (this._previous) {
      console.log('Disabling MacOS integrations');
      restoreShortcuts(this._previous);
      this._previous = null;
    }
  }
}

export class MacOsSystemIntegrator implements SystemIntegrator {

  private static readonly POLL_INTERVAL = 100;

  readonly trust: Rx.Observable<boolean>;

  constructor() {
    this.trust = Rx.Observable.interval(MacOsSystemIntegrator.POLL_INTERVAL)
      .map(() => $.AXIsProcessTrusted())
      .distinctUntilChanged();
  }

  isTrusted(): boolean {
    return <boolean> $.AXIsProcessTrusted();
  }
}

export function deInit(): void {
  // pool('drain');
}

