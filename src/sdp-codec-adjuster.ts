export function preferVP8WithBoostedBitrate(sdp: string): string {
  return sdp
    .replace(
      'a=rtcp-fb:96 transport-cc',
      'a=rtcp-fb:96 transport-cc\r\na=fmtp:96 x-google-min-bitrate=50;x-google-max-bitrate=8000;x-google-start-bitrate=1000;'
    )
    // .replace('\r\na=rtcp-fb:96 ccm fir', '')
    // .replace('\r\na=rtcp-fb:96 nack', '')
    // .replace('\r\na=rtcp-fb:96 nack pli', '')
    // .replace('\r\na=rtcp-fb:96 goog-remb', '')
    .replace('\r\na=rtcp-fb:96 transport-cc', '')
    // .replace('\r\na=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01', '')
    // .replace('\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay', '')
    ;
}

export function preferH264(sdp: string): string {
  if (sdp.indexOf('SAVPF 96 98 100') >= 0) {
    return sdp
      .replace('SAVPF 96 98 100', 'SAVPF 100 98 96')
      // .replace('profile-level-id=42e01f', 'profile-level-id=64001f')
      .replace('profile-level-id=42e01f', 'profile-level-id=42e034')
      // .replace('profile-level-id=42e01f', 'profile-level-id=42a01f')
      ;
  }

  return sdp;
}

export function preferVP9(sdp: string): string {
  return sdp
    .replace('SAVPF 96 98 100', 'SAVPF 98 96 100')
    .replace('a=rtcp-fb:98 transport-cc', 'a=rtcp-fb:98 transport-cc\r\na=fmtp:98 max-fr=60; max-fs=7200;');
}
