import React, { useEffect, useRef, useState, useCallback } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { socketService } from '../../services/socketService';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Phone,
  Monitor, MonitorOff, MessageSquare, Users, Maximize2, Minimize2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { appointmentApi } from '../../api';
import type { Appointment } from '../../types';
import styles from './VideoPage.module.scss';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

type CallState = 'idle' | 'calling' | 'incoming' | 'connected';

const VideoPage: React.FC = () => {
  const { user } = useAuthStore();

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteIdRef    = useRef<string | null>(null);
  const isCallerRef    = useRef<boolean>(false); // true = we initiated the call
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  const [callState, setCallState]         = useState<CallState>('idle');
  const [micOn,  setMicOn]                = useState(true);
  const [camOn,  setCamOn]                = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [fullscreen, setFullscreen]       = useState(false);
  const [callDuration, setCallDuration]   = useState(0);
  const [incomingFrom, setIncomingFrom]   = useState<{ name: string; userId: string } | null>(null);
  const [appointments, setAppointments]   = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt]   = useState<Appointment | null>(null);
  const [chatOpen, setChatOpen]           = useState(false);
  const [chatMsg, setChatMsg]             = useState('');
  const [chatLog, setChatLog]             = useState<{ from: string; text: string; time: string }[]>([]);
  const [callError, setCallError]         = useState<string | null>(null);

  useEffect(() => {
    // Pull every upcoming-ish appointment and filter to video calls.
    // We deliberately don't pass a `status` filter — newly booked
    // appointments are `pending` and the doctor hasn't confirmed them yet,
    // but the patient still wants to see them listed here.
    appointmentApi.getMy()
      .then(r => setAppointments(
        r.data.data.filter((a: Appointment) =>
          a.type === 'video' &&
          ['pending', 'confirmed', 'in_progress'].includes(a.status)
        )
      ))
      .catch(() => {});
  }, []);

  const getLocalStream = async (): Promise<MediaStream> => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const stopLocalStream = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const createPC = (remoteUserId: string): RTCPeerConnection => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    remoteIdRef.current = remoteUserId;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    }

    pc.ontrack = e => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = e => {
      if (e.candidate && remoteIdRef.current) {
        socketService.emit('video:ice-candidate', { to: remoteIdRef.current, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connectionState:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        setCallError(null);
        if (!timerRef.current) {
          timerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
        }
      }
      if (['disconnected', 'failed'].includes(pc.connectionState)) {
        setCallError('La conexión se interrumpió');
        doEndCall();
      }
    };

    return pc;
  };

  const doEndCall = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    stopLocalStream();
    setCallState('idle');
    setIncomingFrom(null);
    setSelectedAppt(null);
    setCallDuration(0);
    setChatLog([]);
    setChatOpen(false);
    setMicOn(true);
    setCamOn(true);
    setScreenSharing(false);
    remoteIdRef.current = null;
    isCallerRef.current = false;
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    socketService.connect(user._id);

    const onIncomingCall = (data: { from: string; fromName: string }) => {
      if (callState !== 'idle') return;
      setIncomingFrom({ name: data.fromName, userId: data.from });
      setCallState('incoming');
    };

    const onAccepted = async (data: { from: string }) => {
      console.log('[WebRTC] Callee accepted, creating offer…');
      const pc = pcRef.current;
      if (!pc) { console.warn('[WebRTC] No PC on accepted'); return; }
      if (pc.signalingState !== 'stable') {
        console.warn('[WebRTC] accepted but state=', pc.signalingState);
        return;
      }
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        socketService.emit('video:offer', { to: data.from, offer, from: user._id });
      } catch (err) {
        console.error('[WebRTC] createOffer failed:', err);
        setCallError('Error al crear la oferta de conexión');
      }
    };

    const onOffer = async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log('[WebRTC] Received offer from', data.from);
      if (isCallerRef.current) {
        console.warn('[WebRTC] We are the caller, ignoring offer echo');
        return;
      }
      const pc = pcRef.current;
      if (!pc) { console.warn('[WebRTC] Offer arrived but no PC'); return; }
      if (pc.signalingState !== 'stable') {
        console.warn('[WebRTC] Offer in wrong state:', pc.signalingState);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.emit('video:answer', { to: data.from, answer });
        setCallState('connected');
      } catch (err) {
        console.error('[WebRTC] setRemoteDescription(offer) failed:', err);
        setCallError('Error al procesar la llamada entrante');
      }
    };

    const onAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received answer');
      if (!isCallerRef.current) {
        console.warn('[WebRTC] We are the callee, ignoring answer');
        return;
      }
      const pc = pcRef.current;
      if (!pc) { console.warn('[WebRTC] Answer arrived but no PC'); return; }
      if (pc.signalingState !== 'have-local-offer') {
        console.warn('[WebRTC] Answer in wrong state:', pc.signalingState);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (err) {
        console.error('[WebRTC] setRemoteDescription(answer) failed:', err);
        setCallError('Error al establecer la conexión');
      }
    };

    const onIce = async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (pcRef.current?.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch {}
    };

    const onEnd = () => { doEndCall(); };

    const onChatMsg = (msg: { from: string; text: string; time: string }) => {
      setChatLog(p => [...p, msg]);
    };

    socketService.on('video:incoming-call', onIncomingCall);
    socketService.on('video:accepted',      onAccepted);
    socketService.on('video:offer',         onOffer);
    socketService.on('video:answer',        onAnswer);
    socketService.on('video:ice-candidate', onIce);
    socketService.on('video:end',           onEnd);
    socketService.on('video:chat-message',  onChatMsg);

    return () => {
      socketService.off('video:incoming-call', onIncomingCall);
      socketService.off('video:accepted',      onAccepted);
      socketService.off('video:offer',         onOffer);
      socketService.off('video:answer',        onAnswer);
      socketService.off('video:ice-candidate', onIce);
      socketService.off('video:end',           onEnd);
      socketService.off('video:chat-message',  onChatMsg);
      stopLocalStream();
    };
  }, [user?._id, doEndCall]);

  const startCall = async (appt: Appointment) => {
    setCallError(null);
    setSelectedAppt(appt);
    setCallState('calling');
    isCallerRef.current = true;

    const targetUserId = user?.role === 'doctor'
      ? (appt.patientId?.userId as any)?._id
      : (appt.doctorId?.userId as any)?._id;

    try {
      await getLocalStream();
      createPC(targetUserId);

      socketService.emit('video:call-request', {
        to: targetUserId,
        from: user?._id,
        fromName: user?.name,
        appointmentId: appt._id,
      });
    } catch (err) {
      setCallError('No se pudo acceder a la cámara o micrófono');
      doEndCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingFrom) return;
    setCallError(null);
    isCallerRef.current = false;

    try {
      await getLocalStream();
      createPC(incomingFrom.userId); 
      setCallState('calling'); 

      socketService.emit('video:accept', {
        to: incomingFrom.userId,
        from: user?._id,
      });
    } catch (err) {
      setCallError('No se pudo acceder a la cámara o micrófono');
      doEndCall();
    }
  };

  const rejectCall = () => {
    socketService.emit('video:end', { to: incomingFrom?.userId });
    setIncomingFrom(null);
    setCallState('idle');
  };

  const endCall = () => {
    const targetId = selectedAppt
      ? (user?.role === 'doctor'
          ? (selectedAppt.patientId?.userId as any)?._id
          : (selectedAppt.doctorId?.userId as any)?._id)
      : incomingFrom?.userId;
    if (targetId) socketService.emit('video:end', { to: targetId });
    doEndCall();
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  };

  const toggleScreen = async () => {
    if (screenSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const vt = camStream.getVideoTracks()[0];
        pcRef.current?.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(vt);
        if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
        setScreenSharing(false);
      } catch {}
    } else {
      try {
        const ss = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        const st = ss.getVideoTracks()[0];
        pcRef.current?.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(st);
        if (localVideoRef.current) localVideoRef.current.srcObject = ss;
        st.onended = () => toggleScreen();
        setScreenSharing(true);
      } catch {}
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setFullscreen(p => !p);
  };

  const sendChatMsg = () => {
    if (!chatMsg.trim()) return;
    const msg = {
      from: user?.name || 'Yo',
      text: chatMsg.trim(),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatLog(p => [...p, msg]);
    const targetId = selectedAppt
      ? (user?.role === 'doctor'
          ? (selectedAppt.patientId?.userId as any)?._id
          : (selectedAppt.doctorId?.userId as any)?._id)
      : incomingFrom?.userId;
    socketService.emit('video:chat-message', { to: targetId, ...msg });
    setChatMsg('');
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const isInCall = callState === 'connected' || callState === 'calling';

  const callerName = selectedAppt
    ? (user?.role === 'doctor'
        ? (selectedAppt.patientId?.userId as any)?.name
        : (selectedAppt.doctorId?.userId as any)?.name)
    : incomingFrom?.name;

  return (
    <DashboardLayout>
      <div className={styles.page}>

        {callState === 'incoming' && incomingFrom && (
          <div className={styles.incomingOverlay}>
            <div className={styles.incomingCard}>
              <div className={styles.callerAvatar}>{incomingFrom.name[0]?.toUpperCase()}</div>
              <h3>{incomingFrom.name}</h3>
              <p>Te está llamando…</p>
              <div className={styles.callActions}>
                <button className={styles.rejectBtn} onClick={rejectCall} title="Rechazar">
                  <PhoneOff size={22} />
                </button>
                <button className={styles.acceptBtn} onClick={acceptCall} title="Aceptar">
                  <Phone size={22} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Error banner ──────────────────────────────── */}
        {callError && (
          <div className={styles.errorBanner}>
            ⚠️ {callError}
            <button onClick={() => setCallError(null)}>✕</button>
          </div>
        )}

        {/* ── Active call UI ────────────────────────────── */}
        {isInCall ? (
          <div ref={containerRef} className={[styles.callContainer, fullscreen ? styles['callContainer--fullscreen'] : ''].join(' ')}>
            <video ref={remoteVideoRef} autoPlay playsInline className={styles.remoteVideo} />

            <div className={styles.localPip}>
              <video ref={localVideoRef} autoPlay playsInline muted className={styles.localVideo} />
              {!camOn && <div className={styles.camOffOverlay}><VideoOff size={20} /></div>}
            </div>

            <div className={styles.callTopBar}>
              <div className={styles.callInfo}>
                <div className={[styles.callDot, callState === 'connected' ? styles['callDot--active'] : styles['callDot--connecting']].join(' ')} />
                <span>{callState === 'calling' ? 'Conectando…' : `En llamada · ${formatDuration(callDuration)}`}</span>
                {callerName && <span className={styles.callWith}>con {callerName}</span>}
              </div>
              <button className={styles.iconBtn} onClick={toggleFullscreen}>
                {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            <div className={styles.controls}>
              <button className={[styles.ctrl, !micOn ? styles['ctrl--off'] : ''].join(' ')} onClick={toggleMic}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                <span>{micOn ? 'Mic' : 'Silenciado'}</span>
              </button>

              <button className={[styles.ctrl, !camOn ? styles['ctrl--off'] : ''].join(' ')} onClick={toggleCam}>
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                <span>{camOn ? 'Cámara' : 'Sin cámara'}</span>
              </button>

              <button className={[styles.ctrl, screenSharing ? styles['ctrl--active'] : ''].join(' ')} onClick={toggleScreen}>
                {screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                <span>{screenSharing ? 'Dejar' : 'Pantalla'}</span>
              </button>

              <button className={[styles.ctrl, chatOpen ? styles['ctrl--active'] : ''].join(' ')} onClick={() => setChatOpen(p => !p)}>
                <MessageSquare size={20} />
                <span>Chat</span>
              </button>

              <button className={styles.endBtn} onClick={endCall}>
                <PhoneOff size={22} />
                <span>Colgar</span>
              </button>
            </div>

            {chatOpen && (
              <div className={styles.chatPanel}>
                <div className={styles.chatPanelHeader}>
                  Chat en llamada <button onClick={() => setChatOpen(false)}>✕</button>
                </div>
                <div className={styles.chatMessages}>
                  {chatLog.map((m, i) => (
                    <div key={i} className={[styles.chatBubble, m.from === user?.name ? styles['chatBubble--me'] : ''].join(' ')}>
                      <span className={styles.chatFrom}>{m.from}</span>
                      <span>{m.text}</span>
                      <span className={styles.chatTime}>{m.time}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.chatInput}>
                  <input
                    value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMsg()}
                    placeholder="Escribe un mensaje…"
                  />
                  <button onClick={sendChatMsg}>↑</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.idlePage}>
            <div className={styles.idleHeader}>
              <h1>Videollamadas</h1>
              <p>Consultas médicas en tiempo real desde cualquier lugar</p>
            </div>

            <Card>
              <div className={styles.previewSection}>
                <div className={styles.previewVideo}>
                  <video ref={localVideoRef} autoPlay playsInline muted className={styles.previewVid} />
                  <div className={styles.previewOverlay}>
                    <button className={styles.previewBtn} onClick={async () => {
                      try { await getLocalStream(); } catch { setCallError('Activa el permiso de cámara en tu navegador'); }
                    }}>
                      <Video size={18} /> Probar cámara
                    </button>
                  </div>
                </div>
                <div className={styles.previewInfo}>
                  <h3>Antes de comenzar</h3>
                  <ul>
                    <li>✅ Conexión a internet estable</li>
                    <li>✅ Cámara y micrófono habilitados</li>
                    <li>✅ Lugar tranquilo y bien iluminado</li>
                    <li>✅ La cita debe ser de tipo "Videollamada"</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card>
              <div className={styles.apptListHeader}>
                <h3><Users size={16} /> Citas de videollamada</h3>
              </div>
              {appointments.length === 0 ? (
                <div className={styles.noAppts}>
                  <Video size={40} strokeWidth={1.2} />
                  <p>No tienes citas de videollamada próximamente.</p>
                </div>
              ) : (
                <div className={styles.apptList}>
                  {appointments.map(appt => {
                    const other = user?.role === 'doctor'
                      ? (appt.patientId?.userId as any)
                      : (appt.doctorId?.userId as any);
                    return (
                      <div key={appt._id} className={styles.apptRow}>
                        <div className={styles.apptAvatar}>
                          {resolveAvatar(other?.avatar)
                            ? <img src={resolveAvatar(other?.avatar)} alt="" />
                            : <span>{other?.name?.[0]}</span>
                          }
                        </div>
                        <div className={styles.apptMeta}>
                          <strong>{other?.name}</strong>
                          <span>{new Date(appt.appointmentDate).toLocaleString('es-MX', {
                            weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}</span>
                          {appt.reason && <span className={styles.apptReason}>"{appt.reason}"</span>}
                        </div>
                        <button className={styles.callBtn} onClick={() => startCall(appt)}>
                          <Phone size={16} /> Iniciar llamada
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VideoPage;