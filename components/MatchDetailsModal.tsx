import React, { useMemo } from 'react';
import { Match, User, ScoringRule } from '../types';
import { X, Trophy, CheckCircle2, Minus, XCircle, AlertCircle } from 'lucide-react';

interface MatchDetailsModalProps {
  match: Match;
  users: User[];
  scoringRules: ScoringRule[];
  onClose: () => void;
  specialTeams: string[];
  specialPhases: string[];
  currentUser: User;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, users, scoringRules, onClose, specialTeams, specialPhases, currentUser }) => {
  
  const isSpecial = specialTeams.includes(match.teamA) || specialTeams.includes(match.teamB) || specialPhases.includes(match.group);
  const multiplier = isSpecial ? 2 : 1;
  const hasOfficial = match.officialScoreA !== undefined && match.officialScoreB !== undefined;

  const userBets = useMemo(() => {
    if (!match.bets) return [];

    return users
      .filter(u => match.bets && match.bets[u.username])
      .map(u => {
        const bet = match.bets![u.username];
        let points = 0;
        let status: 'exact' | 'winner' | 'draw' | 'loss' | 'pending' = 'pending';

        if (hasOfficial) {
            const oA = match.officialScoreA!;
            const oB = match.officialScoreB!;
            const uA = bet.scoreA;
            const uB = bet.scoreB;

            // FIX: Garantir que uA e uB não sejam undefined antes de comparar
            if (uA !== undefined && uB !== undefined) {
                if (uA === oA && uB === oB) {
                    points = (scoringRules.find(r => r.id === '1')?.points || 6) * multiplier;
                    status = 'exact';
                } else {
                    const userWinner = uA > uB ? 'A' : (uB > uA ? 'B' : 'Draw');
                    const officialWinner = oA > oB ? 'A' : (oB > oA ? 'B' : 'Draw');

                    if (userWinner === officialWinner) {
                        if (userWinner === 'Draw') {
                            points = (scoringRules.find(r => r.id === '4')?.points || 2) * multiplier;
                            status = 'draw';
                        } else {
                            if (uA === oA || uB === oB) {
                                points = (scoringRules.find(r => r.id === '2')?.points || 3) * multiplier;
                                status = 'winner'; // Vencedor + 1 placar
                            } else {
                                points = (scoringRules.find(r => r.id === '3')?.points || 2) * multiplier;
                                status = 'winner';
                            }
                        }
                    } else {
                        status = 'loss';
                    }
                }
            }
        }

        return {
            user: u,
            bet,
            points,
            status
        };
      })
      .sort((a, b) => b.points - a.points || a.user.name.localeCompare(b.user.name));
  }, [match, users, hasOfficial, scoringRules, multiplier]);

  // Avatar Helpers
  const getAvatarEmoji = (id: string | undefined) => {
      const AVATARS: Record<string, string> = {
          '1': '🦁', '2': '⚽', '3': '🦊', '4': '👽', '5': '🤖', '6': '🦄',
          '7': '😎', '8': '🇧🇷', '9': '🔥', '10': '💎', '11': '👑', '12': '🚀'
      };
      return AVATARS[id || ''] || '👤';
  };
  
  const getAvatarColor = (id: string | undefined) => {
      const COLORS: Record<string, string> = {
          '1': 'bg-yellow-500', '2': 'bg-green-500', '3': 'bg-orange-500', '4': 'bg-purple-500', '5': 'bg-slate-500', '6': 'bg-pink-500',
          '7': 'bg-blue-500', '8': 'bg-green-600', '9': 'bg-red-500', '10': 'bg-cyan-500', '11': 'bg-amber-400', '12': 'bg-indigo-500'
      };
      return COLORS[id || ''] || 'bg-gray-400';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                <div>
                   <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       Palpites da Galera
                       {hasOfficial && <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full uppercase">Finalizado</span>}
                   </h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400">{match.teamA} x {match.teamB}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-0">
                {hasOfficial && (
                     <div className="bg-slate-800 text-white py-3 flex justify-center items-center gap-4 shadow-inner">
                         <span className="text-sm font-bold uppercase tracking-wider">{match.teamA}</span>
                         <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                             <span className="text-2xl font-black">{match.officialScoreA}</span>
                             <span className="text-xs opacity-60">x</span>
                             <span className="text-2xl font-black">{match.officialScoreB}</span>
                         </div>
                         <span className="text-sm font-bold uppercase tracking-wider">{match.teamB}</span>
                     </div>
                )}

                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {userBets.length > 0 ? userBets.map((entry) => {
                        const isMe = entry.user.username === currentUser.username;
                        
                        return (
                        <div key={entry.user.username} className={`flex items-center justify-between p-4 transition-colors ${entry.status === 'exact' && !isMe ? 'bg-green-50/50 dark:bg-green-900/10' : ''} ${isMe ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}>
                             <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm text-white font-bold shadow-sm ${getAvatarColor(entry.user.avatar)}`}>
                                     {getAvatarEmoji(entry.user.avatar)}
                                 </div>
                                 <div>
                                     <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-1">
                                         {entry.user.name}
                                         {isMe && <span className="text-[9px] bg-yellow-200 text-yellow-800 px-1 rounded font-bold uppercase">Você</span>}
                                     </p>
                                     <p className="text-[10px] text-slate-400">@{entry.user.username}</p>
                                 </div>
                             </div>

                             <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-1 font-mono font-bold text-lg text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded border border-gray-200 dark:border-slate-700">
                                     <span>{entry.bet.scoreA}</span>
                                     <span className="text-slate-300 text-xs">-</span>
                                     <span>{entry.bet.scoreB}</span>
                                 </div>

                                 {hasOfficial && (
                                     <div className={`w-16 text-right flex flex-col items-end`}>
                                         <span className={`font-black text-lg leading-none ${entry.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-400'}`}>
                                            +{entry.points}
                                         </span>
                                         <div className="flex justify-end mt-0.5">
                                             {entry.status === 'exact' && <Trophy size={12} className="text-yellow-500" />}
                                             {entry.status === 'winner' && <CheckCircle2 size={12} className="text-blue-500" />}
                                             {entry.status === 'draw' && <Minus size={12} className="text-indigo-500 rotate-90" />}
                                             {entry.status === 'loss' && <XCircle size={12} className="text-red-300" />}
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                    )}) : (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                            <AlertCircle size={32} className="mb-2 opacity-50"/>
                            <p>Nenhum palpite registrado para este jogo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};