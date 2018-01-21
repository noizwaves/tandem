import {desktopCapturer, ipcRenderer as ipc} from 'electron';

import * as DisplayChampionIPC from './displaychampion.ipc';

import {getLogger} from './logging';
import {HostPeer} from './peer/host-peer';
import {JoinPeer} from './peer/join-peer';
import {OptimalDetectorFactory} from './platform/optimal-detector-factory';
import {RobotActuatorFactory} from './platform/robot-actuator-factory';

const logger = getLogger();


function getScreenStream(): Promise<any> {
  return new Promise(((resolve, reject) => {
    desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
      logger.info(`[DisplayChampion] desktopCapture found ${sources.length} screen(s)`);

      if (sources.length === 0) {
        logger.error('[DisplayChampion] No screens found for sharing!');
      }

      const screenSource = sources[0];

      const video: MediaTrackConstraints = <MediaTrackConstraints> (<any> {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenSource.id,
          minWidth: screen.width,
          maxWidth: screen.width,
          minHeight: screen.height,
          maxHeight: screen.height,
          minFrameRate: 30
        }
      });
      navigator.mediaDevices.getUserMedia(
        {
          audio: false,
          video: video
        })
        .then(function (stream) {
          resolve(stream);
        })
        .catch(function (err) {
          logger.error(`getUserMedia: ${err}`);
          reject();
        });
    });
  }));
}

function show(selector) {
  document.querySelector(selector).classList.remove('hidden');
}


let iceServers = null;
DisplayChampionIPC.ReadyToHost.on(ipc, (hostIceServers) => {
  iceServers = hostIceServers;
});
DisplayChampionIPC.ReadyToJoin.on(ipc, (clientIceServers) => {
  iceServers = clientIceServers;
});

let hostPeer: HostPeer;
DisplayChampionIPC.RequestOffer.on(ipc, async () => {
  const screenStream = await getScreenStream();
  const actuatorFactory = new RobotActuatorFactory();

  hostPeer = new HostPeer(iceServers, screenStream, actuatorFactory);

  hostPeer.offer.subscribe(offer => {
    const encodedOffer = JSON.stringify(offer);
    DisplayChampionIPC.ReceiveOffer.send(ipc, encodedOffer);
  });

  hostPeer.connected.subscribe(connected => {
    DisplayChampionIPC.ConnectionStateChanged.send(ipc, connected);
  });

  hostPeer.stats.subscribe(stats => {
    DisplayChampionIPC.ConnectionStats.send(ipc, stats);
  });
});

let joinPeer: JoinPeer;
DisplayChampionIPC.RequestAnswer.on(ipc, offer => {
  show('#remote-screen');
  const remoteScreen = <HTMLMediaElement> document.querySelector('#remote-screen');

  const detectorFactory = new OptimalDetectorFactory(externalKeyboardDetected, ipc, window, remoteScreen);
  joinPeer = new JoinPeer(iceServers, remoteScreen, detectorFactory);

  joinPeer.answer.subscribe(data => {
    const answer = JSON.stringify(data);
    DisplayChampionIPC.ReceiveAnswer.send(ipc, answer);
  });

  joinPeer.connected.subscribe(connected => {
    DisplayChampionIPC.ConnectionStateChanged.send(ipc, connected);
  });

  joinPeer.screenSize.subscribe(({height, width}) => {
    DisplayChampionIPC.ScreenSize.send(ipc, {height, width});
  });

  joinPeer.acceptOffer(JSON.parse(offer));

  DisplayChampionIPC.CloseSession.on(ipc, () => {
    joinPeer.disconnect();
  });

  joinPeer.stats.subscribe(stats => {
    DisplayChampionIPC.ConnectionStats.send(ipc, stats);
  });
});
DisplayChampionIPC.GiveAnswer.on(ipc, answer => {
  hostPeer.acceptAnswer(JSON.parse(answer));
});

let externalKeyboardDetected = false;
DisplayChampionIPC.ExternalKeyboardResponse.on(ipc, result => externalKeyboardDetected = result);
// TODO: replace 'request' with "window.webContents.once('dom-ready', () => { ... }"
DisplayChampionIPC.ExternalKeyboardRequest.send(ipc);

// handle full screening
DisplayChampionIPC.EnterFullScreen.on(ipc, ({height, width}) => {
  const remoteScreen = <HTMLMediaElement> document.querySelector('#remote-screen');
  remoteScreen.style['max-width'] = `${width}px`;
  remoteScreen.style['max-height'] = `${height}px`;
});

DisplayChampionIPC.LeaveFullScreen.on(ipc, () => {
  const remoteScreen = <HTMLMediaElement> document.querySelector('#remote-screen');
  remoteScreen.style['max-width'] = null;
  remoteScreen.style['max-height'] = null;
});
