import Ionicons from '@expo/vector-icons/Ionicons';
import { createElement, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/healthclanDesign';
import type { TwilioVideoSession } from './TwilioVideoRoom';

declare global {
  interface Window {
    Twilio?: {
      Video?: {
        connect: (token: string, options: Record<string, unknown>) => Promise<any>;
      };
    };
  }
}

let twilioScriptPromise: Promise<void> | null = null;

function loadTwilioVideo() {
  if (window.Twilio?.Video) return Promise.resolve();

  if (!twilioScriptPromise) {
    twilioScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="twilio-video.min.js"]');

      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Unable to load secure video.')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.twilio.com/js/video/releases/2.31.0/twilio-video.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load secure video.'));
      document.body.appendChild(script);
    });
  }

  return twilioScriptPromise;
}

function clearNode(node: HTMLDivElement | null) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

function attachTrack(publication: any, container: HTMLDivElement | null, onVideoReady?: () => void) {
  const track = publication?.track || publication;
  if (!track?.attach || !container) return;
  const element = track.attach();
  element.setAttribute?.('playsinline', 'true');
  element.autoplay = true;
  element.playsInline = true;
  if (track.kind === 'audio') {
    element.style.display = 'none';
  } else {
    container.querySelectorAll('video').forEach(existing => existing.remove());
    element.style.position = 'absolute';
    element.style.inset = '0';
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.objectFit = 'cover';
    element.onloadeddata = onVideoReady;
    element.onplaying = onVideoReady;
    onVideoReady?.();
  }
  container.appendChild(element);
  const playResult = element.play?.();
  playResult?.catch?.(() => undefined);
}

function detachTrack(publication: any) {
  const track = publication?.track || publication;
  if (!track?.detach) return;
  track.detach().forEach((element: HTMLElement) => element.remove());
}

export function TwilioVideoRoom({ session, onLeave }: { session: TwilioVideoSession; onLeave: () => void }) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const remoteRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<any>(null);
  const [status, setStatus] = useState('Connecting video...');
  const [remoteCount, setRemoteCount] = useState(0);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    let active = true;

    function attachParticipant(participant: any) {
      if (!active) return;
      const attachRemote = (trackOrPublication: any) => attachTrack(trackOrPublication, remoteRef.current, () => setRemoteVideoReady(true));
      participant.tracks?.forEach((publication: any) => {
        if (publication.isSubscribed || publication.track) attachRemote(publication);
        publication.on?.('subscribed', attachRemote);
      });
      participant.on?.('trackSubscribed', attachRemote);
      participant.on?.('trackPublished', (publication: any) => {
        if (publication.track || publication.isSubscribed) attachRemote(publication);
        publication.on?.('subscribed', attachRemote);
      });
      participant.on?.('trackUnsubscribed', detachTrack);
      setRemoteCount(roomRef.current?.participants?.size || 1);
    }

    async function connect() {
      try {
        await loadTwilioVideo();
        if (!active || !window.Twilio?.Video) return;

        const room = await window.Twilio.Video.connect(session.token, {
          name: session.roomId,
          audio: true,
          video: true,
        });

        roomRef.current = room;
        setStatus('Connected');

        clearNode(localRef.current);
        room.localParticipant?.tracks?.forEach((publication: any) => attachTrack(publication, localRef.current));
        room.participants?.forEach(attachParticipant);

        room.on('participantConnected', attachParticipant);
        room.on('participantDisconnected', () => {
          clearNode(remoteRef.current);
          setRemoteVideoReady(false);
          setRemoteCount(Math.max(0, room.participants?.size || 0));
          room.participants?.forEach(attachParticipant);
        });
        room.on('disconnected', () => {
          setStatus('Disconnected');
          clearNode(localRef.current);
          clearNode(remoteRef.current);
          setRemoteVideoReady(false);
        });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to join video.');
      }
    }

    connect();

    return () => {
      active = false;
      roomRef.current?.localParticipant?.tracks?.forEach(detachTrack);
      roomRef.current?.disconnect?.();
      clearNode(localRef.current);
      clearNode(remoteRef.current);
      roomRef.current = null;
    };
  }, [session.roomId, session.token]);

  function leave() {
    roomRef.current?.disconnect?.();
    onLeave();
  }

  function setLocalTracksEnabled(kind: 'audio' | 'video', enabled: boolean) {
    const publications = kind === 'audio'
      ? roomRef.current?.localParticipant?.audioTracks
      : roomRef.current?.localParticipant?.videoTracks;

    publications?.forEach?.((publication: any) => {
      const track = publication.track;
      if (!track || track.kind !== kind) return;
      if (track.mediaStreamTrack) track.mediaStreamTrack.enabled = enabled;
      enabled ? track.enable?.() : track.disable?.();
    });

    roomRef.current?.localParticipant?.tracks?.forEach((publication: any) => {
      const track = publication.track;
      if (!track || track.kind !== kind) return;
      if (track.mediaStreamTrack) track.mediaStreamTrack.enabled = enabled;
      enabled ? track.enable?.() : track.disable?.();
    });
  }

  function toggleMuted() {
    setMuted((current) => {
      const next = !current;
      setLocalTracksEnabled('audio', !next);
      return next;
    });
  }

  function toggleCamera() {
    setCameraOff((current) => {
      const next = !current;
      setLocalTracksEnabled('video', !next);
      return next;
    });
  }

  function enterFullscreen() {
    const target = remoteRef.current?.parentElement as (HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    }) | null;
    const request = target?.requestFullscreen || target?.webkitRequestFullscreen || target?.msRequestFullscreen;
    request?.call(target);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>Live video visit</Text>
          <Text style={styles.status}>{status}{remoteCount > 0 ? ` - ${remoteCount} participant${remoteCount > 1 ? 's' : ''}` : ''}</Text>
        </View>
        <Pressable style={styles.leaveButton} onPress={leave}>
          <Text style={styles.leaveText}>Leave</Text>
        </Pressable>
      </View>
      <View style={styles.stage}>
        {createElement('div', { ref: remoteRef, style: remoteStyle })}
        <View style={styles.localTile}>
          {createElement('div', { ref: localRef, style: localStyle })}
        </View>
        {!remoteVideoReady ? (
          <View pointerEvents="none" style={styles.waiting}>
            <Text style={styles.waitingText}>Waiting for the other participant...</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.controls}>
        <Pressable style={[styles.controlButton, muted && styles.controlButtonActive]} onPress={toggleMuted}>
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={20} color={muted ? colors.white : colors.teal} />
          <Text style={[styles.controlText, muted && styles.controlTextActive]}>{muted ? 'Muted' : 'Mic'}</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, cameraOff && styles.controlButtonActive]} onPress={toggleCamera}>
          <Ionicons name={cameraOff ? 'videocam-off' : 'videocam'} size={20} color={cameraOff ? colors.white : colors.teal} />
          <Text style={[styles.controlText, cameraOff && styles.controlTextActive]}>{cameraOff ? 'Camera off' : 'Camera'}</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={enterFullscreen}>
          <Ionicons name="expand" size={20} color={colors.teal} />
          <Text style={styles.controlText}>Full</Text>
        </Pressable>
      </View>
    </View>
  );
}

const remoteStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 18,
  overflow: 'hidden',
  backgroundColor: '#085161',
  position: 'relative',
} as const;

const localStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#E2EAFF',
  position: 'relative',
} as const;

const styles = StyleSheet.create({
  wrap: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900' },
  status: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 3 },
  leaveButton: { minHeight: 40, borderRadius: 12, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  leaveText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  stage: { height: 360, borderRadius: 18, backgroundColor: colors.teal, overflow: 'hidden' },
  localTile: { position: 'absolute', right: 12, bottom: 12, width: 132, height: 96, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: colors.white, backgroundColor: colors.panel },
  waiting: { position: 'absolute', left: 16, right: 160, bottom: 16, minHeight: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  waitingText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 8 },
  controlButton: { flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: colors.panel, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  controlButtonActive: { backgroundColor: colors.teal },
  controlText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  controlTextActive: { color: colors.white },
});
