import React, { useState } from 'react';
import { RULES_TEXT } from '../constants';
import { ScoringRule, PrizeConfig } from '../types';
import { AlertCircle, Award, CheckCircle2, FileText, Info, ChevronDown, ChevronUp, Scale } from 'lucide-react';

interface RulesSectionProps {
  scoringRules: ScoringRule[];
  ticketPrice: number;
  prizeDistribution: PrizeConfig;
  specialTeams?: string[];
  specialPhases?: string[];
}

interface RuleCardProps {
    title: string;
    icon: any;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    gradientClasses?: string;
}

const RuleCard = ({ 
    title, 
    icon: Icon, 
    children, 
    defaultOpen = false,
    gradientClasses = "from-red-600 to-red-500 dark:from-red-700 dark:to-red-600"
}: RuleCardProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md transition-all">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-gradient-to-r ${gradientClasses} px-4 py-3 flex justify-between items-center transition-all`}
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-white" />
                    <h2 className="text-white font-bold uppercase tracking-wider text-sm sm:text-base">{title}</h2>
                </div>
                {isOpen ? <ChevronUp className="text-white opacity-80" /> : <ChevronDown className="text-white opacity-80" />}
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
};

export const RulesSection: React.FC<RulesSectionProps> = ({ scoringRules, ticketPrice, prizeDistribution, specialTeams = [], specialPhases = [] }) => {
  return (
    <div className="space-y-4 animate-fade-in pb-10">
      
        {/* Intro - Agora fechado por padrão */}
        <RuleCard title="I - Introdução" icon={FileText} defaultOpen={false}>
            <div className="p-5 text-slate-600 dark:text-slate-300 space-y-3">
                <div className="flex items-start gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-2">
                <span className="font-mono text-green-600 dark:text-green-400 font-bold">1.</span>
                <p>Valor da participação: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketPrice)}</strong></p>
                </div>
                {RULES_TEXT.introBase.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3 border-b border-gray-100 dark:border-slate-700/50 last:border-0 pb-2 last:pb-0">
                    <span className="font-mono text-green-600 dark:text-green-400 font-bold">{idx + 2}.</span>
                    <p>{rule}</p>
                </div>
                ))}
            </div>
        </RuleCard>

        {/* Prizes */}
        <RuleCard title="II - Premiação" icon={Award}>
          <div className="p-5 text-slate-600 dark:text-slate-300 space-y-4">
             <p className="text-xs text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">% sobre o arrecadado</p>
             <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700/30">
                 <span className="font-bold text-slate-800 dark:text-white">1º Lugar</span>
                 <span className="font-mono text-yellow-600 dark:text-yellow-400 font-bold text-lg">{prizeDistribution.first}%</span>
             </div>
             <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700/30">
                 <span className="font-bold text-slate-800 dark:text-white">2º Lugar</span>
                 <span className="font-mono text-yellow-600 dark:text-yellow-400 font-bold text-lg">{prizeDistribution.second}%</span>
             </div>
             <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700/30">
                 <span className="font-bold text-slate-800 dark:text-white">3º Lugar</span>
                 <span className="font-mono text-yellow-600 dark:text-yellow-400 font-bold text-lg">{prizeDistribution.third}%</span>
             </div>
          </div>
        </RuleCard>

        {/* Points */}
        <RuleCard title="III - Contagem de Pontos" icon={CheckCircle2}>
          <div className="p-0">
             <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
               <thead className="bg-gray-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs">
                 <tr>
                   <th className="px-6 py-3">Critério</th>
                   <th className="px-6 py-3 text-right">Pontos</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                 {scoringRules.map((item, idx) => (
                   <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                     <td className="px-6 py-3 font-medium flex items-center gap-3">
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">{String.fromCharCode(65 + idx)}</span>
                        {item.criteria}
                     </td>
                     <td className="px-6 py-3 text-right font-bold text-green-600 dark:text-green-400">{item.points.toString().padStart(2, '0')}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </RuleCard>

        {/* Tie Breaker */}
        <RuleCard 
            title="IV - Critério de Desempate" 
            icon={Info} 
            gradientClasses="from-slate-600 to-slate-500 dark:from-slate-700 dark:to-slate-600"
        >
          <div className="p-5 text-slate-600 dark:text-slate-300 space-y-2">
             {RULES_TEXT.tieBreakers.map((item, idx) => (
               <div key={idx} className="flex items-center gap-3">
                 <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold border border-gray-200 dark:border-slate-600">{idx + 1}º</span>
                 <p>{item}</p>
               </div>
             ))}
          </div>
        </RuleCard>

        {/* Notes */}
        <RuleCard 
            title="V - Observações" 
            icon={AlertCircle} 
            gradientClasses="from-slate-600 to-slate-500 dark:from-slate-700 dark:to-slate-600"
        >
          <div className="p-5 text-slate-600 dark:text-slate-300 text-sm space-y-4">
            
             {/* Dynamic Special Teams/Phases */}
             <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-3 rounded-lg text-yellow-800 dark:text-yellow-100/80">
                 Os pontos serão considerados em <strong>DOBRO</strong> para jogos das seguintes seleções: 
                 <div className="flex flex-wrap gap-2 mt-2">
                   {specialTeams.length > 0 ? specialTeams.map(t => (
                     <span key={t} className="bg-yellow-200 dark:bg-yellow-800/50 px-2 py-0.5 rounded text-xs font-bold uppercase">{t}</span>
                   )) : <span className="text-xs italic">Nenhuma seleção definida</span>}
                 </div>
             </div>

             <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-3 rounded-lg text-yellow-800 dark:text-yellow-100/80">
                 Os pontos serão considerados em <strong>DOBRO</strong> para jogos das seguintes fases:
                 <div className="flex flex-wrap gap-2 mt-2">
                   {specialPhases.length > 0 ? specialPhases.map(p => (
                     <span key={p} className="bg-yellow-200 dark:bg-yellow-800/50 px-2 py-0.5 rounded text-xs font-bold uppercase">{p}</span>
                   )) : <span className="text-xs italic">Nenhuma fase definida</span>}
                 </div>
             </div>

             {RULES_TEXT.notes.map((note, idx) => (
               <div key={idx} className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/30 p-3 rounded-lg text-blue-800 dark:text-blue-100/80">
                 {note}
               </div>
             ))}
          </div>
        </RuleCard>

        {/* General Provisions - New Section */}
        <RuleCard 
            title="VI - Disposições Gerais" 
            icon={Scale} 
            gradientClasses="from-slate-700 to-slate-600 dark:from-slate-800 dark:to-slate-700"
        >
          <div className="p-5 text-slate-600 dark:text-slate-300 text-sm space-y-3">
             {RULES_TEXT.generalProvisions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 border-b border-gray-100 dark:border-slate-700/50 last:border-0 pb-2 last:pb-0">
                    <span className="font-mono text-slate-400 dark:text-slate-500 font-bold">•</span>
                    <p className="leading-relaxed">{item}</p>
                </div>
             ))}
          </div>
        </RuleCard>

    </div>
  );
};