// webcams.js - cámaras PeerJS para La Resistencia
const Cam = {
  stream: null, peer: null, calls: {}, names: {},
  async start() {
    const pedir = c => Promise.race([
      navigator.mediaDevices.getUserMedia(c),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))
    ]);
    const intentos = [{ video: { width: 320, height: 240 }, audio: true }, { audio: true }];
    for (const c of intentos) {
      try {
        this.stream = await pedir(c);
        this.add('yo', this.stream, 'TÚ', true);
        return true;
      } catch (e) { console.warn('getUserMedia falló:', e.message); }
    }
    this.add('yo', new MediaStream(), 'TÚ (sin cámara)', true);
    return false;
  },
  attach(peer) {
    this.peer = peer;
    peer.on('call', c => { c.answer(this.stream || new MediaStream()); this.wire(c); });
  },
  call(id) {
    if (this.calls[id] || !this.peer) return;
    this.wire(this.peer.call(id, this.stream || new MediaStream()));
  },
  wire(c) {
    this.calls[c.peer] = c;
    c.on('stream', s => this.add(c.peer, s, this.names[c.peer] || 'AGENTE'));
    c.on('close', () => { this.remove(c.peer); delete this.calls[c.peer]; });
  },
  card(key) { return document.getElementById('vc-' + key); },
  add(key, stream, label, mine) {
    let card = this.card(key);
    if (!card) {
      card = document.createElement('div');
      card.className = 'video-card'; card.id = 'vc-' + key;
      card.innerHTML = '<video autoplay playsinline></video><span class="video-tag"></span><span class="video-name"></span>';
      document.getElementById('video-grid').appendChild(card);
    }
    const v = card.querySelector('video');
    v.srcObject = stream; v.muted = !!mine;
    card.querySelector('.video-name').textContent = label;
  },
  label(key, text) { const c = this.card(key); if (c) c.querySelector('.video-name').textContent = text; },
  tag(key, text) { const c = this.card(key); if (c) c.querySelector('.video-tag').textContent = text; },
  remove(key) { const c = this.card(key); if (c) c.remove(); },
  mic(btn) { this.toggle('getAudioTracks', btn); },
  cam(btn) { this.toggle('getVideoTracks', btn); },
  toggle(fn, btn) {
    if (!this.stream) return;
    const t = this.stream[fn]()[0]; if (!t) return;
    t.enabled = !t.enabled; btn.classList.toggle('off', !t.enabled);
  }
};
