const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const file = process.argv[2] || (fs.existsSync(path.join(__dirname, '../src/components/TwilioVideoRoom.native.tsx')) ? '../src/components/TwilioVideoRoom.native.tsx' : '../src/app/(app)/video-room.tsx');
const source = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
const script = source.split('  <script>')[1].split('  </script>')[0]
  .replace(/\$\{JSON.stringify\(session\.(token|roomId)\)\}/g, '"test"')
  .replace('    start();', '    window.testStart = start;');
function setup() {
  const element = () => ({ style: {}, classList: { toggle() {} }, setAttribute() {}, addEventListener() {}, appendChild() {}, querySelectorAll: () => [], readyState: 3, play: () => Promise.resolve() });
  const media = { readyState: 'live', muted: false, enabled: true, stop() { this.readyState = 'ended'; } };
  const stream = { getTracks: () => [media], getVideoTracks: () => [media], getAudioTracks: () => [], removeTrack() {}, addTrack() {} };
  let resolveMedia;
  const window = { addEventListener() {}, ReactNativeWebView: { postMessage() {} }, Twilio: { Video: {} } };
  const context = vm.createContext({ window, navigator: { mediaDevices: { getUserMedia: () => new Promise(resolve => { resolveMedia = resolve; }) } }, document: { hidden: false, getElementById: element, createElement: element, querySelectorAll: () => [], addEventListener() {} }, setTimeout, clearTimeout, Map, Set, console });
  vm.runInContext(script, context);
  return { window, context, media, stream, resolve: () => resolveMedia(stream) };
}
(async () => {
  const cancelled = setup();
  const pending = cancelled.window.testStart();
  cancelled.window.healthclanDisconnect();
  cancelled.resolve();
  await pending;
  assert.equal(cancelled.media.readyState, 'ended', 'late camera acquisition must be released');
  const failed = setup();
  failed.window.Twilio.Video.LocalVideoTrack = function(media) { this.stop = () => media.stop(); };
  failed.window.Twilio.Video.connect = async () => { throw new Error('connection failed'); };
  const connecting = failed.window.testStart(); failed.resolve(); await connecting;
  assert.equal(failed.media.readyState, 'ended', 'failed join must release camera');
  const recovery = setup();
  let attempts = 0;
  recovery.window.Twilio.Video.createLocalVideoTrack = async () => { attempts++; return { mediaStreamTrack: {}, stop() {}, enable() {}, attach: () => ({setAttribute(){},style:{},addEventListener(){}}) }; };
  vm.runInContext(`localVideoTrack = { mediaStreamTrack: { readyState: 'ended' }, stop() {} }; activeRoom = { localParticipant: { unpublishTrack() {}, publishTrack: async () => {} } }; ${source.includes('let localMediaStream;') ? 'localMediaStream' : 'localStream'} = { getVideoTracks: () => [], addTrack() {} };`, recovery.context);
  await Promise.all([recovery.window.healthclanResumeVideo(), recovery.window.healthclanResumeVideo()]);
  assert.equal(attempts, 1, 'concurrent resume events must acquire only one camera');
  console.log('PASS: cancelled acquisition, failed join cleanup, single camera recovery');
})().catch(error => { console.error(error); process.exitCode = 1; });
