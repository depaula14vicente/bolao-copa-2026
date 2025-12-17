import React, { useMemo } from 'react';
import { Match } from '../types';
import { TEAM_FLAGS } from '../constants';
import { Trophy, Calendar, CheckCircle } from 'lucide-react';

interface OfficialResultsProps {
  matches: Match[];
}

export const OfficialResults: React.FC<OfficialResultsProps> = ({ matches }) => {
  
  // Filter only matches that have official results
  const completedMatches = useMemo(() => {
    return matches.filter(m => m.officialScoreA !== undefined && m.officialScoreB !== undefined);
  }, [matches]);

  const getFlagUrl = (teamName: string) => {
    const code = TEAM_FLAGS[teamName];
    return code ? `https://flagcdn.com/w80/${code}.png` : null;
  };

  const FlagImage = ({ team }: { team: string }) => {
      const flagUrl = getFlagUrl(team);
      if (flagUrl) {
        return <img src={flagUrl} alt={team} className="w-10 h-7 object-cover rounded shadow-sm" />;
      }
      return <div className="w-10 h-7 bg-gray-200 dark:bg-slate-700 rounded shadow-sm"></div>;
  };

  // Group by date
  const matchesByDate: Record<string, Match[]> = {};
  completedMatches.forEach(match => {
      const dateKey = match.date.split(' - ')[0]; // Extract "DD/MM"
      if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];
      matchesByDate[dateKey].push(match);
  });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle size={120} className="text-white" />
        </div>
        <h2 className="text-2xl font-black flex items-center gap-2 relative z-10">
          <CheckCircle className="w-6 h-6 text-green-200" />
          Resultados Oficiais
        </h2>
        <p className="text-green-50 text-sm mt-1 opacity-90 relative z-10">
           Confira abaixo os placares reais das partidas já realizadas na Copa 2026.
        </p>
      </div>

      {completedMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
              <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-full mb-4">
                  <Trophy size={48} className="text-slate-300 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum resultado oficial ainda.</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                  Os placares reais dos jogos aparecerão aqui assim que as partidas forem concluídas e oficializadas.
              </p>
          </div>
      ) : (
      <div className="space-y-6">
        {Object.entries(matchesByDate).map(([date, dateMatches]) => (
            <div key={date} className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3 px-2">
                    <Calendar size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{date}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateMatches.map(match => (
                        <div key={match.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center justify-between">
                            {/* Team A */}
                            <div className="flex items-center gap-3 flex-1">
                                <FlagImage team={match.teamA} />
                                <span className={`font-bold text-sm sm:text-base whitespace-normal ${match.officialScoreA! > match.officialScoreB! ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {match.teamA}
                                </span>
                            </div>

                            {/* Score */}
                            <div className="flex items-center gap-2 px-3">
                                <span className="text-2xl font-black text-slate-800 dark:text-white">{match.officialScoreA}</span>
                                <span className="text-xs text-slate-400">X</span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white">{match.officialScoreB}</span>
                            </div>

                            {/* Team B */}
                            <div className="flex items-center justify-end gap-3 flex-1 text-right">
                                <span className={`font-bold text-sm sm:text-base whitespace-normal ${match.officialScoreB! > match.officialScoreA! ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {match.teamB}
                                </span>
                                <FlagImage team={match.teamB} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
      )}
    </div>
  );
};