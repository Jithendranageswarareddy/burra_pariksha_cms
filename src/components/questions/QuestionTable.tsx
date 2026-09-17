import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, ExternalLink, Video, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { DifficultyLevel, Question, QuestionStatus } from '../../types';
import { QuestionStatusBadge, VideoStatusBadge } from '../common/StatusBadge';
import { DifficultyBadge } from '../common/DifficultyBadge';
import { Button } from '../../design-system/components/Button';
import { formatDisplayId } from '../../utils/formatters';

interface QuestionTableProps {
  questions: Question[];
  onSelectQuestion?: (question: Question) => void;
}

export const QuestionTable: React.FC<QuestionTableProps> = ({ questions, onSelectQuestion }) => {
  const hasQuestions = Array.isArray(questions) && questions.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto w-full">
        <table className={`w-full text-left border-collapse text-xs ${!hasQuestions ? 'table-fixed' : ''}`}>
          <thead>
            <tr className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider z-10">
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Question ID</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Taxonomy (Topic &bull; Subtopic)</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Difficulty</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'min-w-[240px]' : ''}`}>Question Problem Statement</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Question Status</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Video Stage</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Updated</th>
              <th className={`py-3 px-4 font-semibold text-right ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Workflow Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {!hasQuestions ? (
              <tr>
                <td colSpan={8} className="py-8 px-4 text-center text-slate-500 text-xs">
                  No questions found matching the selected criteria.
                </td>
              </tr>
            ) : questions.map((q) => {
              const isDraft = q.status === QuestionStatus.DRAFT || q.status === QuestionStatus.EDITING;
              const isGenerated = q.status === QuestionStatus.GENERATED;
              const isApproved = q.status === QuestionStatus.APPROVED;

              return (
                <tr
                  key={q.id}
                  id={`row-question-${(q.id || '').toLowerCase()}`}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectQuestion?.(q)}
                >
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
                    <div className="font-semibold text-slate-900">{q.topicName || 'General'}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      {q.subtopicName ? (
                        <span className="text-slate-600 font-medium">{q.subtopicName}</span>
                      ) : (
                        <span className="text-slate-400 italic">No subtopic</span>
                      )}
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <DifficultyBadge difficulty={q.difficulty as DifficultyLevel} size="sm" />
                  </td>

                  {/* Question snippet */}
                  <td className="py-3 px-4">
                    <p className="line-clamp-2 text-slate-800 font-normal leading-relaxed">
                      {q.questionText}
                    </p>
                    {q.realWorldContext && (
                      <span className="text-[10px] text-slate-400 italic block mt-0.5">
                        Context: {q.realWorldContext}
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

                  {/* Updated Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px] font-mono">
                    {q.updatedAt
                      ? new Date(q.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>

                  {/* Workflow Action CTA */}
                  <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {isDraft ? (
                        <Link
                          to={`/questions/${q.id}/improve`}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Improve</span>
                        </Link>
                      ) : isGenerated ? (
                        <Link
                          to={`/questions/${q.id}/verify`}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verify</span>
                        </Link>
                      ) : isApproved ? (
                        <Link
                          to={`/questions/${q.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <span>Details</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/questions/${q.id}/improve`}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <span>Edit</span>
                        </Link>
                      )}

                      <Link
                        to={`/questions/${q.id}`}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="View Full Question Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
