import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Scale, Send, Loader2, AlertTriangle,
  FileImage, MessageCircle, HelpCircle, Gavel, ShieldCheck,
} from 'lucide-react';
import { getDisputeRoom, sendDisputeMessage } from '../api/dispute.api';
import { useAuthStore } from '../store/auth.store';
import { useSocket, getSocket } from '../hooks/useSocket';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

const STAGE_META = {
  opening:      { label: 'Opening',      icon: '📋', color: 'text-blue-600',   bg: 'bg-blue-50' },
  evidence:     { label: 'Evidence',     icon: '🔍', color: 'text-amber-600',  bg: 'bg-amber-50' },
  deliberation: { label: 'Deliberation', icon: '⚖️', color: 'text-purple-600', bg: 'bg-purple-50' },
  ruling:       { label: 'Ruling',       icon: '🔨', color: 'text-red-600',    bg: 'bg-red-50' },
  closed:       { label: 'Closed',       icon: '✅', color: 'text-gray-600',   bg: 'bg-gray-100' },
};

const DECISION_LABELS = {
  compensate_initiator: 'Award compensation to Initiator',
  compensate_receiver:  'Award compensation to Receiver',
  split:                'Split escrow between both parties',
  mutual_release:       'Mutual release — no penalty',
  penalty_initiator:    'Penalty against Initiator',
  penalty_receiver:     'Penalty against Receiver',
};

const MSG_TYPES = [
  { value: 'text',     label: 'Statement', icon: MessageCircle },
  { value: 'evidence', label: 'Evidence',  icon: FileImage },
  { value: 'question', label: 'Question',  icon: HelpCircle },
];

function renderAriaContent(content) {
  return content.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={line === '' ? 'mt-2' : 'leading-relaxed'}>
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  });
}

function SystemMsg({ msg }) {
  return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
        {msg.content}
      </span>
    </div>
  );
}

function AriaMsg({ msg, isFinal }) {
  return (
    <div className="flex gap-3 items-start max-w-[90%]">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md mt-1 ${
        isFinal ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : 'bg-gradient-to-br from-primary to-primary-700'
      }`}>
        <Scale size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-bold ${isFinal ? 'text-amber-600' : 'text-primary'}`}>ARIA</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            isFinal ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'
          }`}>
            {isFinal ? 'Final Decision' : 'AI Mediator'}
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {format(new Date(msg.createdAt), 'HH:mm')}
          </span>
        </div>
        <div className={`border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm text-gray-700 space-y-0.5 ${
          isFinal ? 'bg-amber-50 border-amber-200' : 'bg-white border-primary-100'
        }`}>
          {renderAriaContent(msg.content)}
        </div>
      </div>
    </div>
  );
}

function RulingMsg({ msg }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md my-3">
      <div className="flex items-center gap-2 mb-3">
        <Gavel size={22} className="text-amber-700" />
        <span className="font-bold text-amber-800 text-base">FORMAL RULING</span>
        <span className="ml-auto text-xs text-amber-600">
          {format(new Date(msg.createdAt), 'dd MMM · HH:mm')}
        </span>
      </div>
      <div className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed">
        {msg.content}
      </div>
      <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-600 text-right">
        Issued by {msg.senderName}
      </div>
    </div>
  );
}

function AdminMsg({ msg }) {
  return (
    <div className="flex gap-3 items-start max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-white text-xs font-bold">A</span>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-600">{msg.senderName}</span>
          <span className="text-xs bg-blue-50 text-blue-500 px-1.5 rounded">Admin Judge</span>
          <span className="text-xs text-gray-400">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className="bg-blue-600 text-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm">
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function MyMsg({ msg }) {
  const typeColors = {
    evidence: 'bg-amber-500',
    question: 'bg-purple-500',
    text:     'bg-primary',
  };
  const typeLabels = { evidence: 'Evidence', question: 'Question', text: null };
  const bgColor  = typeColors[msg.messageType] || 'bg-primary';
  const typeLabel = typeLabels[msg.messageType];

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 mb-1">
        {typeLabel && (
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 rounded">{typeLabel}</span>
        )}
        <span className="text-xs text-gray-400">{format(new Date(msg.createdAt), 'HH:mm')}</span>
      </div>
      <div className={`${bgColor} text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm max-w-[80%]`}>
        {msg.content}
      </div>
    </div>
  );
}

function OtherPartyMsg({ msg, isClaimant }) {
  const roleLabel = isClaimant ? 'Claimant' : 'Respondent';
  const roleColor = isClaimant ? 'text-red-500' : 'text-blue-500';
  const roleBg    = isClaimant ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500';

  return (
    <div className="flex gap-3 items-start max-w-[85%]">
      <Avatar name={msg.senderName} size="sm" className="mt-1 flex-shrink-0" />
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${roleColor}`}>{msg.senderName}</span>
          <span className={`text-xs px-1.5 rounded ${roleBg}`}>{roleLabel}</span>
          <span className="text-xs text-gray-400">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 shadow-sm">
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function RulingBanner({ ruling }) {
  if (!ruling?.decision) return null;
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-4 py-3 flex-shrink-0">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-amber-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-800">
            Ruling: {DECISION_LABELS[ruling.decision] || ruling.decision}
          </p>
          {ruling.adminNote && (
            <p className="text-xs text-amber-700 truncate mt-0.5">"{ruling.adminNote}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DisputeRoom() {
  const { swapId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  useSocket(); // ensure socket is initialized even outside AppShell

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [msgType, setMsgType]   = useState('text');
  const [stage, setStage]       = useState(null);
  const [roomId, setRoomId]     = useState(null);
  const bottomRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dispute-room', swapId],
    queryFn:  () => getDisputeRoom(swapId),
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      setMessages(data.messages || []);
      setStage(data.room?.stage);
      setRoomId(data.room?.id);
    }
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('dispute:join', roomId);

    const onMessage = (msg) => {
      setMessages(prev => {
        const id = msg.id || msg._id;
        if (prev.some(m => (m.id || m._id) === id)) return prev;
        return [...prev, msg];
      });
    };

    const onStageChanged = ({ stage: newStage }) => {
      setStage(newStage);
      queryClient.invalidateQueries({ queryKey: ['dispute-room', swapId] });
    };

    const onRuled = () => {
      queryClient.invalidateQueries({ queryKey: ['dispute-room', swapId] });
    };

    socket.on('dispute:message',       onMessage);
    socket.on('dispute:stage_changed', onStageChanged);
    socket.on('dispute:ruled',         onRuled);

    return () => {
      socket.emit('dispute:leave', roomId);
      socket.off('dispute:message',       onMessage);
      socket.off('dispute:stage_changed', onStageChanged);
      socket.off('dispute:ruled',         onRuled);
    };
  }, [roomId, swapId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: () => sendDisputeMessage(roomId, input.trim(), msgType),
    onSuccess: (msg) => {
      setInput('');
      const id = msg.id || msg._id;
      setMessages(prev => prev.some(m => (m.id || m._id) === id) ? prev : [...prev, msg]);
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to send message'),
  });

  const handleSend = useCallback(() => {
    if (!input.trim() || !roomId || sendMutation.isPending) return;
    sendMutation.mutate();
  }, [input, roomId, sendMutation]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const room     = data?.room;
  const isClosed = room?.status !== 'active';

  // Determine user's role in this dispute
  const myRole = room
    ? (room.claimantId?.id === user?.id ? 'claimant' : 'respondent')
    : null;

  // Claimant user ID for correctly labelling other party's messages
  const claimantUserId = room?.claimantId?.id;

  const stageMeta = STAGE_META[stage] || STAGE_META.opening;

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => navigate('/swaps')} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <Scale size={20} className="text-primary" />
          <span className="font-semibold">Dispute Court</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => navigate('/swaps')} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold">Dispute Court</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle size={40} className="text-amber-400" />
          <p className="font-semibold text-gray-700">Court room not open yet</p>
          <p className="text-sm text-gray-400">An admin will open the court room shortly. Check back soon.</p>
          <button onClick={() => navigate('/swaps')} className="mt-2 text-sm text-primary font-medium">
            ← Back to My Swaps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/swaps')}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center flex-shrink-0">
            <Scale size={16} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-ink">Dispute Court</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageMeta.bg} ${stageMeta.color}`}>
                {stageMeta.icon} {stageMeta.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Case #{swapId.slice(-8).toUpperCase()}</span>
              <span>·</span>
              <span className={myRole === 'claimant' ? 'text-red-500' : 'text-blue-500'}>
                You: {myRole === 'claimant' ? 'Claimant' : 'Respondent'}
              </span>
              {room.adminId?.fullName && (
                <>
                  <span>·</span>
                  <span className="text-blue-600">Judge: {room.adminId.fullName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stage progress bar */}
        <div className="flex items-center gap-1 mt-3">
          {Object.entries(STAGE_META).map(([key]) => {
            const stages     = Object.keys(STAGE_META);
            const currentIdx = stages.indexOf(stage);
            const thisIdx    = stages.indexOf(key);
            const isDone     = thisIdx < currentIdx;
            const isActive   = key === stage;
            return (
              <div key={key} className="flex items-center flex-1">
                <div
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    isDone ? 'bg-primary' : isActive ? 'bg-primary-300' : 'bg-gray-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
          {Object.values(STAGE_META).map(m => (
            <span key={m.label} className="text-center" style={{ flex: 1 }}>{m.icon}</span>
          ))}
        </div>
      </div>

      {/* Dispute reason strip */}
      <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-red-700">Dispute under mediation</p>
            {room.swapSnapshot?.disputeReason && (
              <p className="text-xs text-red-600 truncate">"{room.swapSnapshot.disputeReason}"</p>
            )}
            {!room.adminId && (
              <p className="text-xs text-amber-600 mt-0.5">Waiting for an admin judge to be assigned…</p>
            )}
          </div>
        </div>
      </div>

      {/* Ruling banner — shown when resolved */}
      {isClosed && <RulingBanner ruling={room.ruling} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
              <Scale size={28} className="text-primary" />
            </div>
            <p className="font-semibold text-gray-700">ARIA is preparing the court room…</p>
            <p className="text-sm text-gray-400">The opening statement will appear shortly.</p>
          </div>
        )}

        {messages.map((msg) => {
          const id = msg.id || msg._id;

          if (msg.messageType === 'system' || msg.senderRole === 'system') {
            return <SystemMsg key={id} msg={msg} />;
          }

          if (msg.messageType === 'ruling') {
            return <RulingMsg key={id} msg={msg} />;
          }

          if (msg.senderRole === 'bot') {
            // 'decision' type = ARIA's final closing statement after ruling
            return <AriaMsg key={id} msg={msg} isFinal={msg.messageType === 'decision'} />;
          }

          if (msg.senderRole === 'admin') {
            return <AdminMsg key={id} msg={msg} />;
          }

          const senderId = msg.senderId?.id || msg.senderId?._id || msg.senderId;
          const isMe     = senderId === user?.id;

          if (isMe) {
            return <MyMsg key={id} msg={msg} />;
          }

          // Determine if this party is the claimant based on room data
          const senderIsClaimant = senderId === claimantUserId;
          return <OtherPartyMsg key={id} msg={msg} isClaimant={senderIsClaimant} />;
        })}

        {sendMutation.isPending && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1.5">
              <Loader2 size={12} className="animate-spin" />
              Sending…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {!isClosed ? (
        <div className="bg-white border-t border-gray-100 px-4 pt-3 pb-safe flex-shrink-0">
          <div className="flex gap-2 mb-2.5">
            {MSG_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMsgType(value)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  msgType === value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-end pb-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder={
                msgType === 'evidence'
                  ? 'Describe your evidence (photos, receipts, tracking numbers)…'
                  : msgType === 'question'
                  ? 'Ask a question to the other party or mediator…'
                  : 'Present your statement clearly and honestly…'
              }
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sendMutation.isPending
                ? <Loader2 size={16} className="text-white animate-spin" />
                : <Send size={16} className="text-white" />
              }
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-4 text-center flex-shrink-0">
          <p className="text-sm text-gray-500">
            {room.status === 'resolved'
              ? '✅ A ruling has been issued. This proceeding is now closed.'
              : 'This proceeding is closed. No further messages can be sent.'}
          </p>
          <button onClick={() => navigate('/swaps')} className="mt-2 text-sm text-primary font-medium">
            Back to My Swaps →
          </button>
        </div>
      )}
    </div>
  );
}
