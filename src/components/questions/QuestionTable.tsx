import React from 'react';
import { Link } from 'react-router-dom';
import {
  Edit3,
  ExternalLink,
  Film,
  ShieldCheck,
  Eye,
  Wand2,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Square,
  CheckSquare,
} from 'lucide-react';
import { DifficultyLevel, Question, QuestionLanguage, QuestionStatus } from '../../types';
import { QuestionStatusBadge, VideoStatusBadge } from '../common/StatusBadge';
import { DifficultyBadge } from '../common/DifficultyBadge';
import { formatDisplayId } from '../../utils/formatters';

interface QuestionTableProps {
  questions: Question[];
  selectedQuestionIds?: string[];
  onToggleSelectQuestion?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onSelectQuestion?: (question: Question) => void;
  onSendToQueue?: (question: Question) => void;
}

export const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  selectedQuestionIds = [],
  onToggleSelectQuestion,
  onToggleSelectAll,
  onSelectQuestion,
  onSendToQueue,
}) => {
  const hasQuestions = Array.isArray(questions) && questions.length > 0;
  const allSelected =
    hasQuestions &&
    questions.length > 0 &&
    questions.every((q) => selectedQuestionIds.includes(q.id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto w-full">
        <table className={`w-full text-left border-collapse text-xs ${!hasQuestions ? 'table-fixed' : ''}`}>
          <thead>
            <tr className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider z-10">
              {onToggleSelectQuestion && (
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={onToggleSelectAll}
                    className="text-slate-400 hover:text-indigo-600 focus:outline-hidden"
                    title={allSelected ? 'Deselect All' : 'Select All'}
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
              )}
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Question ID</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Taxonomy (Topic &bull; Subtopic)</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Difficulty</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'min-w-[280px]' : ''}`}>Question Problem Statement</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Math Verification</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Question Status</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Video Stage</th>
              <th className={`py-3 px-4 font-semibold text-right ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {!hasQuestions ? (
              <tr>
                <td colSpan={onToggleSelectQuestion ? 9 : 8} className="py-8 px-4 text-center text-slate-500 text-xs">
                  No questions found matching the selected criteria.
                </td>
              </tr>
            ) : (
              questions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                const isTelugu =
                  q.language === QuestionLanguage.TELUGU ||
                  q.language === ('TELUGU' as any) ||
                  /[\u0C00-\u0C7F]/.test(q.questionText || '');

                // Math verification check
                const isMathVerified =
                  (q as any).mathVerified === true ||
                  q.status === QuestionStatus.APPROVED ||
                  (q as any).validationStatus === 'VERIFIED';

                return (
                  <tr
                    key={q.id}
                    id={`row-question-${(q.id || '').toLowerCase()}`}
                    className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-indigo-50/40' : ''
                    }`}
                    onClick={() => onSelectQuestion?.(q)}
                  >
                    {/* Checkbox */}
                    {onToggleSelectQuestion && (
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectQuestion(q.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400 mx-auto" />
                        )}
                      </td>
                    )}

                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                      <Link
                        to={`/questions/${q.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>{formatDisplayId(q.contentMasterId || q.id, 'question')}</span>
                      </Link>
                    </td>

                    {/* Topic & Subtopic */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 font-mono text-[11px]">{q.topicId || 'BP-TOP-001'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        {q.subtopicId ? (
                          <span className="text-slate-600 font-medium">{q.subtopicId}</span>
                        ) : (
                          <span className="text-slate-400 italic">No subtopic</span>
                        )}
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DifficultyBadge difficulty={q.difficulty as DifficultyLevel} size="sm" />
                    </td>

                    {/* Question snippet with Telugu typography */}
                    <td className="py-3 px-4">
                      <p
                        className={`line-clamp-2 text-slate-900 font-medium ${
                          isTelugu ? 'font-telugu leading-relaxed text-[13px]' : 'font-sans leading-normal text-xs'
                        }`}
                      >
                        {q.questionText}
                      </p>
                      {q.realWorldContext && (
                        <span className="text-[10px] text-slate-400 italic block mt-0.5">
                          Context: {q.realWorldContext}
                        </span>
                      )}
                    </td>

                    {/* Math Verification Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isMathVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Math: PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Math: REVIEW
                        </span>
                      )}
                    </td>

                    {/* Question Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <QuestionStatusBadge status={q.status} size="sm" />
                    </td>

                    {/* Video Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <VideoStatusBadge status={q.videoStatus} size="sm" />
                    </td>

                    {/* Row Quick Action Buttons */}
                    <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/questions/${q.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Question Details & Math Proof"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          to={`/studio?topicId=${q.topicId || 'BP-TOP-001'}&subtopicId=${q.subtopicId || 'BP-SUB-0001'}`}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Open Studio Editor"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => onSendToQueue?.(q)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Queue for Video Production"
                        >
                          <Film className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default QuestionTable;
