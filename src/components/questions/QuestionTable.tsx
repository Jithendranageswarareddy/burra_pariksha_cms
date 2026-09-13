import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, ExternalLink, Video } from 'lucide-react';
import { DifficultyLevel, Question } from '../../types';
import { QuestionStatusBadge, VideoStatusBadge } from '../common/StatusBadge';
import { DifficultyBadge } from '../common/DifficultyBadge';

interface QuestionTableProps {
  questions: Question[];
  onSelectQuestion?: (question: Question) => void;
}

export const QuestionTable: React.FC<QuestionTableProps> = ({ questions, onSelectQuestion }) => {
  const hasQuestions = Array.isArray(questions) && questions.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto w-full">
        <table className={`w-full text-left border-collapse text-xs ${!hasQuestions ? 'table-fixed' : ''}`}>
          <thead>
            <tr className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider z-10">
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>ID</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Taxonomy (Topic &bull; Subtopic)</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Difficulty</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'min-w-[240px]' : ''}`}>Question Text</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Question Status</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Video Status</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Created</th>
              <th className={`py-3 px-4 font-semibold ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Updated</th>
              <th className={`py-3 px-4 font-semibold text-right ${hasQuestions ? 'whitespace-nowrap' : ''}`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {!hasQuestions ? (
              <tr>
                <td colSpan={9} className="py-8 px-4 text-center text-slate-500 text-xs">
                  No questions recorded in repository yet.
                </td>
              </tr>
            ) : questions.map((q) => (
              <tr
                key={q.id}
                id={`row-question-${(q.id || '').toLowerCase()}`}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => onSelectQuestion?.(q)}
              >
                {/* ID & Master */}
                <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                  <Link
                    to={`/questions/${q.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>{q.id}</span>
                  </Link>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    {q.contentMasterId ? (
                      <span className="text-purple-700 bg-purple-50 px-1 py-0.2 rounded font-mono font-medium border border-purple-200/60" title="Content Master ID">
                        {q.contentMasterId}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not linked</span>
                    )}
                  </div>
                </td>

                {/* Category, Topic & Subtopic */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-900">{q.categoryName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>{q.topicName}</span>
                    {q.subtopicName && (
                      <>
                        <span className="text-slate-300">&rsaquo;</span>
                        <span className="text-slate-600 font-medium">{q.subtopicName}</span>
                      </>
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

                {/* Created Date */}
                <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px] font-mono">
                  {new Date(q.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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

                {/* Actions */}
                <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      to={`/questions/${q.id}`}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Edit Question"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/queue"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Check in Queue"
                    >
                      <Video className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
