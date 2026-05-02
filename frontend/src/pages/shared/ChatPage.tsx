import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { chatApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { Conversation, Message, Pagination as Pag } from '../../types';
import Pagination from '../../components/ui/Pagination';
import { resolveAvatar } from '../../utils/avatar';
import { socketService } from '../../services/socketService';
import styles from './ChatPage.module.scss';

const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const location    = useLocation();
  const navigate    = useNavigate();

  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [convPagination, setConvPagination] = useState<Pag | null>(null);
  const [convPage, setConvPage]             = useState(1);
  const [activeConv, setActiveConv]         = useState<Conversation | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [msgPagination, setMsgPagination]   = useState<Pag | null>(null);
  const [msgPage, setMsgPage]               = useState(1);
  const [text, setText]                     = useState('');
  const [loadingConvs, setLoadingConvs]     = useState(true);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [sending, setSending]               = useState(false);
  const [connected, setConnected]           = useState(false);
  const [search, setSearch]                 = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const bottomRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const formatDay = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoy';
    }

    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Ayer';
    }

    return format(date, "d MMM yyyy", { locale: es });
  };

  const openOrCreate = useCallback(async (targetId: string, role: 'doctorId' | 'patientId') => {
    try {
      const body = role === 'doctorId' ? { doctorId: targetId } : { patientId: targetId };
      const res = await chatApi.getOrCreate(body);
      const conv: Conversation = res.data.conversation;

      setConversations(prev => {
        if (prev.some(c => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });

      setActiveConv(conv);
      setMessages([]);
      setMsgPage(1);
      setMobileShowChat(true);
      socketService.joinConversation(conv._id);
    } catch (err) {
      console.error('openOrCreate failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    const params = new URLSearchParams(location.search);
    const doctorId  = params.get('doctorId');
    const patientId = params.get('patientId');
    if (doctorId) {
      openOrCreate(doctorId, 'doctorId');
      navigate(location.pathname, { replace: true });
    } else if (patientId) {
      openOrCreate(patientId, 'patientId');
      navigate(location.pathname, { replace: true });
    }
  }, [user?._id, location.search]);

  useEffect(() => {
    if (!user?._id) return;

    socketService.connect(user._id);

    const pollTimer = setInterval(() => {
      setConnected(socketService.isConnected);
    }, 1000);

    const onMessage = (msg: Message) => {
      setConversations(prev => prev.map(c =>
        c._id === msg.conversationId
          ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
          : c
      ));

      if (activeConvRef.current?._id !== msg.conversationId) return;

      setMessages(prev => {
        const senderId = (msg.senderId as any)?._id || msg.senderId;
        const tempIdx = prev.findIndex(
          m => m._id.startsWith('temp-')
            && m.content === msg.content
            && ((m.senderId as any)?._id || m.senderId) === senderId
        );
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = msg;
          return next;
        }
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    socketService.on('chat:message', onMessage);

    return () => {
      socketService.off('chat:message', onMessage);
      clearInterval(pollTimer);
    };
  }, [user?._id]);

  const loadConvs = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await chatApi.getConversations(convPage);
      setConversations(res.data.data);
      setConvPagination(res.data.pagination);
    } catch {}
    setLoadingConvs(false);
  }, [convPage]);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    chatApi.getMessages(activeConv._id, msgPage)
      .then(r => {
        if (msgPage === 1) {
          setMessages(r.data.data);
        } else {
          setMessages(prev => [...r.data.data, ...prev]);
        }
        setMsgPagination(r.data.pagination);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingMsgs(false);
        if (msgPage === 1) setTimeout(() => bottomRef.current?.scrollIntoView(), 120);
      });

    socketService.joinConversation(activeConv._id);
  }, [activeConv, msgPage]);

  const send = () => {
    if (!text.trim() || !activeConv || !user || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConv._id,
      senderId: user as any,
      content,
      type: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);

    socketService.emit('chat:send', {
      conversationId: activeConv._id,
      senderId: user._id,
      content,
    });

    setConversations(prev => prev.map(c =>
      c._id === activeConv._id
        ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
        : c
    ));

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const selectConversation = (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    setMsgPage(1);
    setMobileShowChat(true);
    socketService.joinConversation(conv._id);
  };

  const getOther = (conv: Conversation) =>
    user?.role === 'patient'
      ? (conv.doctorId?.userId as any)
      : (conv.patientId?.userId as any);

  const getOtherSubtitle = (conv: Conversation) =>
    user?.role === 'patient'
      ? (conv.doctorId as any)?.specialization
      : 'Paciente';

  const filteredConvs = conversations.filter(c => {
    const other = getOther(c);
    return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className={styles.chatLayout}>

        {/* ── Conversations sidebar ───────────────────────────── */}
        <div className={[styles.convSidebar, mobileShowChat ? styles['convSidebar--hidden'] : ''].join(' ')}>
          <div className={styles.convHeader}>
            <div className={styles.convHeaderTop}>
              <h2>Mensajes</h2>
              <span
                className={[styles.connDot, connected ? styles['connDot--on'] : ''].join(' ')}
                title={connected ? 'Conectado' : 'Conectando…'}
              />
            </div>
            <div className={styles.convSearch}>
              <Search size={15} />
              <input
                placeholder="Buscar conversación…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.convList}>
            {loadingConvs ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className={['skeleton', styles.convSkeleton].join(' ')} />
              ))
            ) : filteredConvs.length === 0 ? (
              <div className={styles.noConvs}>
                <MessageSquare size={32} />
                <p>{search ? 'Sin resultados' : 'Sin conversaciones'}</p>
                {!search && user?.role === 'patient' && (
                  <span>Agenda una cita y podrás chatear con tu doctor</span>
                )}
              </div>
            ) : (
              filteredConvs.map(conv => {
                const other    = getOther(conv);
                const isActive = activeConv?._id === conv._id;
                return (
                  <button
                    key={conv._id}
                    className={[styles.convItem, isActive ? styles['convItem--active'] : ''].join(' ')}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className={styles.convAvatar}>
                      {resolveAvatar(other?.avatar)
                        ? <img src={resolveAvatar(other?.avatar)} alt="" />
                        : <span>{other?.name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className={styles.convInfo}>
                      <span className={styles.convName}>{other?.name}</span>
                      <span className={styles.convLast}>
                        {conv.lastMessage || 'Inicia la conversación…'}
                      </span>
                    </div>
                    {conv.lastMessageAt && (
                      <span className={styles.convTime}>
                        {format(parseISO(conv.lastMessageAt), 'HH:mm', { locale: es })}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {convPagination && convPagination.totalPages > 1 && (
            <div className={styles.convPag}>
              <Pagination pagination={{ ...convPagination, page: convPage }} onPageChange={setConvPage} />
            </div>
          )}
        </div>

        {/* ── Chat area ────────────────────────────────────────── */}
        <div className={[styles.chatArea, mobileShowChat ? styles['chatArea--visible'] : ''].join(' ')}>
          {!activeConv ? (
            <div className={styles.noChat}>
              <MessageSquare size={56} strokeWidth={1} />
              <h3>Selecciona una conversación</h3>
              <p>Elige un chat de la lista para empezar a conversar.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className={styles.chatHeader}>
                <button className={styles.backBtn} onClick={() => setMobileShowChat(false)}>
                  <ArrowLeft size={18} />
                </button>
                <div className={styles.chatAvatar}>
                  {resolveAvatar(getOther(activeConv)?.avatar)
                    ? <img src={resolveAvatar(getOther(activeConv)?.avatar)} alt="" />
                    : <span>{getOther(activeConv)?.name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <strong>{getOther(activeConv)?.name}</strong>
                  <span>{getOtherSubtitle(activeConv)}</span>
                </div>
                {!connected && (
                  <span className={styles.offlineBanner}>● Reconectando…</span>
                )}
              </div>

              {/* Load older */}
              {msgPagination?.hasPrev && (
                <div className={styles.loadMore}>
                  <button onClick={() => setMsgPage(p => p + 1)} disabled={loadingMsgs}>
                    {loadingMsgs ? 'Cargando…' : '↑ Mensajes anteriores'}
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className={styles.messages}>
                {loadingMsgs && msgPage === 1 ? (
                  <div className={styles.loadingMsgs}>
                    <div className={styles.spinner} />
                    <span>Cargando mensajes…</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <span>💬</span>
                    <p>Sé el primero en escribir</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const senderId  = (msg.senderId as any)?._id || msg.senderId;
                    const isMe      = senderId === user?._id;
                    const isTemp    = msg._id.startsWith('temp-');
                    const senderUser = msg.senderId as any;

                    const prevMsg = messages[index - 1];

                    const showDateSeparator =
                      !prevMsg ||
                      format(parseISO(prevMsg.createdAt), 'yyyy-MM-dd') !==
                      format(parseISO(msg.createdAt), 'yyyy-MM-dd');
                    
                    return (
                      <React.Fragment key={msg._id}>

                        {/* 🟡 SEPARADOR */}
                        {showDateSeparator && (
                          <div className={styles.dateSeparator}>
                            {formatDay(msg.createdAt)}
                          </div>
                        )}

                        <div
                          className={[
                            styles.msgRow,
                            isMe ? styles['msgRow--me'] : ''
                          ].join(' ')}
                        >
                          {!isMe && (
                            <div className={styles.msgAvatar}>
                              {resolveAvatar(senderUser?.avatar)
                                ? <img src={resolveAvatar(senderUser?.avatar)} alt="" />
                                : <span>{senderUser?.name?.[0]}</span>
                              }
                            </div>
                          )}
                        
                          <div className={[
                            styles.bubble,
                            isMe   ? styles['bubble--me']   : styles['bubble--them'],
                            isTemp ? styles['bubble--temp'] : '',
                          ].filter(Boolean).join(' ')}>
                            <p>{msg.content}</p>
                        
                            <span className={styles.msgTime}>
                              {format(parseISO(msg.createdAt), 'HH:mm')}
                              {isMe && (
                                <span className={styles.msgStatus}>
                                  {isTemp ? ' ⏳' : ' ✓'}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className={styles.inputArea}>
                <textarea
                  ref={inputRef}
                  className={styles.msgInput}
                  placeholder="Escribe un mensaje… (Enter para enviar)"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button
                  className={[
                    styles.sendBtn,
                    !text.trim() || sending ? styles['sendBtn--disabled'] : '',
                  ].filter(Boolean).join(' ')}
                  onClick={send}
                  disabled={!text.trim() || sending}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
