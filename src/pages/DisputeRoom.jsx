import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Scale, Send, Loader2, AlertTriangle,
  FileImage, MessageCircle, HelpCircle, Gavel, ShieldCheck,
  Briefcase, Search, X, ChevronRight, Star, UserCheck,
  Menu, ScrollText, Users, CheckCircle, BookOpen,
} from 'lucide-react';
import {
  getDisputeRoom, sendDisputeMessage,
  findLawyers, requestCounsel,
} from '../api/dispute.api';
import { useAuthStore } from '../store/auth.store';
import { useSocket, getSocket } from '../hooks/useSocket';
import Spinner from '../components/ui/Spinner';
import { formatBC } from '../utils/currency';

// ── Injected keyframe animations ──────────────────────────────────────────────
const COURT_STYLES = `
  @keyframes sealSpin    { to { transform: rotate(360deg); } }
  @keyframes sealSpinRev { to { transform: rotate(-360deg); } }
  @keyframes courtGlow   {
    0%,100% { box-shadow: 0 0 10px 2px rgba(217,119,6,0.25), 0 0 24px 4px rgba(217,119,6,0.08); }
    50%      { box-shadow: 0 0 20px 6px rgba(217,119,6,0.5),  0 0 48px 8px rgba(217,119,6,0.18); }
  }
  @keyframes nodeRipple {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes inSession {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.2; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes borderPulse {
    0%,100% { border-color: rgba(217,119,6,0.35); }
    50%      { border-color: rgba(217,119,6,0.75); }
  }
  @keyframes sidebarGrad {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  .aria-shimmer {
    background: linear-gradient(90deg, #f59e0b, #fde68a, #b45309, #f59e0b);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  .msg-in { animation: msgIn 0.28s ease-out both; }
`;

// ── Constants ─────────────────────────────────────────────────────────────────
const STAGES = ['opening', 'evidence', 'deliberation', 'ruling', 'closed'];

const STAGE_META = {
  opening:      { label: 'Opening',      num: 1, icon: '📋', desc: 'Parties present their opening accounts' },
  evidence:     { label: 'Evidence',     num: 2, icon: '🔍', desc: 'Documentary evidence is submitted' },
  deliberation: { label: 'Deliberation', num: 3, icon: '⚖️', desc: 'ARIA deliberates on the evidence' },
  ruling:       { label: 'Ruling',       num: 4, icon: '🔨', desc: 'The binding judgment is issued' },
  closed:       { label: 'Closed',       num: 5, icon: '✅', desc: 'Proceedings are concluded' },
};

const COURT_RULES = [
  { article: 'I',    title: 'Jurisdiction',      body: 'This court holds exclusive jurisdiction over all disputes arising from SwapNaija barter transactions. No external forum shall override its rulings.' },
  { article: 'II',   title: 'Opening Statements', body: 'The Claimant presents first. The Respondent responds. Statements must be factual, direct, and address the matters in the case dossier.' },
  { article: 'III',  title: 'Evidence',           body: 'All evidence is admissible only during the Evidence stage. Late submissions require express judicial leave from the presiding judge, ARIA.' },
  { article: 'IV',   title: 'ARIA Authority',     body: 'ARIA is the presiding AI judge with full autonomous authority — to advance proceedings, weigh evidence, and issue final binding rulings.' },
  { article: 'V',    title: 'Legal Counsel',      body: 'Either party may retain a certified practitioner from the SwapNaija Legal Registry. Counsel may object, submit, and address the court at any stage.' },
  { article: 'VI',   title: 'Rulings',            body: 'All rulings are final and binding. Escrow funds are disbursed within 24 hours of the ruling. Appeals are not permitted in standard tier.' },
  { article: 'VII',  title: 'Conduct',            body: 'False or misleading submissions are punishable by full escrow forfeiture. Parties must address ARIA as the court and conduct themselves with decorum.' },
  { article: 'VIII', title: 'Escrow Protection',  body: 'All funds are frozen from the moment this court is convened. Neither party may withdraw without a ruling or mutual release order from this court.' },
];

const DECISION_LABELS = {
  compensate_initiator: 'Compensate Initiator',
  compensate_receiver:  'Compensate Receiver',
  split:                'Split escrow equally',
  mutual_release:       'Mutual release — no penalty',
  penalty_initiator:    'Penalty against Initiator',
  penalty_receiver:     'Penalty against Receiver',
};

const MSG_TYPES = [
  { value: 'text',     label: 'Statement', icon: MessageCircle },
  { value: 'evidence', label: 'Evidence',  icon: FileImage },
  { value: 'question', label: 'Question',  icon: HelpCircle },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function renderAriaContent(content) {
  return content.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={line === '' ? 'mt-2' : 'leading-relaxed'}>
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="font-semibold text-amber-200">{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  });
}

function computeMyOutcome(room, userId) {
  const ruling = room?.ruling;
  if (!ruling?.decision) return null;
  const snap       = room.swapSnapshot || {};
  const escrowKobo = snap.escrowDepositKobo || 0;
  const refundKobo = Math.round(escrowKobo * 0.98);
  const imInitiator = (room.initiatorId?.id ?? room.initiatorId) === userId;
  const { decision, compensationAmountKobo = 0, penaltyAmountKobo = 0 } = ruling;
  switch (decision) {
    case 'mutual_release': return { outcome: 'refund',  label: 'Your escrow is released back to you',       amountKobo: refundKobo };
    case 'split':          return { outcome: 'refund',  label: 'Escrow split equally between parties',      amountKobo: Math.round(refundKobo / 2) };
    case 'compensate_initiator': return imInitiator
      ? { outcome: 'credit',  label: 'You receive compensation',         amountKobo: compensationAmountKobo }
      : { outcome: 'debit',   label: 'Compensation awarded to initiator',amountKobo: compensationAmountKobo };
    case 'compensate_receiver': return imInitiator
      ? { outcome: 'debit',   label: 'Compensation awarded to receiver', amountKobo: compensationAmountKobo }
      : { outcome: 'credit',  label: 'You receive compensation',         amountKobo: compensationAmountKobo };
    case 'penalty_initiator': return imInitiator
      ? { outcome: 'penalty', label: 'A penalty has been levied against you',  amountKobo: penaltyAmountKobo }
      : { outcome: 'refund',  label: 'Initiator penalised — escrow released',  amountKobo: refundKobo };
    case 'penalty_receiver': return imInitiator
      ? { outcome: 'refund',  label: 'Receiver penalised — escrow released',   amountKobo: refundKobo }
      : { outcome: 'penalty', label: 'A penalty has been levied against you',  amountKobo: penaltyAmountKobo };
    default: return null;
  }
}

// ── Message bubble components ─────────────────────────────────────────────────

function SystemMsg({ msg }) {
  return (
    <div className="flex items-center gap-3 my-5 msg-in">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
      <span className="text-[9px] tracking-[0.2em] uppercase text-amber-700/70 font-semibold px-1 shrink-0 flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-amber-700/50 inline-block" />
        {msg.content}
        <span className="w-1 h-1 rounded-full bg-amber-700/50 inline-block" />
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
    </div>
  );
}

function AriaMsg({ msg, isFinal }) {
  return (
    <div
      className="relative rounded-xl border px-5 py-4 shadow-xl msg-in"
      style={{
        background: isFinal
          ? 'linear-gradient(135deg, rgba(120,53,15,0.4) 0%, rgba(15,23,42,0.8) 100%)'
          : 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
        borderColor: isFinal ? 'rgba(217,119,6,0.6)' : 'rgba(120,53,15,0.35)',
        animation: isFinal ? 'borderPulse 3s ease-in-out infinite' : undefined,
      }}
    >
      {/* Corner brackets */}
      <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-amber-600/50 rounded-tl" />
      <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-amber-600/50 rounded-tr" />

      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: isFinal
              ? 'linear-gradient(135deg, #d97706, #92400e)'
              : 'rgba(120,53,15,0.5)',
            border: '1px solid rgba(217,119,6,0.5)',
            animation: isFinal ? 'courtGlow 2.5s ease-in-out infinite' : undefined,
          }}
        >
          <Gavel size={14} className={isFinal ? 'text-amber-100' : 'text-amber-500'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold tracking-widest uppercase ${isFinal ? 'aria-shimmer' : 'text-amber-500'}`}>
              ARIA
            </span>
            <span className="text-[9px] tracking-[0.15em] uppercase text-slate-600 border border-slate-700/60 px-1.5 py-0.5 rounded bg-slate-800/50">
              {isFinal ? 'Final Ruling' : 'Presiding Judge'}
            </span>
            <span className="text-[9px] text-slate-600 ml-auto font-mono">
              {format(new Date(msg.createdAt), 'HH:mm')}
            </span>
          </div>
          <div className={`text-sm leading-relaxed space-y-0.5 ${isFinal ? 'text-amber-100/90' : 'text-slate-300'}`}>
            {renderAriaContent(msg.content)}
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-amber-600/50 rounded-bl" />
      <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-amber-600/50 rounded-br" />
    </div>
  );
}

function RulingMsg({ msg }) {
  return (
    <div
      className="relative rounded-xl border-2 p-6 shadow-2xl my-4 msg-in overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(120,53,15,0.6) 0%, rgba(10,10,20,0.95) 60%)',
        borderColor: 'rgba(217,119,6,0.7)',
        animation: 'borderPulse 2s ease-in-out infinite',
      }}
    >
      {/* BG glow */}
      <div className="absolute inset-0 bg-amber-500/5 rounded-xl pointer-events-none" />

      {/* Decorative corners */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-500/70 rounded-tl" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-500/70 rounded-tr" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-500/70 rounded-bl" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-500/70 rounded-br" />

      <div className="flex items-center gap-3 mb-4 relative">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#d97706,#92400e)', animation: 'courtGlow 2s infinite' }}
        >
          <Gavel size={18} className="text-amber-100" />
        </div>
        <div>
          <p className="font-bold tracking-[0.2em] uppercase text-amber-400 text-sm">Formal Ruling</p>
          <p className="text-[9px] text-amber-700 font-mono mt-0.5">
            {format(new Date(msg.createdAt), 'dd MMM yyyy · HH:mm')} · Issued by {msg.senderName}
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent mb-4" />
      <div className="text-amber-100/90 text-sm whitespace-pre-wrap leading-relaxed relative">
        {msg.content}
      </div>
    </div>
  );
}

function AdminMsg({ msg }) {
  return (
    <div className="flex gap-3 items-start max-w-[85%] msg-in">
      <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-700/40 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-blue-300">
        A
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-400">{msg.senderName}</span>
          <span className="text-[9px] tracking-widest uppercase border border-blue-800/50 bg-blue-900/30 text-blue-500 px-1.5 py-0.5 rounded">Admin</span>
          <span className="text-[9px] text-slate-600 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className="bg-blue-900/30 border border-blue-800/40 text-blue-100 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm">
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function CounselMsg({ msg }) {
  const isClaim  = msg.senderRole === 'counsel_claimant';
  const accent   = isClaim ? 'text-teal-400'    : 'text-emerald-400';
  const badgeCls = isClaim ? 'border-teal-800/50 bg-teal-900/30 text-teal-500' : 'border-emerald-800/50 bg-emerald-900/30 text-emerald-500';
  const bubbleCls= isClaim ? 'bg-teal-900/30 border-teal-800/40 text-teal-100' : 'bg-emerald-900/30 border-emerald-800/40 text-emerald-100';
  const dotCls   = isClaim ? 'bg-teal-900/60 border-teal-700/40 text-teal-400' : 'bg-emerald-900/60 border-emerald-700/40 text-emerald-400';

  return (
    <div className="flex gap-3 items-start max-w-[85%] msg-in">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 ${dotCls}`}>
        <Briefcase size={12} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${accent}`}>{msg.senderName}</span>
          <span className={`text-[9px] tracking-widest uppercase border px-1.5 py-0.5 rounded ${badgeCls}`}>
            {isClaim ? "Claimant's Counsel" : "Respondent's Counsel"}
          </span>
          <span className="text-[9px] text-slate-600 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className={`border rounded-xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm ${bubbleCls}`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function MyMsg({ msg }) {
  const cfg = {
    evidence: { cls: 'bg-amber-900/40 border-amber-800/40 text-amber-100', badge: 'Evidence' },
    question: { cls: 'bg-purple-900/40 border-purple-800/40 text-purple-100', badge: 'Question' },
    text:     { cls: 'bg-slate-700/80 border-slate-600/40 text-slate-100', badge: null },
  }[msg.messageType] || { cls: 'bg-slate-700/80 border-slate-600/40 text-slate-100', badge: null };

  return (
    <div className="flex flex-col items-end msg-in">
      <div className="flex items-center gap-2 mb-1">
        {cfg.badge && (
          <span className="text-[9px] tracking-widest uppercase border border-slate-700 bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
            {cfg.badge}
          </span>
        )}
        <span className="text-[9px] text-slate-600 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
      </div>
      <div className={`border rounded-xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm max-w-[82%] ${cfg.cls}`}>
        {msg.content}
      </div>
    </div>
  );
}

function OtherPartyMsg({ msg, isClaimant }) {
  const accent  = isClaimant ? 'text-rose-400'  : 'text-sky-400';
  const dotCls  = isClaimant ? 'bg-rose-900/50 border-rose-800/40 text-rose-300' : 'bg-sky-900/50 border-sky-800/40 text-sky-300';
  const badgeCls= isClaimant ? 'border-rose-800/50 bg-rose-900/20 text-rose-500' : 'border-sky-800/50 bg-sky-900/20 text-sky-500';

  return (
    <div className="flex gap-3 items-start max-w-[85%] msg-in">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 text-sm font-bold ${dotCls}`}>
        {(msg.senderName || '?').charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${accent}`}>{msg.senderName}</span>
          <span className={`text-[9px] tracking-widest uppercase border px-1.5 py-0.5 rounded ${badgeCls}`}>
            {isClaimant ? 'Claimant' : 'Respondent'}
          </span>
          <span className="text-[9px] text-slate-600 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm">
          {msg.content}
        </div>
      </div>
    </div>
  );
}

// ── Ruling banner ──────────────────────────────────────────────────────────────
function RulingBanner({ ruling, myOutcome }) {
  if (!ruling?.decision) return null;
  const outcomeStyle = {
    credit:  'border-green-700/40 bg-green-900/30 text-green-300',
    refund:  'border-sky-700/40 bg-sky-900/30 text-sky-300',
    debit:   'border-orange-700/40 bg-orange-900/30 text-orange-300',
    penalty: 'border-red-700/40 bg-red-900/30 text-red-300',
  };
  const icons = { credit: '💰', refund: '↩️', debit: '📤', penalty: '⚠️' };

  return (
    <div className="bg-amber-950/50 border-b border-amber-800/30 px-4 py-2.5 flex-shrink-0 space-y-1.5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-amber-500">
          Ruling · {DECISION_LABELS[ruling.decision] || ruling.decision}
        </p>
      </div>
      {ruling.adminNote && <p className="text-[10px] text-amber-700/70 italic pl-5">"{ruling.adminNote}"</p>}
      {myOutcome && (
        <div className={`ml-5 border rounded-lg px-3 py-1.5 text-[11px] font-semibold ${outcomeStyle[myOutcome.outcome] || outcomeStyle.refund}`}>
          {icons[myOutcome.outcome]} {myOutcome.label}
          {myOutcome.amountKobo > 0 && <strong className="ml-1">· {formatBC(myOutcome.amountKobo)}</strong>}
        </div>
      )}
    </div>
  );
}

// ── Court Sidebar ──────────────────────────────────────────────────────────────
function CourtSidebar({ room, stage, myRole, open, onClose, onHire }) {
  const snap       = room?.swapSnapshot || {};
  const currentIdx = STAGES.indexOf(stage);
  const isClosed   = room?.status !== 'active';

  const claimantCounsel   = snap.claimantCounselName   || null;
  const respondentCounsel = snap.respondentCounselName || null;
  const canHire = !isClosed && (
    (myRole === 'claimant'   && !claimantCounsel) ||
    (myRole === 'respondent' && !respondentCounsel)
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:relative z-30 lg:z-auto
          top-0 left-0 h-full w-72 flex-shrink-0
          flex flex-col
          border-r border-amber-900/20
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(160deg, #0c0e16 0%, #0f111a 40%, #0a0c14 100%)',
        }}
      >
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors z-10"
        >
          <X size={16} />
        </button>

        {/* ─ Court Seal ─ */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-amber-900/20 flex-shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center mb-4">
            {/* Outermost slow ring */}
            <div
              className="absolute inset-0 rounded-full border border-dashed border-amber-700/20"
              style={{ animation: 'sealSpin 40s linear infinite' }}
            />
            {/* Fast counter-ring */}
            <div
              className="absolute inset-2 rounded-full border border-dashed border-amber-800/20"
              style={{ animation: 'sealSpinRev 25s linear infinite' }}
            />
            {/* Static gold ring */}
            <div className="absolute inset-4 rounded-full border border-amber-700/30" />
            {/* Inner glowing core */}
            <div
              className="absolute inset-6 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #78350f, #451a03)',
                border: '1.5px solid rgba(217,119,6,0.6)',
                animation: 'courtGlow 3s ease-in-out infinite',
              }}
            >
              <Scale size={18} className="text-amber-300" />
            </div>
          </div>

          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-amber-500 text-center">
            SwapNaija
          </p>
          <p className="text-[9px] tracking-[0.2em] uppercase text-amber-800 mt-0.5 text-center">
            Dispute Court
          </p>

          {/* Case number */}
          {room && (
            <div className="mt-3 px-3 py-1.5 rounded-lg border border-amber-900/30 bg-amber-950/30">
              <p className="text-[9px] tracking-[0.2em] uppercase text-amber-800 text-center">Case</p>
              <p className="text-xs text-amber-500 font-mono font-bold text-center">
                #{(room.swapId?.toString?.() || room.swapId || '').slice(-8).toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable sidebar body */}
        <div className="flex-1 overflow-y-auto">

          {/* ─ Stage Tracker ─ */}
          <div className="px-4 py-5 border-b border-amber-900/15">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-amber-900/20" />
              <p className="text-[9px] tracking-[0.2em] uppercase text-amber-800 font-semibold">Proceedings</p>
              <div className="h-px flex-1 bg-amber-900/20" />
            </div>

            <div className="space-y-0">
              {STAGES.map((s, i) => {
                const meta     = STAGE_META[s];
                const isDone   = i < currentIdx;
                const isActive = i === currentIdx;
                const isLast   = i === STAGES.length - 1;

                return (
                  <div key={s} className="flex gap-3">
                    {/* Node + line */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all z-10 relative ${
                            isDone   ? 'bg-amber-600 border-amber-500 text-slate-950' :
                            isActive ? 'bg-slate-900 border-amber-500 text-amber-400' :
                                       'bg-slate-950 border-slate-800 text-slate-700'
                          }`}
                        >
                          {isDone ? <CheckCircle size={12} /> : meta.num}
                        </div>
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-full border-2 border-amber-500"
                            style={{ animation: 'nodeRipple 2s ease-out infinite' }}
                          />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-px mt-1 mb-1 h-8 ${isDone ? 'bg-amber-800/60' : 'bg-slate-800/80'}`} />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`pt-0.5 pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <p className={`text-xs font-semibold tracking-wide ${
                        isActive ? 'text-amber-400' : isDone ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        {meta.label}
                      </p>
                      {isActive && (
                        <p className="text-[9px] text-slate-600 mt-0.5 leading-relaxed">{meta.desc}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─ Parties ─ */}
          {room && (
            <div className="px-4 py-5 border-b border-amber-900/15">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-amber-900/20" />
                <p className="text-[9px] tracking-[0.2em] uppercase text-amber-800 font-semibold">Parties</p>
                <div className="h-px flex-1 bg-amber-900/20" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-rose-900/30 bg-rose-950/20 px-3 py-2">
                  <div>
                    <p className="text-[9px] tracking-widest uppercase text-rose-600/70">Claimant</p>
                    <p className="text-xs font-semibold text-rose-300 mt-0.5">
                      {snap.claimantName || 'Claimant'}
                    </p>
                  </div>
                  {claimantCounsel && (
                    <div className="text-right">
                      <p className="text-[9px] text-slate-600">Counsel</p>
                      <p className="text-[10px] text-teal-500 font-medium">{claimantCounsel.split(' ')[0]}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-sky-900/30 bg-sky-950/20 px-3 py-2">
                  <div>
                    <p className="text-[9px] tracking-widest uppercase text-sky-600/70">Respondent</p>
                    <p className="text-xs font-semibold text-sky-300 mt-0.5">
                      {snap.respondentName || 'Respondent'}
                    </p>
                  </div>
                  {respondentCounsel && (
                    <div className="text-right">
                      <p className="text-[9px] text-slate-600">Counsel</p>
                      <p className="text-[10px] text-emerald-500 font-medium">{respondentCounsel.split(' ')[0]}</p>
                    </div>
                  )}
                </div>
              </div>

              {canHire && (
                <button
                  onClick={onHire}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold border border-amber-800/50 bg-amber-900/20 hover:bg-amber-800/30 text-amber-500 px-3 py-2 rounded-lg transition-colors"
                >
                  <Briefcase size={10} />
                  Retain Legal Counsel
                </button>
              )}
              {room.tier === 'legal' && (
                <p className="text-center text-[9px] tracking-widest uppercase text-purple-500 mt-2">
                  ⚖️ Legal Tier Active
                </p>
              )}
            </div>
          )}

          {/* ─ Court Constitution ─ */}
          <div className="px-4 py-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-amber-900/20" />
              <p className="text-[9px] tracking-[0.2em] uppercase text-amber-800 font-semibold">Constitution</p>
              <div className="h-px flex-1 bg-amber-900/20" />
            </div>

            <div
              className="rounded-xl border border-amber-900/20 overflow-hidden"
              style={{ background: 'linear-gradient(160deg,rgba(30,20,5,0.6),rgba(10,12,20,0.8))' }}
            >
              {/* Constitution header */}
              <div className="px-4 pt-4 pb-3 border-b border-amber-900/20 text-center">
                <p className="text-[9px] tracking-[0.25em] uppercase text-amber-700 font-bold">
                  SwapNaija Dispute Court
                </p>
                <p className="text-[8px] tracking-widest uppercase text-amber-900 mt-0.5">
                  Rules & Governing Articles
                </p>
              </div>

              <div className="px-3 py-3 space-y-3">
                {COURT_RULES.map((rule, idx) => (
                  <div
                    key={rule.article}
                    className="border-l-2 border-amber-900/40 pl-3"
                    style={{
                      animation: `msgIn 0.4s ease-out ${idx * 0.05}s both`,
                    }}
                  >
                    <p className="text-[9px] tracking-[0.15em] uppercase font-bold text-amber-700/80">
                      Art. {rule.article} — {rule.title}
                    </p>
                    <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5 font-serif">
                      {rule.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-amber-900/20 text-center">
                <p className="text-[8px] text-amber-900/60 font-mono tracking-wider">
                  Effective upon room convening · ARIA presides
                </p>
              </div>
            </div>
          </div>

          {/* Bottom padding */}
          <div className="h-6" />
        </div>
      </aside>
    </>
  );
}

// ── Lawyer Directory Modal ─────────────────────────────────────────────────────
function LawyerDirectoryModal({ roomId, onClose }) {
  const [search, setSearch]       = useState('');
  const [spec, setSpec]           = useState('');
  const [selected, setSelected]   = useState(null);
  const [feeInput, setFeeInput]   = useState('');

  const { data: lawyersData, isLoading } = useQuery({
    queryKey: ['lawyers', spec],
    queryFn:  () => findLawyers({ specialization: spec || undefined, limit: 50 }),
  });
  const lawyers  = Array.isArray(lawyersData) ? lawyersData : (lawyersData?.lawyers ?? []);
  const filtered = lawyers.filter(l => !search || l.fullName?.toLowerCase().includes(search.toLowerCase()));

  const hireMutation = useMutation({
    mutationFn: () => requestCounsel(roomId, selected.id, Math.round(parseFloat(feeInput || '0') * 100)),
    onSuccess: () => { toast.success(`Retainer request sent to ${selected.fullName}`); onClose(); },
    onError:   (err) => toast.error(err.response?.data?.error ?? 'Failed to request counsel'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md">
      <div
        className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col border border-amber-900/30"
        style={{ background: 'linear-gradient(160deg, #0c0e16 0%, #0f1020 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-amber-900/20 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#78350f,#451a03)', border: '1px solid rgba(217,119,6,0.5)' }}
          >
            <BookOpen size={14} className="text-amber-300" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-500">Legal Counsel Registry</p>
            <p className="text-[9px] text-slate-600 tracking-wider">Certified SwapNaija practitioners</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors">
            <X size={15} />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="px-5 py-3 border-b border-amber-900/15 flex-shrink-0 space-y-2">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-300 placeholder-slate-700 rounded-lg focus:outline-none focus:border-amber-800"
                />
              </div>
              <select
                value={spec}
                onChange={e => setSpec(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg focus:outline-none focus:border-amber-800"
              >
                <option value="">All specializations</option>
                <option value="commercial">Commercial Law</option>
                <option value="consumer">Consumer Protection</option>
                <option value="property">Property Law</option>
                <option value="general">General Practice</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-10 text-slate-700 text-xs tracking-wider">No practitioners found</div>
              )}
              {filtered.map(lawyer => (
                <button
                  key={lawyer.id}
                  onClick={() => setSelected(lawyer)}
                  className="w-full text-left border border-slate-800/80 hover:border-amber-800/40 rounded-xl p-4 transition-all group"
                  style={{ background: 'rgba(15,17,28,0.8)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0"
                      style={{ background: 'rgba(120,53,15,0.3)', border: '1px solid rgba(217,119,6,0.3)' }}
                    >
                      {lawyer.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-300">{lawyer.fullName}</p>
                        {lawyer.legalSpecialization && (
                          <span className="text-[9px] tracking-widest uppercase border border-slate-700 text-slate-500 px-1.5 py-0.5 rounded">
                            {lawyer.legalSpecialization}
                          </span>
                        )}
                      </div>
                      {lawyer.legalBio && <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{lawyer.legalBio}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-700">
                        {lawyer.legalBarNumber && <span className="flex items-center gap-1"><UserCheck size={8} />{lawyer.legalBarNumber}</span>}
                        {lawyer.legalCasesTotal > 0 && <span className="flex items-center gap-1"><Star size={8} />{lawyer.legalCasesTotal} cases</span>}
                        {lawyer.legalFeePerCaseKobo > 0 && <span className="text-amber-700 font-semibold">{formatBC(lawyer.legalFeePerCaseKobo)} / case</span>}
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-slate-700 group-hover:text-amber-700 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-600 transition-colors">
              <ArrowLeft size={12} /> Back to registry
            </button>
            <div className="rounded-xl border border-slate-800 p-4 flex items-start gap-3" style={{ background: 'rgba(15,17,28,0.8)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0" style={{ background: 'rgba(120,53,15,0.3)', border: '1px solid rgba(217,119,6,0.3)' }}>
                {selected.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-200">{selected.fullName}</p>
                {selected.legalSpecialization && <p className="text-[10px] text-amber-700 tracking-wide">{selected.legalSpecialization}</p>}
                {selected.legalBio && <p className="text-[11px] text-slate-600 mt-1">{selected.legalBio}</p>}
                {selected.legalBarNumber && <p className="text-[9px] text-slate-700 mt-1 font-mono">Bar: {selected.legalBarNumber}</p>}
              </div>
            </div>
            <div>
              <label className="text-[9px] tracking-[0.2em] uppercase text-slate-600 font-semibold block mb-1.5">Proposed retainer fee (BC)</label>
              <input
                type="number" min="0" step="0.01"
                value={feeInput} onChange={e => setFeeInput(e.target.value)}
                placeholder={selected.legalFeePerCaseKobo ? `Suggested: ${(selected.legalFeePerCaseKobo / 100).toFixed(2)}` : '0.00'}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-800"
              />
              <p className="text-[9px] text-slate-700 mt-1.5">Lawyer may counter-propose. Fee deducted on acceptance.</p>
            </div>
            <button
              onClick={() => hireMutation.mutate()}
              disabled={hireMutation.isPending}
              className="w-full font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm tracking-wide text-amber-100 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#92400e,#78350f)', border: '1px solid rgba(217,119,6,0.4)' }}
            >
              {hireMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Briefcase size={14} /> Submit Retainer Request</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main DisputeRoom page ──────────────────────────────────────────────────────
export default function DisputeRoom() {
  const { swapId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  useSocket();

  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [msgType, setMsgType]           = useState('text');
  const [stage, setStage]               = useState(null);
  const [roomId, setRoomId]             = useState(null);
  const [showLawyers, setShowLawyers]   = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const bottomRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dispute-room', swapId],
    queryFn:  () => getDisputeRoom(swapId),
    retry: 1,
  });

  useEffect(() => {
    if (data) { setMessages(data.messages || []); setStage(data.room?.stage); setRoomId(data.room?.id); }
  }, [data]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('dispute:join', roomId);

    const onMsg    = (msg) => setMessages(prev => { const id = msg.id || msg._id; return prev.some(m => (m.id || m._id) === id) ? prev : [...prev, msg]; });
    const onStage  = ({ stage: s }) => { setStage(s); queryClient.invalidateQueries({ queryKey: ['dispute-room', swapId] }); };
    const onRuled  = () => queryClient.invalidateQueries({ queryKey: ['dispute-room', swapId] });
    const onCounsel= () => queryClient.invalidateQueries({ queryKey: ['dispute-room', swapId] });

    socket.on('dispute:message',           onMsg);
    socket.on('dispute:stage_changed',     onStage);
    socket.on('dispute:ruled',             onRuled);
    socket.on('dispute:counsel_joined',    onCounsel);
    socket.on('dispute:counsel_requested', onCounsel);

    return () => {
      socket.emit('dispute:leave', roomId);
      socket.off('dispute:message',           onMsg);
      socket.off('dispute:stage_changed',     onStage);
      socket.off('dispute:ruled',             onRuled);
      socket.off('dispute:counsel_joined',    onCounsel);
      socket.off('dispute:counsel_requested', onCounsel);
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

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const room           = data?.room;
  const isClosed       = room?.status !== 'active';
  const myRole         = room ? ((room.claimantId?.id ?? room.claimantId) === user?.id ? 'claimant' : 'respondent') : null;
  const claimantUserId = room?.claimantId?.id ?? room?.claimantId;
  const myOutcome      = room ? computeMyOutcome(room, user?.id) : null;
  const stageMeta      = STAGE_META[stage] || STAGE_META.opening;

  const renderMessages = () => messages.map((msg) => {
    const id = msg.id || msg._id;
    if (msg.messageType === 'system' || msg.senderRole === 'system') return <SystemMsg key={id} msg={msg} />;
    if (msg.messageType === 'ruling') return <RulingMsg key={id} msg={msg} />;
    if (msg.senderRole === 'bot')     return <AriaMsg key={id} msg={msg} isFinal={msg.messageType === 'decision'} />;
    if (msg.senderRole === 'admin')   return <AdminMsg key={id} msg={msg} />;
    if (msg.senderRole === 'counsel_claimant' || msg.senderRole === 'counsel_respondent') {
      const sid = msg.senderId?.id || msg.senderId?._id || msg.senderId;
      if (sid === user?.id) return <MyMsg key={id} msg={msg} />;
      return <CounselMsg key={id} msg={msg} />;
    }
    const senderId = msg.senderId?.id || msg.senderId?._id || msg.senderId;
    if (senderId === user?.id) return <MyMsg key={id} msg={msg} />;
    return <OtherPartyMsg key={id} msg={msg} isClaimant={senderId === claimantUserId} />;
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border border-dashed border-amber-700/30" style={{ animation: 'sealSpin 20s linear infinite' }} />
            <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#78350f,#451a03)', border: '1px solid rgba(217,119,6,0.5)', animation: 'courtGlow 2s infinite' }}>
              <Scale size={22} className="text-amber-300" />
            </div>
          </div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-amber-800">Convening court…</p>
        </div>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="flex flex-col h-screen bg-slate-950">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-amber-900/20">
          <button onClick={() => navigate('/swaps')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500"><ArrowLeft size={18} /></button>
          <span className="text-sm font-semibold text-slate-400 tracking-wide">Dispute Court</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertTriangle size={32} className="text-amber-700" />
          <div>
            <p className="font-bold text-slate-400 tracking-wider">Court not yet convened</p>
            <p className="text-xs text-slate-700 mt-1">The room will be opened shortly.</p>
          </div>
          <button onClick={() => navigate('/swaps')} className="text-xs text-amber-700 hover:text-amber-500 transition-colors">← Return to My Swaps</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{COURT_STYLES}</style>

      <div className="flex h-screen bg-slate-950 overflow-hidden">

        {/* ── Sidebar ── */}
        <CourtSidebar
          room={room}
          stage={stage}
          myRole={myRole}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onHire={() => { setSidebarOpen(false); setShowLawyers(true); }}
        />

        {/* ── Main chat panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-amber-900/20 flex-shrink-0"
            style={{ background: 'linear-gradient(90deg,rgba(12,14,22,0.95),rgba(10,12,18,0.98))' }}
          >
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors flex-shrink-0"
            >
              <Menu size={18} />
            </button>

            {/* Back on desktop */}
            <button
              onClick={() => navigate('/swaps')}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-amber-600">
                  {stageMeta.icon} {stageMeta.label}
                </span>
                {/* In session dot */}
                {!isClosed && (
                  <span className="flex items-center gap-1 text-[9px] text-red-500 tracking-wider">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"
                      style={{ animation: 'inSession 1.2s ease-in-out infinite' }}
                    />
                    IN SESSION
                  </span>
                )}
                {isClosed && (
                  <span className="text-[9px] tracking-widest uppercase text-slate-600">CLOSED</span>
                )}
              </div>
              <p className="text-[9px] text-slate-700 font-mono mt-0.5">
                CASE #{swapId.slice(-8).toUpperCase()} · {myRole === 'claimant' ? 'CLAIMANT' : 'RESPONDENT'}
              </p>
            </div>

            {/* Gavel icon */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(120,53,15,0.35)', border: '1px solid rgba(217,119,6,0.3)' }}
            >
              <Gavel size={14} className="text-amber-600" />
            </div>
          </div>

          {/* Ruling banner */}
          {isClosed && <RulingBanner ruling={room.ruling} myOutcome={myOutcome} />}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-16">
                <div
                  className="relative w-24 h-24"
                >
                  <div className="absolute inset-0 rounded-full border border-dashed border-amber-900/40" style={{ animation: 'sealSpin 30s linear infinite' }} />
                  <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(120,53,15,0.6),rgba(30,20,5,0.8))', border: '1px solid rgba(217,119,6,0.3)', animation: 'courtGlow 3s infinite' }}>
                    <Gavel size={24} className="text-amber-700" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-500 tracking-[0.15em] uppercase text-sm">Court is convening</p>
                  <p className="text-[10px] text-slate-700 mt-1">ARIA is preparing the opening statement</p>
                </div>
              </div>
            )}

            {renderMessages()}

            {sendMutation.isPending && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 text-[9px] text-slate-600 border border-slate-800 rounded-full px-3 py-1.5 font-mono" style={{ background: 'rgba(15,17,28,0.8)' }}>
                  <Loader2 size={9} className="animate-spin" />
                  recording submission…
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          {!isClosed ? (
            <div
              className="border-t border-amber-900/15 px-4 pt-3 pb-safe flex-shrink-0"
              style={{ background: 'linear-gradient(0deg,rgba(8,10,18,0.98),rgba(12,14,22,0.95))' }}
            >
              {/* Type tabs */}
              <div className="flex gap-1.5 mb-2.5">
                {MSG_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMsgType(value)}
                    className={`flex items-center gap-1 text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg font-semibold transition-all border ${
                      msgType === value
                        ? 'bg-amber-900/40 text-amber-400 border-amber-800/60'
                        : 'text-slate-700 border-slate-800/80 hover:text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <Icon size={10} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-end pb-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder={
                    msgType === 'evidence' ? 'Describe your evidence — photos, receipts, tracking numbers…' :
                    msgType === 'question' ? 'Direct your question to the court or the opposing party…' :
                    'Address the court — speak clearly and with candour…'
                  }
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none transition-colors text-slate-200 placeholder-slate-700"
                  style={{
                    background: 'rgba(15,17,28,0.9)',
                    border: '1px solid rgba(51,65,85,0.6)',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(120,53,15,0.7)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(51,65,85,0.6)'; }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg,#b45309,#78350f)',
                    border: '1px solid rgba(217,119,6,0.4)',
                    boxShadow: input.trim() ? '0 0 12px rgba(180,83,9,0.3)' : 'none',
                  }}
                >
                  {sendMutation.isPending
                    ? <Loader2 size={14} className="text-amber-200 animate-spin" />
                    : <Send size={14} className="text-amber-200" />
                  }
                </button>
              </div>
            </div>
          ) : (
            <div
              className="border-t border-amber-900/15 px-4 py-5 text-center flex-shrink-0"
              style={{ background: 'rgba(8,10,18,0.98)' }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-10 bg-amber-900/30" />
                <p className="text-[9px] tracking-[0.25em] uppercase text-amber-800 font-semibold">
                  {room.status === 'resolved' ? 'Ruling Issued — Proceedings Closed' : 'Proceedings Closed'}
                </p>
                <div className="h-px w-10 bg-amber-900/30" />
              </div>
              <p className="text-[10px] text-slate-700 mb-3">No further submissions may be entered into the record.</p>
              <button onClick={() => navigate('/swaps')} className="text-[10px] text-amber-800 hover:text-amber-600 transition-colors tracking-widest uppercase">
                ← Return to My Swaps
              </button>
            </div>
          )}
        </div>
      </div>

      {showLawyers && <LawyerDirectoryModal roomId={roomId} onClose={() => setShowLawyers(false)} />}
    </>
  );
}
