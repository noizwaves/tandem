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
export function disableShortcuts():void {
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

export function deInit(): void {
  exports.restoreShortcuts();
  pool('drain');
}
