import {expect, use as chaiUse} from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import {
  DoubleClick, KeyDown, KeyUp, MouseButton, MouseDown, MouseMove, MouseUp, ScreenSize,
  Scroll,
} from '../src/peer-msgs';
import {KeyCode, ModifierCode} from '../src/domain/keyboard';

chaiUse(require('sinon-chai'));


describe('peer-msgs', () => {
  describe('MouseMove', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      MouseMove.send(peer, {x: 0.2, y: 0.66});

      expect(peer.send).to.have.been.calledWith('{"t":"mousemove","x":0.2,"y":0.66}');
    });

    it('has the correct type', () => {
      expect(MouseMove.type).to.equal('mousemove');
    });

    it('unpacks an object', () => {
      const result = MouseMove.unpack({x: 0.1, y: 0.99});

      expect(result).to.deep.equal({x: 0.1, y: 0.99});
    });
  });

  describe('MouseDown', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      MouseDown.send(peer, {x: 0.8, y: 0.4444, button: MouseButton.MIDDLE});

      expect(peer.send).to.have.been.calledWith('{"t":"mousedown","x":0.8,"y":0.4444,"b":"middle"}');
    });

    it('has the correct type', () => {
      expect(MouseDown.type).to.equal('mousedown');
    });

    it('unpacks an object', () => {
      const result = MouseDown.unpack({x: 0.1, y: 0.99, b: 'right'});

      expect(result).to.deep.equal({x: 0.1, y: 0.99, button: MouseButton.RIGHT});
    });
  });

  describe('MouseUp', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      MouseUp.send(peer, {x: 0.7, y: 0.333, button: MouseButton.LEFT});

      expect(peer.send).to.have.been.calledWith('{"t":"mouseup","x":0.7,"y":0.333,"b":"left"}');
    });

    it('has the correct type', () => {
      expect(MouseUp.type).to.equal('mouseup');
    });

    it('unpacks an object', () => {
      const result = MouseUp.unpack({x: 0.12, y: 0.9, b: 'left'});

      expect(result).to.deep.equal({x: 0.12, y: 0.9, button: MouseButton.LEFT});
    });
  });

  describe('DoubleClick', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      DoubleClick.send(peer, {x: 0.7, y: 0.333, button: MouseButton.LEFT});

      expect(peer.send).to.have.been.calledWith('{"t":"dblclk","x":0.7,"y":0.333,"b":"left"}');
    });

    it('has the correct type', () => {
      expect(DoubleClick.type).to.equal('dblclk');
    });

    it('unpacks an object', () => {
      const result = DoubleClick.unpack({x: 0.12, y: 0.9, b: 'left'});

      expect(result).to.deep.equal({x: 0.12, y: 0.9, button: MouseButton.LEFT});
    });
  });

  describe('Scroll', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      Scroll.send(peer, {deltaX: 1, deltaY: 32});

      expect(peer.send).to.have.been.calledWith('{"t":"scroll","x":1,"y":32}');
    });

    it('has the correct type', () => {
      expect(Scroll.type).to.equal('scroll');
    });

    it('unpacks an object', () => {
      const result = Scroll.unpack({x: 2, y: 10});

      expect(result).to.deep.equal({deltaX: 2, deltaY: 10});
    });
  });

  describe('KeyUp', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      KeyUp.send(peer, {code: KeyCode.Tab, modifiers: [ModifierCode.MetaLeft]});

      expect(peer.send).to.have.been.calledWith('{"t":"keyup","code":"Tab","modifiers":["MetaLeft"]}');
    });

    it('has the correct type', () => {
      expect(KeyUp.type).to.equal('keyup');
    });

    it('unpacks an object', () => {
      const result = KeyUp.unpack({code: 'KeyS', modifiers: ['ShiftRight']});

      expect(result).to.deep.equal({code: KeyCode.KeyS, modifiers: [ModifierCode.ShiftRight]});
    });
  });

  describe('KeyDown', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      KeyDown.send(peer, {code: KeyCode.Tab, modifiers: [ModifierCode.MetaLeft]});

      expect(peer.send).to.have.been.calledWith('{"t":"keydown","code":"Tab","modifiers":["MetaLeft"]}');
    });

    it('has the correct type', () => {
      expect(KeyDown.type).to.equal('keydown');
    });

    it('unpacks an object', () => {
      const result = KeyDown.unpack({code: 'Backspace', modifiers: ['ControlLeft', 'AltLeft']});

      expect(result).to.deep.equal({
        code: KeyCode.Backspace,
        modifiers: [ModifierCode.ControlLeft, ModifierCode.AltLeft]
      });
    });
  });

  describe('ScreenSize', () => {
    it('sends the expected JSON message', () => {
      const peer = {send: sinon.stub()};

      ScreenSize.send(peer, {height: 640, width: 480});

      expect(peer.send).to.have.been.calledWith('{"t":"screensize","h":640,"w":480}');
    });

    it('has the correct type', () => {
      expect(ScreenSize.type).to.equal('screensize');
    });

    it('unpacks an object', () => {
      const result = ScreenSize.unpack({h: 1, w: 666});

      expect(result).to.deep.equal({height: 1, width: 666});
    });
  });
});
