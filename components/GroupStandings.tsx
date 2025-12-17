import React, { useMemo } from 'react';
import { Match, User } from '../types';
import { TEAM_FLAGS } from '../constants';
import { Shield, TrendingUp, TrendingDown, Minus, AlertCircle, LayoutGrid } from 'lucide-react';

interface TeamStats {
  name: string;
  group?: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
}

interface GroupStandingsProps {
  matches: Match[];
  currentUser: User;
}

export const GroupStandings: React.FC<GroupStandingsProps> = ({ matches, currentUser }) => {
  
  // Logic to calculate standings dynamically
  const { sortedGroups, thirdPlaces } = useMemo(() => {
    const groups: Record<string, Record<string, TeamStats>> = {};
    const teamToGroupMap: Record<string, string> = {};

    // 1. Initialize Groups and Teams from matches
    matches.forEach(match => {
      // Only process group stage matches
      if (!match.group.startsWith('Grupo')) return;

      const groupName = match.group.replace('Grupo ', '');
      
      if (!groups[groupName]) {
        groups[groupName] = {};
      }

      [match.teamA, match.teamB].forEach(team => {
        if (!groups[groupName][team]) {
          groups[groupName][team] = {
            name: team,
            group: groupName,
            points: 0,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            gd: 0
          };
          teamToGroupMap[team] = groupName;
        }
      });
    });

    // 2. Calculate Stats based on user scores (bets)
    matches.forEach(match => {
      if (!match.group.startsWith('Grupo')) return;
      
      // Get current user's bet for this match
      const bet = match.bets?.[currentUser.username];
      if (!bet || bet.scoreA === undefined || bet.scoreB === undefined) return;

      const scoreA = bet.scoreA;
      const scoreB = bet.scoreB;

      const groupName = match.group.replace('Grupo ', '');
      const teamA = groups[groupName][match.teamA];
      const teamB = groups[groupName][match.teamB];

      if (teamA && teamB) {
        teamA.played += 1;
        teamB.played += 1;
        teamA.gf += scoreA;
        teamA.ga += scoreB;
        teamB.gf += scoreB;
        teamB.ga += scoreA;

        teamA.gd = teamA.gf - teamA.ga;
        teamB.gd = teamB.gf - teamB.ga;

        if (scoreA > scoreB) {
          teamA.points += 3;
          teamA.won += 1;
          teamB.lost += 1;
        } else if (scoreA < scoreB) {
          teamB.points += 3;
          teamB.won += 1;
          teamA.lost += 1;
        } else {
          teamA.points += 1;
          teamB.points += 1;
          teamA.drawn += 1;
          teamB.drawn += 1;
        }
      }
    });

    // 3. Sort Groups
    const sortedGroupsObj: Record<string, TeamStats[]> = {};
    const thirdPlacesList: TeamStats[] = [];

    Object.keys(groups).sort().forEach(groupName => {
      sortedGroupsObj[groupName] = Object.values(groups[groupName]).sort((a, b) => {
        // Criterion 1: Points
        if (b.points !== a.points) return b.points - a.points;

        // Criterion 2: Head-to-Head (Confronto Direto)
        // Find match between A and B
        const match = matches.find(m => 
            (m.teamA === a.name && m.teamB === b.name) || 
            (m.teamA === b.name && m.teamB === a.name)
        );

        if (match) {
             const bet = match.bets?.[currentUser.username];
             if (bet && bet.scoreA !== undefined && bet.scoreB !== undefined) {
                 const scoreA = match.teamA === a.name ? bet.scoreA : bet.scoreB;
                 const scoreB = match.teamA === a.name ? bet.scoreB : bet.scoreA;
                 
                 // If scoreB > scoreA, B comes first (return positive)
                 // If scoreA > scoreB, A comes first (return negative)
                 if (scoreB !== scoreA) return scoreB - scoreA;
             }
        }

        // Criterion 3: Goal Difference (Saldo de Gols)
        if (b.gd !== a.gd) return b.gd - a.gd;

        // Criterion 4: Goals For (Mais Gols Marcados)
        return b.gf - a.gf;
      });

      // Collect 3rd place for the special table
      if (sortedGroupsObj[groupName].length >= 3) {
          thirdPlacesList.push(sortedGroupsObj[groupName][2]);
      }
    });

    // Sort 3rd Places (Criteria: Points, GD, GF)
    thirdPlacesList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });

    return { sortedGroups: sortedGroupsObj, thirdPlaces: thirdPlacesList };
  }, [matches, currentUser.username]);

  const getFlagUrl = (teamName: string) => {
    const code = TEAM_FLAGS[teamName];
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Introduction Card with Watermark */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <LayoutGrid size={120} className="text-white" />
        </div>
        <h2 className="text-2xl font-black flex items-center gap-2 relative z-10">
          <Shield className="w-6 h-6 text-blue-200" />
          Simulador de Classificação
        </h2>
        <p className="text-blue-100 text-sm mt-1 relative z-10">
          A tabela abaixo é calculada automaticamente com base nos seus palpites.
        </p>
        <div className="mt-3 text-xs bg-blue-700/30 p-2 rounded border border-blue-400/30 flex gap-2 relative z-10 w-fit">
           <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
           <span>Critérios: 1. Pontos, 2. Confronto Direto, 3. Saldo, 4. Gols Pró.</span>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(sortedGroups).map(([groupName, teams]) => (
          <div key={groupName} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md transition-colors">
            <div className="bg-gray-50 dark:bg-slate-900/50 px-4 py-2 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-white">GRUPO {groupName}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700/50">
                    <th className="pl-4 py-2 text-left w-10">#</th>
                    <th className="py-2 text-left">Seleção</th>
                    <th className="pr-4 py-2 text-center w-10 font-bold text-slate-600 dark:text-slate-300">PTS</th>
                    <th className="py-2 text-center w-8 hidden sm:table-cell" title="Jogos">J</th>
                    <th className="py-2 text-center w-8 hidden sm:table-cell" title="Vitórias">V</th>
                    <th className="py-2 text-center w-8 hidden sm:table-cell" title="Empates">E</th>
                    <th className="py-2 text-center w-8 hidden sm:table-cell" title="Derrotas">D</th>
                    <th className="py-2 text-center w-10" title="Saldo de Gols">SG</th>
                    <th className="pr-4 py-2 text-center w-8" title="Gols Pró">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {(teams as TeamStats[]).map((team, index) => {
                    const isQualified = index < 2; 
                    const isThird = index === 2;

                    return (
                      <tr key={team.name} className="hover:bg-gray-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="pl-4 py-2.5 relative">
                           {isQualified && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}
                           {isThird && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500/50"></div>}
                           <span className={`font-mono font-bold text-xs ${index < 2 ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                             {index + 1}
                           </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            {getFlagUrl(team.name) ? (
                              <img src={getFlagUrl(team.name)!} alt={team.name} className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                            ) : (
                              <div className="w-5 h-3.5 bg-gray-200 dark:bg-slate-600 rounded-[2px]"></div>
                            )}
                            <span className={`font-medium whitespace-normal ${team.name === 'Brasil' ? 'text-green-700 dark:text-green-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                              {team.name}
                            </span>
                          </div>
                        </td>
                        <td className="pr-4 py-2.5 text-center font-bold text-slate-800 dark:text-white bg-gray-50/50 dark:bg-slate-700/30">
                          {team.points}
                        </td>
                        <td className="py-2.5 text-center text-slate-500 dark:text-slate-400 hidden sm:table-cell">{team.played}</td>
                        <td className="py-2.5 text-center text-slate-500 dark:text-slate-400 hidden sm:table-cell">{team.won}</td>
                        <td className="py-2.5 text-center text-slate-500 dark:text-slate-400 hidden sm:table-cell">{team.drawn}</td>
                        <td className="py-2.5 text-center text-slate-500 dark:text-slate-400 hidden sm:table-cell">{team.lost}</td>
                        <td className="py-2.5 text-center font-medium text-slate-600 dark:text-slate-300">
                          {team.gd > 0 ? `+${team.gd}` : team.gd}
                        </td>
                        <td className="pr-4 py-2.5 text-center text-slate-500 dark:text-slate-400">{team.gf}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Best 3rd Place Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md transition-colors mt-8">
        <div className="bg-yellow-500 dark:bg-yellow-600 px-4 py-3 flex justify-between items-center text-white">
          <span className="font-bold uppercase tracking-wider text-sm md:text-base">Melhores Terceiros Colocados</span>
          <span className="text-xs bg-black/20 px-2 py-1 rounded">Top 8 Classificam</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                <th className="pl-4 py-3 text-left w-10">Pos</th>
                <th className="py-3 text-left">Seleção</th>
                <th className="py-3 text-center">Grupo</th>
                <th className="pr-4 py-3 text-center font-bold">PTS</th>
                <th className="py-3 text-center" title="Saldo de Gols">SG</th>
                <th className="pr-4 py-3 text-center" title="Gols Pró">GP</th>
                <th className="pr-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {thirdPlaces.map((team, index) => {
                const isQualified = index < 8; // Top 8 qualify
                
                return (
                  <tr key={team.name} className={`transition-colors ${isQualified ? 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20' : 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20'}`}>
                    <td className="pl-4 py-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {index + 1}º
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getFlagUrl(team.name) ? (
                          <img src={getFlagUrl(team.name)!} alt={team.name} className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                        ) : (
                          <div className="w-5 h-3.5 bg-gray-200 dark:bg-slate-600 rounded-[2px]"></div>
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-200 whitespace-normal">{team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-slate-500 dark:text-slate-400 font-bold">{team.group}</td>
                    <td className="pr-4 py-3 text-center font-bold text-slate-800 dark:text-white">
                      {team.points}
                    </td>
                    <td className="py-3 text-center text-slate-600 dark:text-slate-400">
                       {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className="pr-4 py-3 text-center text-slate-600 dark:text-slate-400">
                       {team.gf}
                    </td>
                    <td className="pr-4 py-3 text-right">
                       {isQualified ? (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                           Classificado
                         </span>
                       ) : (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                           Eliminado
                         </span>
                       )}
                    </td>
                  </tr>
                );
              })}
              {thirdPlaces.length === 0 && (
                 <tr>
                   <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                     Ainda não há jogos suficientes para calcular os terceiros colocados.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};