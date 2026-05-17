import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Scale, Send, Loader2, AlertTriangle,
  FileImage, MessageCircle, HelpCircle, Gavel, ShieldCheck,
  Briefcase, Search, X, ChevronRight, Star, UserCheck, BookOpen,
} from 'lucide-react';
import {
  getDisputeRoom, sendDisputeMessage,
  findLawyers, requestCounsel,
} from '../api/dispute.api';
import { useAuthStore } from '../store/auth.store';
import { useSocket, getSocket } from '../hooks/useSocket';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import { formatBC } from '../utils/currency';

// ── Stage config ───────────────────────────────────────────────────────────────

const STAGES = ['opening', 'evidence', 'deliberation', 'ruling', 'closed'];

const STAGE_META = {
  opening:      { label: 'Opening',      num: 1, icon: '📋' },
  evidence:     { label: 'Evidence',     num: 2, icon: '🔍' },
  deliberation: { label: 'Deliberation', num: 3, icon: '⚖️' },
  ruling:       { label: 'Ruling',       num: 4, icon: '🔨' },
  closed:       { label: 'Closed',       num: 5, icon: '✅' },
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
  const snapshot    = room.swapSnapshot || {};
  const escrowKobo  = snapshot.escrowDepositKobo || 0;
  const refundKobo  = Math.round(escrowKobo * 0.98);
  const imInitiator = (room.initiatorId?.id ?? room.initiatorId) === userId;
  const { decision, compensationAmountKobo = 0, penaltyAmountKobo = 0 } = ruling;

  switch (decision) {
    case 'mutual_release': return { outcome: 'refund',  label: 'Your escrow is released back to you',   amountKobo: refundKobo };
    case 'split':          return { outcome: 'refund',  label: 'Escrow split equally between parties',  amountKobo: Math.round(refundKobo / 2) };
    case 'compensate_initiator': return imInitiator
      ? { outcome: 'credit',  label: 'You receive compensation',          amountKobo: compensationAmountKobo }
      : { outcome: 'debit',   label: 'Compensation paid to initiator',    amountKobo: compensationAmountKobo };
    case 'compensate_receiver': return imInitiator
      ? { outcome: 'debit',   label: 'Compensation paid to receiver',     amountKobo: compensationAmountKobo }
      : { outcome: 'credit',  label: 'You receive compensation',          amountKobo: compensationAmountKobo };
    case 'penalty_initiator': return imInitiator
      ? { outcome: 'penalty', label: 'A penalty has been levied against you', amountKobo: penaltyAmountKobo }
      : { outcome: 'refund',  label: 'Initiator penalised — escrow released', amountKobo: refundKobo };
    case 'penalty_receiver': return imInitiator
      ? { outcome: 'refund',  label: 'Receiver penalised — escrow released',  amountKobo: refundKobo }
      : { outcome: 'penalty', label: 'A penalty has been levied against you',  amountKobo: penaltyAmountKobo };
    default: return null;
  }
}

// ── Message components (court aesthetic) ──────────────────────────────────────

function SystemMsg({ msg }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-amber-900/40" />
      <span className="text-[10px] tracking-widest uppercase text-amber-600/70 font-medium px-2 shrink-0">
        {msg.content}
      </span>
      <div className="flex-1 h-px bg-amber-900/40" />
    </div>
  );
}

function AriaMsg({ msg, isFinal }) {
  return (
    <div className={`relative rounded-xl border px-5 py-4 shadow-lg ${
      isFinal
        ? 'bg-gradient-to-br from-amber-950/80 to-yellow-950/60 border-amber-500/60'
        : 'bg-slate-800/80 border-amber-700/30'
    }`}>
      {/* Top rule */}
      <div className={`absolute top-0 left-6 right-6 h-px ${isFinal ? 'bg-amber-500/50' : 'bg-amber-800/40'}`} />

      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg ${
          isFinal ? 'bg-amber-500' : 'bg-amber-800/60 border border-amber-600/40'
        }`}>
          <Gavel size={15} className={isFinal ? 'text-slate-900' : 'text-amber-400'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest uppercase text-amber-400">ARIA</span>
            <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded font-semibold border ${
              isFinal
                ? 'text-amber-300 bg-amber-900/50 border-amber-600/40'
                : 'text-slate-400 bg-slate-700/50 border-slate-600/40'
            }`}>
              {isFinal ? 'Final Ruling' : 'Presiding Judge'}
            </span>
            <span className="text-[10px] text-slate-500 ml-auto font-mono">
              {format(new Date(msg.createdAt), 'HH:mm')}
            </span>
          </div>
          <div className={`text-sm leading-relaxed space-y-0.5 ${isFinal ? 'text-amber-100' : 'text-slate-300'}`}>
            {renderAriaContent(msg.content)}
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <div className={`absolute bottom-0 left-6 right-6 h-px ${isFinal ? 'bg-amber-500/50' : 'bg-amber-800/40'}`} />
    </div>
  );
}

function RulingMsg({ msg }) {
  return (
    <div className="relative bg-gradient-to-br from-amber-950 to-slate-900 border-2 border-amber-500/70 rounded-xl p-6 shadow-2xl my-4">
      {/* Decorative corner marks */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500/60 rounded-tl" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500/60 rounded-tr" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500/60 rounded-bl" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-500/60 rounded-br" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <Gavel size={18} className="text-slate-900" />
        </div>
        <div>
          <p className="font-bold tracking-widest uppercase text-amber-400 text-sm">Formal Ruling</p>
          <p className="text-[10px] text-amber-600/70 font-mono mt-0.5">
            {format(new Date(msg.createdAt), 'dd MMM yyyy · HH:mm')}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] text-amber-600/60 uppercase tracking-wider">Issued by</p>
          <p className="text-xs text-amber-400 font-semibold">{msg.senderName}</p>
        </div>
      </div>

      <div className="h-px bg-amber-700/40 mb-4" />
      <div className="text-amber-100/90 text-sm whitespace-pre-wrap leading-relaxed">
        {msg.content}
      </div>
    </div>
  );
}

function AdminMsg({ msg }) {
  return (
    <div className="flex gap-3 items-start max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-blue-800 border border-blue-600/40 flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-blue-200 text-xs font-bold">A</span>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-400">{msg.senderName}</span>
          <span className="text-[10px] tracking-wider uppercase bg-blue-900/50 text-blue-400 border border-blue-700/40 px-1.5 py-0.5 rounded">Admin Judge</span>
          <span className="text-[10px] text-slate-500 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className="bg-blue-900/40 border border-blue-700/30 text-blue-100 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm">
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function CounselMsg({ msg }) {
  const isClaimantCounsel = msg.senderRole === 'counsel_claimant';
  const accent  = isClaimantCounsel ? 'text-teal-400'    : 'text-emerald-400';
  const badge   = isClaimantCounsel
    ? 'bg-teal-900/40 text-teal-400 border-teal-700/40'
    : 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40';
  const bubble  = isClaimantCounsel
    ? 'bg-teal-900/40 border-teal-700/30 text-teal-100'
    : 'bg-emerald-900/40 border-emerald-700/30 text-emerald-100';

  return (
    <div className="flex gap-3 items-start max-w-[85%]">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isClaimantCounsel ? 'bg-teal-800 border border-teal-600/40' : 'bg-emerald-800 border border-emerald-600/40'}`}>
        <Briefcase size={13} className={accent} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${accent}`}>{msg.senderName}</span>
          <span className={`text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border ${badge}`}>
            {isClaimantCounsel ? "Claimant's Counsel" : "Respondent's Counsel"}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className={`border rounded-xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm ${bubble}`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function MyMsg({ msg }) {
  const typeConfig = {
    evidence: { bubble: 'bg-amber-800/50 border-amber-600/30 text-amber-100', badge: 'Evidence' },
    question: { bubble: 'bg-purple-900/50 border-purple-600/30 text-purple-100', badge: 'Question' },
    text:     { bubble: 'bg-slate-700 border-slate-600/40 text-slate-100', badge: null },
  };
  const cfg = typeConfig[msg.messageType] || typeConfig.text;

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 mb-1">
        {cfg.badge && (
          <span className="text-[10px] tracking-wider uppercase text-slate-500 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
            {cfg.badge}
          </span>
        )}
        <span className="text-[10px] text-slate-500 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
      </div>
      <div className={`border rounded-xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm max-w-[80%] ${cfg.bubble}`}>
        {msg.content}
      </div>
    </div>
  );
}

function OtherPartyMsg({ msg, isClaimant }) {
  const accent = isClaimant ? 'text-rose-400' : 'text-sky-400';
  const badge  = isClaimant
    ? 'bg-rose-900/40 text-rose-400 border-rose-700/40'
    : 'bg-sky-900/40 text-sky-400 border-sky-700/40';

  return (
    <div className="flex gap-3 items-start max-w-[85%]">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold ${isClaimant ? 'bg-rose-900/50 text-rose-300 border border-rose-700/40' : 'bg-sky-900/50 text-sky-300 border border-sky-700/40'}`}>
        {(msg.senderName || '?').charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${accent}`}>{msg.senderName}</span>
          <span className={`text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border ${badge}`}>
            {isClaimant ? 'Claimant' : 'Respondent'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{format(new Date(msg.createdAt), 'HH:mm')}</span>
        </div>
        <div className="bg-slate-800 border border-slate-700/60 text-slate-200 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm">
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
    credit:  { cls: 'bg-green-900/40 border-green-600/40 text-green-300',   icon: '💰' },
    refund:  { cls: 'bg-sky-900/40 border-sky-600/40 text-sky-300',         icon: '↩️' },
    debit:   { cls: 'bg-orange-900/40 border-orange-600/40 text-orange-300',icon: '📤' },
    penalty: { cls: 'bg-red-900/40 border-red-600/40 text-red-300',         icon: '⚠️' },
  };
  const style = myOutcome ? (outcomeStyle[myOutcome.outcome] || outcomeStyle.refund) : null;

  return (
    <div className="bg-amber-950/60 border-b border-amber-700/30 px-4 py-3 flex-shrink-0 space-y-2">
      <div className="flex items-center gap-2">
        <ShieldCheck size={15} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs font-bold tracking-wider uppercase text-amber-400">
          Ruling: {DECISION_LABELS[ruling.decision] || ruling.decision}
        </p>
      </div>
      {ruling.adminNote && (
        <p className="text-xs text-amber-600/80 italic pl-6">"{ruling.adminNote}"</p>
      )}
      {myOutcome && (
        <div className={`ml-6 border rounded-lg px-3 py-2 text-xs font-semibold ${style.cls}`}>
          {style.icon} {myOutcome.label}
          {myOutcome.amountKobo > 0 && <span className="font-bold"> · {formatBC(myOutcome.amountKobo)}</span>}
        </div>
      )}
    </div>
  );
}

// ── Counsel panel ──────────────────────────────────────────────────────────────

function CounselPanel({ room, myRole, onHire }) {
  const snap              = room.swapSnapshot || {};
  const claimantCounsel   = snap.claimantCounselName   || null;
  const respondentCounsel = snap.respondentCounselName || null;
  const isClosed          = room.status !== 'active';
  const canHire = !isClosed && (
    (myRole === 'claimant'   && !claimantCounsel) ||
    (myRole === 'respondent' && !respondentCounsel)
  );

  return (
    <div className="bg-slate-900/80 border-b border-slate-700/50 px-4 py-2 flex-shrink-0">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex gap-4 text-xs min-w-0">
          <span>
            <span className="text-rose-400/70 font-semibold tracking-wide">Claimant: </span>
            {claimantCounsel
              ? <span className="text-teal-400"><Briefcase size={9} className="inline mr-0.5" />{claimantCounsel}</span>
              : <span className="text-slate-600 italic">unrepresented</span>}
          </span>
          <span>
            <span className="text-sky-400/70 font-semibold tracking-wide">Respondent: </span>
            {respondentCounsel
              ? <span className="text-emerald-400"><Briefcase size={9} className="inline mr-0.5" />{respondentCounsel}</span>
              : <span className="text-slate-600 italic">unrepresented</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {room.tier === 'legal' && (
            <span className="text-[10px] tracking-wider uppercase bg-purple-900/50 text-purple-400 border border-purple-700/40 px-2 py-0.5 rounded font-semibold">
              Legal Tier
            </span>
          )}
          {canHire && (
            <button
              onClick={onHire}
              className="flex items-center gap-1 text-[10px] tracking-wider uppercase font-semibold bg-amber-800/40 hover:bg-amber-700/50 text-amber-400 border border-amber-700/40 px-2.5 py-1 rounded transition-colors"
            >
              <Briefcase size={9} />
              Hire Counsel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stage progress bar ─────────────────────────────────────────────────────────

function StageProgress({ stage }) {
  const currentIdx = STAGES.indexOf(stage);

  return (
    <div className="flex items-center px-4 py-3 gap-0">
      {STAGES.map((s, i) => {
        const meta    = STAGE_META[s];
        const isDone  = i < currentIdx;
        const isActive = i === currentIdx;
        const isLast  = i === STAGES.length - 1;

        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                isDone
                  ? 'bg-amber-500 border-amber-500 text-slate-900'
                  : isActive
                  ? 'bg-slate-800 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 border-slate-700 text-slate-600'
              }`}>
                {isDone ? '✓' : meta.num}
              </div>
              <span className={`text-[9px] tracking-wider uppercase font-medium hidden sm:block ${
                isActive ? 'text-amber-400' : isDone ? 'text-amber-600' : 'text-slate-700'
              }`}>
                {meta.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-px mx-1 transition-colors ${
                isDone ? 'bg-amber-500' : 'bg-slate-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Lawyer Directory Modal ─────────────────────────────────────────────────────

function LawyerDirectoryModal({ roomId, onClose }) {
  const [search, setSearch]         = useState('');
  const [specialization, setSpec]   = useState('');
  const [selectedLawyer, setLawyer] = useState(null);
  const [feeInput, setFeeInput]     = useState('');

  const { data: lawyersData, isLoading } = useQuery({
    queryKey: ['lawyers', specialization],
    queryFn: () => findLawyers({ specialization: specialization || undefined, limit: 50 }),
  });
  const lawyers = Array.isArray(lawyersData) ? lawyersData : (lawyersData?.lawyers ?? []);

  const hireMutation = useMutation({
    mutationFn: () => requestCounsel(roomId, selectedLawyer.id, Math.round(parseFloat(feeInput || '0') * 100)),
    onSuccess: () => {
      toast.success(`Counsel request sent to ${selectedLawyer.fullName}`);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to request counsel'),
  });

  const filtered = lawyers.filter(l =>
    !search || l.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-amber-800/40 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-700/60 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-amber-800/50 border border-amber-600/40 flex items-center justify-center">
            <BookOpen size={15} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold tracking-wider uppercase text-amber-400 text-sm">Legal Counsel Registry</p>
            <p className="text-[10px] text-slate-500 tracking-wide">Certified SwapNaija practitioners</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {!selectedLawyer ? (
          <>
            <div className="px-5 py-3 border-b border-slate-700/40 flex-shrink-0 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-800 border border-slate-700/60 text-slate-200 placeholder-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600/50 focus:border-amber-700"
                />
              </div>
              <select
                value={specialization}
                onChange={e => setSpec(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-slate-800 border border-slate-700/60 text-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600/50 focus:border-amber-700"
              >
                <option value="">All specializations</option>
                <option value="commercial">Commercial</option>
                <option value="consumer">Consumer Protection</option>
                <option value="property">Property</option>
                <option value="general">General Practice</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-sm">No practitioners found</div>
              )}
              {filtered.map(lawyer => (
                <button
                  key={lawyer.id}
                  onClick={() => setLawyer(lawyer)}
                  className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-700/40 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-900/40 border border-amber-700/30 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                      {lawyer.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-200">{lawyer.fullName}</p>
                        {lawyer.legalSpecialization && (
                          <span className="text-[10px] tracking-wider uppercase bg-slate-700 text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">
                            {lawyer.legalSpecialization}
                          </span>
                        )}
                      </div>
                      {lawyer.legalBio && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{lawyer.legalBio}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                        {lawyer.legalBarNumber && (
                          <span className="flex items-center gap-1">
                            <UserCheck size={9} />Bar: {lawyer.legalBarNumber}
                          </span>
                        )}
                        {lawyer.legalCasesTotal > 0 && (
                          <span className="flex items-center gap-1">
                            <Star size={9} />{lawyer.legalCasesTotal} case{lawyer.legalCasesTotal !== 1 ? 's' : ''}
                          </span>
                        )}
                        {lawyer.legalFeePerCaseKobo > 0 && (
                          <span className="text-amber-600 font-semibold">
                            {formatBC(lawyer.legalFeePerCaseKobo)} / case
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-600 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <button
              onClick={() => setLawyer(null)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft size={13} /> Back to registry
            </button>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-700/30 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                {selectedLawyer.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-200">{selectedLawyer.fullName}</p>
                {selectedLawyer.legalSpecialization && (
                  <p className="text-xs text-amber-600 tracking-wide">{selectedLawyer.legalSpecialization}</p>
                )}
                {selectedLawyer.legalBio && (
                  <p className="text-xs text-slate-500 mt-1">{selectedLawyer.legalBio}</p>
                )}
                {selectedLawyer.legalBarNumber && (
                  <p className="text-[10px] text-slate-600 mt-1 font-mono">Bar No: {selectedLawyer.legalBarNumber}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs tracking-wider uppercase text-slate-500 font-semibold block mb-1.5">
                Proposed retainer fee (BC)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={feeInput}
                onChange={e => setFeeInput(e.target.value)}
                placeholder={selectedLawyer.legalFeePerCaseKobo
                  ? `Suggested: ${(selectedLawyer.legalFeePerCaseKobo / 100).toFixed(2)}`
                  : '0.00'}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700/60 text-slate-200 placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-600/50 focus:border-amber-700"
              />
              <p className="text-[10px] text-slate-600 mt-1.5">
                The lawyer may counter-propose. Fee is deducted from your wallet upon acceptance.
              </p>
            </div>

            <button
              onClick={() => hireMutation.mutate()}
              disabled={hireMutation.isPending}
              className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {hireMutation.isPending
                ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                : <><Briefcase size={15} /> Submit Retainer Request</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DisputeRoom() {
  const { swapId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  useSocket();

  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [msgType, setMsgType]         = useState('text');
  const [stage, setStage]             = useState(null);
  const [roomId, setRoomId]           = useState(null);
  const [showLawyers, setShowLawyers] = useState(false);
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
    const onRuled = () => queryClient.invalidateQueries({ queryKey: ['dispute-room', swapId] });
    const onCounselUpdate = () => queryClient.invalidateQueries({ queryKey: ['dispute-room', swapId] });

    socket.on('dispute:message',           onMessage);
    socket.on('dispute:stage_changed',     onStageChanged);
    socket.on('dispute:ruled',             onRuled);
    socket.on('dispute:counsel_joined',    onCounselUpdate);
    socket.on('dispute:counsel_requested', onCounselUpdate);

    return () => {
      socket.emit('dispute:leave', roomId);
      socket.off('dispute:message',           onMessage);
      socket.off('dispute:stage_changed',     onStageChanged);
      socket.off('dispute:ruled',             onRuled);
      socket.off('dispute:counsel_joined',    onCounselUpdate);
      socket.off('dispute:counsel_requested', onCounselUpdate);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const room           = data?.room;
  const isClosed       = room?.status !== 'active';
  const myRole         = room
    ? ((room.claimantId?.id ?? room.claimantId) === user?.id ? 'claimant' : 'respondent')
    : null;
  const claimantUserId = room?.claimantId?.id ?? room?.claimantId;
  const myOutcome      = room ? computeMyOutcome(room, user?.id) : null;
  const stageMeta      = STAGE_META[stage] || STAGE_META.opening;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-slate-950">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700/50">
          <button onClick={() => navigate('/swaps')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft size={18} />
          </button>
          <Gavel size={18} className="text-amber-500" />
          <span className="font-semibold text-slate-300 tracking-wide">Dispute Court</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-900/30 border border-amber-700/30 flex items-center justify-center mx-auto">
              <Gavel size={24} className="text-amber-500" />
            </div>
            <p className="text-slate-500 text-sm tracking-wider uppercase">Loading case file…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError || !room) {
    return (
      <div className="flex flex-col h-screen bg-slate-950">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700/50">
          <button onClick={() => navigate('/swaps')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold text-slate-300">Dispute Court</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-900/20 border border-amber-800/30 flex items-center justify-center">
            <AlertTriangle size={28} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-slate-300 tracking-wide">Court room not yet convened</p>
            <p className="text-sm text-slate-600 mt-1">The court room will be opened shortly. Check back soon.</p>
          </div>
          <button onClick={() => navigate('/swaps')} className="text-sm text-amber-600 hover:text-amber-400 transition-colors">
            ← Return to My Swaps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-slate-900 border-b border-amber-900/30 flex-shrink-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => navigate('/swaps')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Court seal */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border border-amber-600/40 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Scale size={15} className="text-amber-200" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold tracking-widest uppercase text-amber-400">
                Dispute Court
              </p>
              {room.tier === 'legal' && (
                <span className="text-[10px] tracking-wider uppercase bg-purple-900/50 text-purple-400 border border-purple-700/40 px-1.5 py-0.5 rounded font-semibold">
                  Legal Tier
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono flex-wrap mt-0.5">
              <span>CASE #{swapId.slice(-8).toUpperCase()}</span>
              <span>·</span>
              <span className={myRole === 'claimant' ? 'text-rose-500' : 'text-sky-500'}>
                {myRole === 'claimant' ? 'CLAIMANT' : 'RESPONDENT'}
              </span>
              <span>·</span>
              <span className="text-amber-700">{stageMeta.icon} {stageMeta.label.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Stage progress */}
        <StageProgress stage={stage} />

        {/* Gold underline */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
      </div>

      {/* ── Dispute info strip ── */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <p className="text-[10px] tracking-widest uppercase font-semibold text-red-400">
            Case in session
          </p>
          {room.swapSnapshot?.disputeReason && (
            <>
              <span className="text-slate-700">·</span>
              <p className="text-[10px] text-slate-600 truncate italic">
                "{room.swapSnapshot.disputeReason}"
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Counsel panel ── */}
      <CounselPanel room={room} myRole={myRole} onHire={() => setShowLawyers(true)} />

      {/* ── Ruling banner ── */}
      {isClosed && <RulingBanner ruling={room.ruling} myOutcome={myOutcome} />}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
            <div className="w-20 h-20 rounded-full bg-amber-900/20 border border-amber-800/30 flex items-center justify-center">
              <Gavel size={32} className="text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-slate-400 tracking-wider uppercase text-sm">Court convening…</p>
              <p className="text-xs text-slate-700 mt-1">ARIA is preparing the opening statement</p>
            </div>
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
            return <AriaMsg key={id} msg={msg} isFinal={msg.messageType === 'decision'} />;
          }
          if (msg.senderRole === 'admin') {
            return <AdminMsg key={id} msg={msg} />;
          }
          if (msg.senderRole === 'counsel_claimant' || msg.senderRole === 'counsel_respondent') {
            const sid = msg.senderId?.id || msg.senderId?._id || msg.senderId;
            if (sid === user?.id) return <MyMsg key={id} msg={msg} />;
            return <CounselMsg key={id} msg={msg} />;
          }

          const senderId = msg.senderId?.id || msg.senderId?._id || msg.senderId;
          if (senderId === user?.id) return <MyMsg key={id} msg={msg} />;

          return <OtherPartyMsg key={id} msg={msg} isClaimant={senderId === claimantUserId} />;
        })}

        {sendMutation.isPending && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-[10px] text-slate-600 bg-slate-800/60 border border-slate-700/40 rounded-full px-3 py-1.5 font-mono">
              <Loader2 size={10} className="animate-spin" />
              submitting to court record…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      {!isClosed ? (
        <div className="bg-slate-900 border-t border-amber-900/20 px-4 pt-3 pb-safe flex-shrink-0">
          {/* Message type tabs */}
          <div className="flex gap-2 mb-2.5">
            {MSG_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMsgType(value)}
                className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                  msgType === value
                    ? 'bg-amber-700/30 text-amber-400 border-amber-700/50'
                    : 'bg-slate-800/60 text-slate-600 border-slate-700/40 hover:text-slate-400 hover:border-slate-600'
                }`}
              >
                <Icon size={11} />
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
                  ? 'Describe your evidence — photos, receipts, tracking numbers…'
                  : msgType === 'question'
                  ? 'Direct your question to the court or the other party…'
                  : 'Address the court — speak clearly and truthfully…'
              }
              className="flex-1 bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder-slate-700 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-700/50 focus:border-amber-800 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="w-10 h-10 bg-amber-700 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-lg"
            >
              {sendMutation.isPending
                ? <Loader2 size={15} className="text-white animate-spin" />
                : <Send size={15} className="text-white" />
              }
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border-t border-amber-900/20 px-4 py-5 text-center flex-shrink-0">
          <div className="inline-flex items-center gap-2 text-xs text-amber-700 mb-2">
            <div className="h-px w-8 bg-amber-800/50" />
            <span className="tracking-widest uppercase font-semibold">
              {room.status === 'resolved' ? 'Ruling Issued — Proceedings Closed' : 'Proceedings Closed'}
            </span>
            <div className="h-px w-8 bg-amber-800/50" />
          </div>
          <p className="text-xs text-slate-600 mb-3">No further submissions may be entered into the record.</p>
          <button
            onClick={() => navigate('/swaps')}
            className="text-xs text-amber-700 hover:text-amber-500 transition-colors tracking-wide"
          >
            ← Return to My Swaps
          </button>
        </div>
      )}

      {/* ── Lawyer directory modal ── */}
      {showLawyers && (
        <LawyerDirectoryModal roomId={roomId} onClose={() => setShowLawyers(false)} />
      )}
    </div>
  );
}
