import React, { useMemo } from 'react';
import { Match, ScoringRule } from '../types';
import { MapPin, ShieldQuestion, Lock, CheckCircle2, XCircle, Trophy, Minus, Check, Eye, EyeOff } from 'lucide-react';
import { TEAM_FLAGS } from '../constants';

interface MatchCardProps {
  match: Match;
  userId: string; // ID do usuário logado para saber qual aposta mostrar
  onScoreChange: (id: string, team: 'A' | 'B', score: string) => void;
  onViewDetails: (match: Match) => void;
  // lockHours removed
  specialTeams: string[];
  specialPhases: string[];
  scoringRules: ScoringRule[];
  isAdmin?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, userId, onScoreChange, onViewDetails, specialTeams, specialPhases, scoringRules, isAdmin = false }) => {
  // Determine if this match is special based on dynamic config (Teams or Phase)
  const isSpecialTeam = specialTeams.includes(match.teamA) || specialTeams.includes(match.teamB);
  const isSpecialPhase = specialPhases.includes(match.group);
  const isSpecial = isSpecialTeam || isSpecialPhase;
  const hasOfficialResult = match.officialScoreA !== undefined && match.officialScoreB !== undefined;

  // Logic to determine if match is locked
  const isLocked = useMemo(() => {
    try {
      const now = new Date();
      const isGroupStage = match.group.startsWith('Grupo');

      // REGRA: Palpites da primeira fase permitidos até o dia anterior ao início (10/06)
      // Bloqueio a partir de 11/06/2026 00:00:00
      if (isGroupStage) {
          const groupStageDeadline = new Date(2026, 5, 11, 0, 0, 0); // Mês 5 é Junho (index 0)
          return now >= groupStageDeadline;
      }

      // Lógica para Mata-Mata: Bloqueio no início do dia do jogo (00:00:00)
      // "até um dia antes" implica que o bloqueio ocorre quando o dia do jogo começa.
      const [datePart] = match.date.split(' - ');
      const [day, month] = datePart.split('/').map(Number);
      
      // Data limite: 00:00 do dia do jogo
      const specificDeadline = new Date(2026, month - 1, day, 0, 0, 0);

      return now >= specificDeadline;

    } catch (e) {
      return false;
    }
  }, [match.date, match.group]);

  // Get current user's bet
  const userBet = match.bets?.[userId];
  const userScoreA = userBet?.scoreA;
  const userScoreB = userBet?.scoreB;

  // --- CALCULATION LOGIC ---
  const pointsData = useMemo(() => {
    // Only calculate if we have user bets AND official results
    if (userScoreA === undefined || userScoreB === undefined || 
        match.officialScoreA === undefined || match.officialScoreB === undefined) {
      return null;
    }

    const uA = userScoreA;
    const uB = userScoreB;
    const oA = match.officialScoreA;
    const oB = match.officialScoreB;

    let basePoints = 0;
    let label = "Errou";
    // Default / Error Style
    let colorClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
    let icon = <XCircle size={18} />;

    // 1. Exact Score (Cravada)
    if (uA === oA && uB === oB) {
        basePoints = scoringRules.find(r => r.id === '1')?.points || 6;
        label = "NA MOSCA!";
        // Success / Gold Style
        colorClass = "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700 ring-1 ring-green-400/50";
        icon = <Trophy size={18} className="text-yellow-600 dark:text-yellow-400 fill-yellow-600/20" />;
    } else {
        // Determine Winners
        const userWinner = uA > uB ? 'A' : (uB > uA ? 'B' : 'Draw');
        const officialWinner = oA > oB ? 'A' : (oB > oA ? 'B' : 'Draw');

        if (userWinner === officialWinner) {
            if (userWinner === 'Draw') {
                // Correct Draw but wrong score
                basePoints = scoringRules.find(r => r.id === '4')?.points || 2;
                label = "Acertou Empate";
                colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800";
                icon = <Minus size={18} className="rotate-90" />;
            } else {
                // Correct Winner
                // Check if one score is correct
                if (uA === oA || uB === oB) {
                    basePoints = scoringRules.find(r => r.id === '2')?.points || 3;
                    label = "Vencedor + 1 Placar";
                    colorClass = "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800";
                    icon = <CheckCircle2 size={18} />;
                } else {
                    basePoints = scoringRules.find(r => r.id === '3')?.points || 2;
                    label = "Acertou Vencedor";
                    colorClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
                    icon = <Check size={18} />;
                }
            }
        }
    }

    const multiplier = isSpecial ? 2 : 1;
    const finalPoints = basePoints * multiplier;

    return { points: finalPoints, label, colorClass, multiplier, icon };
  }, [userScoreA, userScoreB, match.officialScoreA, match.officialScoreB, isSpecial, scoringRules]);


  const getFlagUrl = (teamName: string) => {
    const code = TEAM_FLAGS[teamName];
    return code ? `https://flagcdn.com/w160/${code}.png` : null;
  };

  const FlagImage = ({ team }: { team: string }) => {
    const flagUrl = getFlagUrl(team);
    if (flagUrl) {
      return (
        <div className={`w-14 h-10 shadow-md rounded-md overflow-hidden ring-1 ring-gray-300 dark:ring-slate-700/50 relative transition-transform duration-200 ${!isLocked && 'hover:scale-105'}`}>
           <img src={flagUrl} alt={team} className={`w-full h-full object-cover ${isLocked ? 'grayscale-[0.5]' : ''}`} />
           <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-md"></div>
        </div>
      );
    }
    return (
      <div className="w-14 h-14 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner ring-2 ring-gray-100 dark:ring-slate-800">
         <ShieldQuestion size={24} />
      </div>
    );
  };

  // Determine if details button should be visible (Locked OR Admin)
  // REGRA: "Apenas quando encerrar o limite de apostas" (isLocked)
  const showDetailsButton = isLocked || isAdmin;

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 flex flex-col justify-between h-full ${
      isLocked 
        ? 'bg-gray-100 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800'
        : isSpecial 
          ? 'border-yellow-400/50 dark:border-yellow-500/70 bg-gradient-to-br from-yellow-50 to-green-50 dark:from-green-900/30 dark:to-yellow-900/10 hover:shadow-md' 
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md'
    }`}>
      
      {isLocked && <div className="absolute top-0 left-0 right-0 h-1 bg-gray-300 dark:bg-slate-700 z-10"></div>}

      {isSpecial && !isLocked && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-b-lg shadow-sm bg-gradient-to-r from-yellow-500 to-green-600 text-white z-10 border-x border-b border-yellow-600/20">
          x2 PONTOS
        </div>
      )}
      
      {/* Top Section: Info */}
      <div className="flex justify-between items-start text-xs text-slate-500 dark:text-slate-400 mb-6">
        <div className="flex flex-col gap-1 max-w-[70%]">
          <div className="flex items-center gap-2">
             <span className={`font-bold ${isLocked ? 'text-slate-500' : isSpecial ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {match.group}
             </span>
             {isLocked && !hasOfficialResult && (
               <span className="flex items-center gap-1 bg-gray-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                 <Lock size={10} /> Encerrado
               </span>
             )}
             {hasOfficialResult && (
               <span className="flex items-center gap-1 bg-slate-800 text-white px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                 Finalizado
               </span>
             )}
          </div>
          {match.location && (
            <div className="flex items-start gap-1 text-slate-400 dark:text-slate-500">
              <MapPin size={10} className="mt-0.5 flex-shrink-0" />
              <span className="leading-tight">{match.location}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
             {/* View Others Button - Visible if Locked OR Admin */}
             {showDetailsButton && (
                 <button 
                    onClick={() => onViewDetails(match)}
                    className={`p-1.5 rounded-full transition-colors ${
                      !isLocked && isAdmin 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ring-1 ring-yellow-400/50' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400'
                    }`}
                    title={!isLocked && isAdmin ? "Espiar Palpites (Admin)" : "Ver palpites da galera"}
                 >
                     <Eye size={14} />
                 </button>
             )}

            <div className={`px-2 py-1 rounded border flex-shrink-0 ${
            isLocked
                ? 'bg-gray-200 border-gray-300 text-slate-500 dark:bg-slate-800 dark:border-slate-700'
                : isSpecial 
                ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700/50 dark:text-green-200' 
                : 'bg-gray-100 border-gray-200 dark:bg-slate-900/50 dark:border-slate-700/50'
            }`}>
            {match.date}
            </div>
        </div>
      </div>

      {/* Teams & Inputs */}
      <div className="flex items-center justify-between gap-3 relative z-20 mb-2">
        {/* Team A */}
        <div className="flex-1 flex flex-col items-center gap-2 group">
          <FlagImage team={match.teamA} />
          <span className={`text-sm font-bold text-center w-full leading-tight whitespace-normal ${specialTeams.includes(match.teamA) && !isLocked ? 'text-green-700 dark:text-yellow-400 uppercase tracking-wide' : 'text-slate-700 dark:text-slate-200'}`}>
            {match.teamA}
          </span>
        </div>

        {/* Inputs */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              disabled={isLocked}
              placeholder={isLocked ? '-' : '-'}
              className={`w-12 h-12 text-center text-xl font-black rounded-lg outline-none transition-all placeholder-gray-300 dark:placeholder-slate-600 appearance-none m-0 p-0 ${
                isLocked 
                  ? 'bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 text-slate-500 cursor-not-allowed'
                  : isSpecial 
                    ? 'bg-white dark:bg-slate-900/80 border-2 border-green-300 dark:border-green-600/50 focus:border-yellow-500 text-slate-800 dark:text-white focus:ring-4 focus:ring-yellow-500/20 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 dark:text-white'
              }`}
              value={userScoreA ?? ''}
              onChange={(e) => onScoreChange(match.id, 'A', e.target.value)}
            />
            <span className={`font-black ${isLocked ? 'text-slate-400' : isSpecial ? 'text-yellow-600 dark:text-yellow-500/80' : 'text-gray-400 dark:text-slate-600'}`}>X</span>
            <input
              type="number"
              min="0"
              disabled={isLocked}
              placeholder={isLocked ? '-' : '-'}
              className={`w-12 h-12 text-center text-xl font-black rounded-lg outline-none transition-all placeholder-gray-300 dark:placeholder-slate-600 appearance-none m-0 p-0 ${
                isLocked 
                  ? 'bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 text-slate-500 cursor-not-allowed'
                  : isSpecial 
                    ? 'bg-white dark:bg-slate-900/80 border-2 border-green-300 dark:border-green-600/50 focus:border-yellow-500 text-slate-800 dark:text-white focus:ring-4 focus:ring-yellow-500/20 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 dark:text-white'
              }`}
              value={userScoreB ?? ''}
              onChange={(e) => onScoreChange(match.id, 'B', e.target.value)}
            />
          </div>
        </div>

        {/* Team B */}
        <div className="flex-1 flex flex-col items-center gap-2 group">
           <FlagImage team={match.teamB} />
          <span className={`text-sm font-bold text-center w-full leading-tight whitespace-normal ${specialTeams.includes(match.teamB) && !isLocked ? 'text-green-700 dark:text-yellow-400 uppercase tracking-wide' : 'text-slate-700 dark:text-slate-200'}`}>
            {match.teamB}
          </span>
        </div>
      </div>

      {/* Official Result & Points Badge */}
      {hasOfficialResult && pointsData && (
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700 animate-fade-in-up">
            <div className="flex flex-col items-center gap-3">
                
                {/* Score Comparison (Small) */}
                <div className="flex items-center gap-3 text-xs opacity-75">
                   <div className="flex items-center gap-1">
                     <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">Resultado:</span>
                   </div>
                   <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                      <span>{match.teamA.substring(0,3).toUpperCase()}</span>
                      <span className="text-sm">{match.officialScoreA}</span>
                      <span>-</span>
                      <span className="text-sm">{match.officialScoreB}</span>
                      <span>{match.teamB.substring(0,3).toUpperCase()}</span>
                   </div>
                </div>

                {/* Points Pill */}
                <div className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border shadow-sm ${pointsData.colorClass}`}>
                    <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                        {pointsData.icon}
                        <span className="uppercase">{pointsData.label}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        {pointsData.points > 0 && <span className="text-[10px] font-bold uppercase mr-0.5">Ganhou</span>}
                        <span className="text-lg font-black leading-none">{pointsData.points}</span>
                        <span className="text-[10px] font-bold uppercase leading-none mt-1">pts</span>
                        {pointsData.multiplier > 1 && <span className="text-[10px] ml-0.5 opacity-80">(x{pointsData.multiplier})</span>}
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};