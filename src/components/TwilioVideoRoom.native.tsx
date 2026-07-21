import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../constants/healthclanDesign';
import type { TwilioVideoSession } from './TwilioVideoRoom';

const VIDEO_SDK_URL = 'https://sdk.twilio.com/js/video/releases/2.30.0/twilio-video.min.js';

function videoRoomErrorMessage(message?: string) {
  const value = String(message || '').trim();
  if (/authorization|token|jwt/i.test(value)) {
    return 'Video authorization failed. Please try again shortly while HealthClan refreshes the video room.';
  }
  return value || 'Unable to open secure video room.';
}

function videoRoomHtml(session: TwilioVideoSession) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
  <style>
    html, body, #room { margin: 0; width: 100%; height: 100%; background: #0b2026; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    #room { position: relative; display: flex; align-items: center; justify-content: center; color: white; }
    #remote { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #0b2026; }
    #local { position: absolute; right: 12px; bottom: 76px; width: 35%; max-width: 150px; height: 27%; min-height: 92px; border: 2px solid white; border-radius: 14px; overflow: hidden; background: #173a42; z-index: 2; }
    #status { position: absolute; top: 14px; left: 14px; right: 14px; z-index: 3; color: rgba(255,255,255,.9); font-size: 13px; font-weight: 800; text-align: center; }
    #controls { position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 4; display: flex; align-items: center; justify-content: center; gap: 8px; pointer-events: auto; }
    button { appearance: none; -webkit-appearance: none; }
    .control { min-width: 54px; min-height: 48px; border: 0; border-radius: 18px; background: rgba(255,255,255,.94); color: #085161; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 28px rgba(0,0,0,.24); }
    .control.active { background: #085161; color: white; }
    .control.end { background: #e94d5f; color: white; }
    .control svg { width: 23px; height: 23px; stroke: currentColor; stroke-width: 2.4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    video { width: 100%; height: 100%; object-fit: cover; }
  </style>
  <script src="${VIDEO_SDK_URL}"></script>
</head>
<body>
  <div id="room">
    <div id="remote"></div>
    <div id="local"></div>
    <div id="status">Opening secure video room...</div>
    <div id="controls">
      <button id="micButton" class="control" type="button" aria-label="Mute microphone"></button>
      <button id="cameraButton" class="control" type="button" aria-label="Turn camera off"></button>
      <button id="fullButton" class="control" type="button" aria-label="Fullscreen"></button>
      <button id="leaveButton" class="control end" type="button" aria-label="Leave call"></button>
    </div>
  </div>
  <script>
    const token = ${JSON.stringify(session.token)};
    const roomName = ${JSON.stringify(session.roomId)};
    const status = document.getElementById('status');
    const local = document.getElementById('local');
    const remote = document.getElementById('remote');
    const micButton = document.getElementById('micButton');
    const cameraButton = document.getElementById('cameraButton');
    const fullButton = document.getElementById('fullButton');
    const leaveButton = document.getElementById('leaveButton');
    let activeRoom;
    let localAudioTrack;
    let localVideoTrack;
    let localMediaStream;
    let audioEnabled = true;
    let videoEnabled = true;
    let fullscreenEnabled = false;
    const attachedElements = new Map();
    const playbackTimers = new Set();

    const icons = {
      mic: '<svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>',
      micOff: '<svg viewBox="0 0 24 24"><path d="m2 2 20 20"/><path d="M9 9v3a3 3 0 0 0 5 2.2"/><path d="M15 9.3V6a3 3 0 0 0-5.1-2.1"/><path d="M19 10v2a7 7 0 0 1-.7 3"/><path d="M5 10v2a7 7 0 0 0 7 7"/><path d="M12 19v3"/></svg>',
      camera: '<svg viewBox="0 0 24 24"><path d="M15 10l5-3v10l-5-3Z"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>',
      cameraOff: '<svg viewBox="0 0 24 24"><path d="m2 2 20 20"/><path d="M11 6h4v4"/><path d="M15 14v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h2"/><path d="m20 7-3 1.8"/><path d="M20 17v-5"/></svg>',
      expand: '<svg viewBox="0 0 24 24"><path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M16 21h5v-5"/></svg>',
      minimize: '<svg viewBox="0 0 24 24"><path d="M8 3v5H3"/><path d="M16 3v5h5"/><path d="M8 21v-5H3"/><path d="M16 21v-5h5"/></svg>',
      leave: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
    };

    function setButtonIcons() {
      micButton.innerHTML = audioEnabled ? icons.mic : icons.micOff;
      cameraButton.innerHTML = videoEnabled ? icons.camera : icons.cameraOff;
      fullButton.innerHTML = fullscreenEnabled ? icons.minimize : icons.expand;
      leaveButton.innerHTML = icons.leave;
    }

    function send(type, payload) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
    }

    function clearContainer(container) {
      while (container && container.firstChild) container.removeChild(container.firstChild);
    }

    function setStatus(text) {
      status.textContent = text;
    }

    function trackKey(track) {
      return track.sid || (track.mediaStreamTrack && track.mediaStreamTrack.id) || track.name || track.kind;
    }

    function ensurePlayback(element, attempts = 8) {
      if (!element || typeof element.play !== 'function') return;
      const play = () => {
        const result = element.play();
        if (result && result.catch && attempts > 0) {
          result.catch(() => {
            const timer = setTimeout(() => {
              playbackTimers.delete(timer);
              ensurePlayback(element, attempts - 1);
            }, 350);
            playbackTimers.add(timer);
          });
        }
      };
      if (element.readyState >= 2) play();
      else element.addEventListener('canplay', play, { once: true });
    }

    function prepareVideoElement(element, muted) {
      element.setAttribute('playsinline', 'true');
      element.setAttribute('webkit-playsinline', 'true');
      element.autoplay = true;
      element.playsInline = true;
      element.muted = Boolean(muted);
      element.onloadedmetadata = () => ensurePlayback(element);
      element.oncanplay = () => ensurePlayback(element);
      element.onpause = () => {
        if (!document.hidden && element.isConnected) ensurePlayback(element, 3);
      };
    }

    function attachRemoteTrack(track) {
      if (!track || !track.attach) return;
      const key = trackKey(track);
      const previous = attachedElements.get(key);
      if (previous && previous.isConnected) {
        ensurePlayback(previous);
        return;
      }
      const element = track.attach();
      attachedElements.set(key, element);
      if (track.kind === 'audio') {
        element.autoplay = true;
        element.style.display = 'none';
      } else {
        prepareVideoElement(element, false);
        remote.querySelectorAll('video').forEach(existing => existing.remove());
        element.style.position = 'absolute';
        element.style.inset = '0';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.objectFit = 'cover';
      }
      remote.appendChild(element);
      ensurePlayback(element);
      track.on && track.on('started', () => ensurePlayback(element));
      track.on && track.on('switchedOn', () => ensurePlayback(element));
      track.on && track.on('enabled', () => ensurePlayback(element));
    }

    function attachLocalStream(stream) {
      clearContainer(local);
      const element = document.createElement('video');
      prepareVideoElement(element, true);
      element.srcObject = stream;
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'cover';
      element.onloadedmetadata = () => send('local-video-ready');
      element.oncanplay = () => send('local-video-ready');
      element.onplaying = () => send('local-video-ready');
      local.appendChild(element);
      ensurePlayback(element);
    }

    async function getStableLocalMedia() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera tools are not available in this app view.');
      }

      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 20, max: 24 },
            facingMode: 'user'
          }
        });
      } catch (error) {
        send('camera-preview-waiting');
      }

      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (error) {
        send('camera-preview-waiting');
      }

      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
    }

    function detachTrack(track) {
      if (!track || !track.detach) return;
      attachedElements.delete(trackKey(track));
      track.detach().forEach(element => element.remove());
    }

    function attachParticipant(participant) {
      participant.tracks.forEach(publication => publication.track && attachRemoteTrack(publication.track));
      participant.on('trackSubscribed', attachRemoteTrack);
      participant.on('trackPublished', publication => {
        if (publication.track) attachRemoteTrack(publication.track);
        publication.on && publication.on('subscribed', attachRemoteTrack);
      });
      participant.on('trackUnsubscribed', detachTrack);
      participant.on('trackUnpublished', publication => publication.track && detachTrack(publication.track));
    }

    function applyPublishedTrackState(kind, enabled) {
      if (!activeRoom || !activeRoom.localParticipant) return;
      const publications = kind === 'audio' ? activeRoom.localParticipant.audioTracks : activeRoom.localParticipant.videoTracks;
      publications && publications.forEach(publication => {
        const track = publication.track;
        if (!track) return;
        if (track.mediaStreamTrack) track.mediaStreamTrack.enabled = enabled;
        enabled ? track.enable() : track.disable();
      });
    }

    function setTrackEnabled(kind, enabled) {
      if (localMediaStream) {
        const mediaTracks = kind === 'audio' ? localMediaStream.getAudioTracks() : localMediaStream.getVideoTracks();
        mediaTracks.forEach(track => { track.enabled = enabled; });
      }

      const twilioTrack = kind === 'audio' ? localAudioTrack : localVideoTrack;
      if (twilioTrack) {
        if (twilioTrack.mediaStreamTrack) twilioTrack.mediaStreamTrack.enabled = enabled;
        enabled ? twilioTrack.enable() : twilioTrack.disable();
      }
      applyPublishedTrackState(kind, enabled);

      if (kind === 'audio') {
        audioEnabled = enabled;
        micButton.classList.toggle('active', !enabled);
        micButton.setAttribute('aria-label', enabled ? 'Mute microphone' : 'Unmute microphone');
      } else {
        videoEnabled = enabled;
        cameraButton.classList.toggle('active', !enabled);
        cameraButton.setAttribute('aria-label', enabled ? 'Turn camera off' : 'Turn camera on');
      }

      setButtonIcons();
      send(kind === 'audio' ? 'audio-state' : 'video-state', enabled);
    }

    function isFullscreen() {
      return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    }

    function toggleFullscreen() {
      if (isFullscreen()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exit) {
          exit.call(document);
          fullscreenEnabled = false;
          setButtonIcons();
          send('fullscreen-state', false);
        } else {
          send('fullscreen-error', 'Fullscreen minimize is not supported in this app view.');
        }
      } else {
        const request = room.requestFullscreen || room.webkitRequestFullscreen || room.msRequestFullscreen;
        if (request) {
          request.call(room);
          fullscreenEnabled = true;
          setButtonIcons();
          send('fullscreen-state', true);
        } else {
          send('fullscreen-error', 'Fullscreen is not supported in this app view.');
        }
      }
    }

    function disconnect() {
      if (activeRoom) activeRoom.disconnect();
      if (localAudioTrack) localAudioTrack.stop();
      if (localVideoTrack) localVideoTrack.stop();
      if (localMediaStream) localMediaStream.getTracks().forEach(track => track.stop());
      playbackTimers.forEach(timer => clearTimeout(timer));
      playbackTimers.clear();
      attachedElements.clear();
      clearContainer(local);
      clearContainer(remote);
    }

    window.healthclanDisconnect = disconnect;
    window.healthclanResumeVideo = () => {
      document.querySelectorAll('video').forEach(element => ensurePlayback(element));
      if (localVideoTrack && localVideoTrack.mediaStreamTrack && localVideoTrack.mediaStreamTrack.readyState === 'ended') {
        send('camera-ended');
      }
    };

    micButton.addEventListener('click', event => {
      event.preventDefault();
      setTrackEnabled('audio', !audioEnabled);
    });
    cameraButton.addEventListener('click', event => {
      event.preventDefault();
      setTrackEnabled('video', !videoEnabled);
    });
    fullButton.addEventListener('click', event => {
      event.preventDefault();
      toggleFullscreen();
    });
    leaveButton.addEventListener('click', event => {
      event.preventDefault();
      disconnect();
      send('leave-requested');
    });

    async function start() {
      try {
        if (!window.Twilio || !window.Twilio.Video) throw new Error('Video tools could not load.');
        setStatus('Starting camera...');
        localMediaStream = await getStableLocalMedia();
        attachLocalStream(localMediaStream);
        const audioTrack = localMediaStream.getAudioTracks()[0];
        const videoTrack = localMediaStream.getVideoTracks()[0];
        if (!videoTrack) throw new Error('Camera did not start. Please allow camera access and try again.');
        if (audioTrack) {
          localAudioTrack = new window.Twilio.Video.LocalAudioTrack(audioTrack);
        } else {
          send('audio-unavailable');
        }
        localVideoTrack = new window.Twilio.Video.LocalVideoTrack(videoTrack);
        setStatus('Joining video room...');
        activeRoom = await window.Twilio.Video.connect(token, {
          name: roomName,
          tracks: [localAudioTrack, localVideoTrack].filter(Boolean)
        });
        activeRoom.participants.forEach(attachParticipant);
        activeRoom.on('participantConnected', attachParticipant);
        activeRoom.on('participantDisconnected', participant => {
          participant.tracks.forEach(publication => publication.track && detachTrack(publication.track));
        });
        activeRoom.on('disconnected', () => {
          disconnect();
          send('disconnected');
        });
        setStatus('Connected');
        setTimeout(() => { status.style.display = 'none'; }, 1400);
        send('connected');
      } catch (error) {
        setStatus(error.message || 'Unable to open secure video room.');
        send('error', status.textContent);
      }
    }

    window.addEventListener('beforeunload', disconnect);
    document.addEventListener('fullscreenchange', () => {
      fullscreenEnabled = Boolean(isFullscreen());
      setButtonIcons();
      send('fullscreen-state', fullscreenEnabled);
    });
    document.addEventListener('webkitfullscreenchange', () => {
      fullscreenEnabled = Boolean(isFullscreen());
      setButtonIcons();
      send('fullscreen-state', fullscreenEnabled);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) window.healthclanResumeVideo();
    });
    window.addEventListener('focus', () => window.healthclanResumeVideo());
    window.addEventListener('pageshow', () => window.healthclanResumeVideo());
    document.addEventListener('touchstart', () => window.healthclanResumeVideo(), { passive: true });
    setButtonIcons();
    start();
  </script>
</body>
</html>`;
}

export function TwilioVideoRoom({ session, onLeave }: { session: TwilioVideoSession; onLeave: () => void }) {
  const webViewRef = useRef<WebView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('Checking camera and microphone permissions...');
  const [fullscreenMessage, setFullscreenMessage] = useState('');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        webViewRef.current?.injectJavaScript('window.healthclanResumeVideo && window.healthclanResumeVideo(); true;');
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;

    async function requestMediaPermissions() {
      const cameraStatus = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
      const microphoneStatus = microphonePermission?.granted ? microphonePermission : await requestMicrophonePermission();

      if (!active) return;

      if (!cameraStatus.granted || !microphoneStatus.granted) {
        setLoading(false);
        setMessage('Camera and microphone access are required before joining the video visit.');
        return;
      }

      setMessage('Opening secure video room...');
    }

    requestMediaPermissions().catch(() => {
      if (!active) return;
      setLoading(false);
      setMessage('Unable to request camera and microphone permissions. Please check app settings.');
    });

    return () => {
      active = false;
    };
  }, [cameraPermission, microphonePermission, requestCameraPermission, requestMicrophonePermission]);

  const hasPermissions = Boolean(cameraPermission?.granted && microphonePermission?.granted);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.statusCopy}>
          <Text style={styles.title}>Live video visit</Text>
          <Text style={styles.copy}>{message}</Text>
        </View>
        <Pressable style={styles.leaveButton} onPress={onLeave}>
          <Text style={styles.leaveText}>Leave</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        {hasPermissions ? (
          <WebView
            ref={webViewRef}
            source={{ html: videoRoomHtml(session), baseUrl: 'https://user.healthclan.local' }}
            style={styles.webRoom}
            containerStyle={styles.webRoomContainer}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            cacheEnabled={false}
            incognito
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            allowsFullscreenVideo
            onLoadStart={() => {
              setLoading(true);
              setConnected(false);
              setMessage('Opening secure video room...');
            }}
            onLoadEnd={() => setLoading(false)}
            onError={event => {
              const nextMessage = event.nativeEvent.description || 'Unable to load the in-app video room.';
              setLoading(false);
              setConnected(false);
              setMessage(nextMessage);
            }}
            onHttpError={event => {
              const nextMessage = `Video room failed to load (${event.nativeEvent.statusCode}).`;
              setLoading(false);
              setConnected(false);
              setMessage(nextMessage);
            }}
            onMessage={event => {
              try {
                const payload = JSON.parse(event.nativeEvent.data || '{}');
                if (payload.type === 'connected') {
                  setLoading(false);
                  setConnected(true);
                  setMessage('Secure video room connected.');
                }
                if (payload.type === 'local-video-ready') {
                  setLoading(false);
                  setConnected(true);
                  setMessage('Camera connected.');
                }
                if (payload.type === 'camera-preview-waiting') {
                  setLoading(false);
                  setMessage('Video room connected. Camera preview is still starting.');
                }
                if (payload.type === 'camera-ended') {
                  setMessage('Camera was interrupted. Leave and rejoin the visit to restart it.');
                }
                if (payload.type === 'audio-unavailable') {
                  setMessage('Camera started. Microphone is unavailable, so this visit opened with video only.');
                }
                if (payload.type === 'audio-state') {
                  setMessage(payload.payload ? 'Microphone on.' : 'Microphone muted.');
                }
                if (payload.type === 'video-state') {
                  setMessage(payload.payload ? 'Camera on.' : 'Camera off.');
                }
                if (payload.type === 'fullscreen-state') {
                  setFullscreenMessage('');
                }
                if (payload.type === 'fullscreen-error') {
                  setFullscreenMessage(videoRoomErrorMessage(payload.payload));
                }
                if (payload.type === 'disconnected') {
                  setConnected(false);
                  setMessage('Video visit ended.');
                }
                if (payload.type === 'leave-requested') {
                  onLeave();
                }
                if (payload.type === 'error') {
                  setLoading(false);
                  setConnected(false);
                  setMessage(videoRoomErrorMessage(payload.payload));
                }
              } catch {
                return;
              }
            }}
          />
        ) : (
          <View style={styles.permissionPanel}>
            <Text style={styles.permissionIcon}>📹</Text>
            <Text style={styles.permissionTitle}>Camera and microphone required</Text>
            <Text style={styles.permissionCopy}>Allow both permissions to join this HealthClan video visit.</Text>
            <Pressable
              style={styles.permissionButton}
              onPress={async () => {
                await requestCameraPermission();
                await requestMicrophonePermission();
              }}
            >
              <Text style={styles.permissionText}>Allow access</Text>
            </Pressable>
          </View>
        )}

        {(loading || (!connected && hasPermissions)) ? (
          <View pointerEvents="none" style={styles.overlay}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.overlayIcon}>📹</Text>}
            <Text style={styles.overlayText}>{loading ? 'Opening video room...' : message}</Text>
          </View>
        ) : null}
      </View>

      {!!fullscreenMessage && <Text style={styles.inlineNotice}>{fullscreenMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusCopy: { flex: 1, minWidth: 0 },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  copy: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: 2 },
  leaveButton: { minHeight: 42, borderRadius: 12, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  leaveText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  stage: { height: 500, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0B2026', position: 'relative' },
  webRoomContainer: { width: '100%', height: '100%', backgroundColor: '#0B2026' },
  webRoom: { width: '100%', height: '100%', backgroundColor: '#0B2026' },
  permissionPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionIcon: { color: colors.white, fontSize: 38 },
  permissionTitle: { color: colors.white, fontFamily: 'Poppins', fontSize: 17, lineHeight: 23, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  permissionCopy: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  permissionButton: { minHeight: 44, borderRadius: 999, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 16 },
  permissionText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  overlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,32,38,0.72)', padding: 18 },
  overlayIcon: { color: colors.white, fontSize: 32 },
  overlayText: { color: colors.white, fontFamily: 'Poppins', fontSize: 14, lineHeight: 20, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  inlineNotice: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
});
