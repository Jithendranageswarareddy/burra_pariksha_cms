/**
 * BURRA PARIKSHA CMS - Similarity & Content Diversity Intelligence Service
 * Phase 9: Content Planning, Batch Management & Question Intelligence
 * 
 * Provides deterministic duplicate detection, lexical similarity scoring,
 * structural pattern overuse detection, and taxonomy concentration diagnostics.
 */

import { questionsRepository } from '../repositories/questions.repository';
import { taxonomyService } from './taxonomy.service';
import { ContentDiversityWarning, Question } from '../../types';

export interface QuestionSimilarityMatch {
  sourceQuestionId: string;
  sourceText: string;
  matchedQuestionId: string;
  matchedText: string;
  similarityScore: number;
  type: 'EXACT_DUPLICATE' | 'HIGH_SIMILARITY' | 'STRUCTURAL_PATTERN';
  reason: string;
}

export interface DiversityRadarReport {
  scannedQuestionsCount: number;
  exactDuplicatesCount: number;
  highSimilarityMatchesCount: number;
  similarityMatches: QuestionSimilarityMatch[];
  diversityWarnings: ContentDiversityWarning[];
  taxonomyConcentrations: {
    categoryId: string;
    categoryName: string;
    topicId: string;
    topicName: string;
    questionCount: number;
    shareOfCategory: number;
  }[];
  healthScore: number; // 0 to 100
  generatedAt: string;
}

export class SimilarityService {
  private static instance: SimilarityService | null = null;

  private constructor() {}

  public static getInstance(): SimilarityService {
    if (!SimilarityService.instance) {
      SimilarityService.instance = new SimilarityService();
    }
    return SimilarityService.instance;
  }

  /**
   * Normalizes a text string for deterministic comparison.
   */
  public normalizeText(text: string): string {
    return (text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extracts word tokens from string.
   */
  private getTokens(text: string): Set<string> {
    const normalized = this.normalizeText(text);
    return new Set(normalized.split(' ').filter((w) => w.length > 2));
  }

  /**
   * Calculates Jaccard similarity between two token sets (0.0 to 1.0).
   */
  public calculateJaccardSimilarity(textA: string, textB: string): number {
    const tokensA = this.getTokens(textA);
    const tokensB = this.getTokens(textB);

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersectionCount = 0;
    tokensA.forEach((token) => {
      if (tokensB.has(token)) {
        intersectionCount++;
      }
    });

    const unionCount = tokensA.size + tokensB.size - intersectionCount;
    if (unionCount === 0) return 0;

    return Math.round((intersectionCount / unionCount) * 100) / 100;
  }

  /**
   * Checks whether a new or candidate question text is a duplicate of any existing question in the bank.
   */
  public async findSimilarQuestions(
    candidateText: string,
    excludeQuestionId?: string,
    threshold: number = 0.70
  ): Promise<QuestionSimilarityMatch[]> {
    const questions = await questionsRepository.findAll();
    const matches: QuestionSimilarityMatch[] = [];
    const normalizedCandidate = this.normalizeText(candidateText);

    if (!normalizedCandidate) return matches;

    for (const q of questions) {
      if (excludeQuestionId && q.id === excludeQuestionId) continue;
      const normalizedExisting = this.normalizeText(q.questionText);

      if (normalizedCandidate === normalizedExisting) {
        matches.push({
          sourceQuestionId: excludeQuestionId || 'CANDIDATE',
          sourceText: candidateText,
          matchedQuestionId: q.id,
          matchedText: q.questionText,
          similarityScore: 1.0,
          type: 'EXACT_DUPLICATE',
          reason: `Exact identical question text matches ${q.id} in ${q.categoryName} > ${q.topicName}`,
        });
      } else {
        const score = this.calculateJaccardSimilarity(candidateText, q.questionText);
        if (score >= threshold) {
          matches.push({
            sourceQuestionId: excludeQuestionId || 'CANDIDATE',
            sourceText: candidateText,
            matchedQuestionId: q.id,
            matchedText: q.questionText,
            similarityScore: score,
            type: 'HIGH_SIMILARITY',
            reason: `High semantic/lexical overlap (${Math.round(score * 100)}%) with ${q.id} in ${q.categoryName} > ${q.topicName}`,
          });
        }
      }
    }

    return matches.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Generates a full Content Diversity & Similarity Radar report across the entire Question Bank.
   */
  public async generateDiversityRadarReport(): Promise<DiversityRadarReport> {
    const questions = await questionsRepository.findAll();
    const categories = await taxonomyService.getCategories();
    const topics = await taxonomyService.getTopics();

    const matches: QuestionSimilarityMatch[] = [];
    const warnings: ContentDiversityWarning[] = [];

    // 1. Pairwise Similarity Scan (O(N^2) over typical question bank)
    const seenPairs = new Set<string>();

    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const qA = questions[i];
        const qB = questions[j];
        const pairKey = `${qA.id}:${qB.id}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        const normA = this.normalizeText(qA.questionText);
        const normB = this.normalizeText(qB.questionText);

        if (normA === normB) {
          matches.push({
            sourceQuestionId: qA.id,
            sourceText: qA.questionText,
            matchedQuestionId: qB.id,
            matchedText: qB.questionText,
            similarityScore: 1.0,
            type: 'EXACT_DUPLICATE',
            reason: `Exact duplicate between ${qA.id} and ${qB.id}`,
          });
        } else {
          const score = this.calculateJaccardSimilarity(qA.questionText, qB.questionText);
          if (score >= 0.75) {
            matches.push({
              sourceQuestionId: qA.id,
              sourceText: qA.questionText,
              matchedQuestionId: qB.id,
              matchedText: qB.questionText,
              similarityScore: score,
              type: 'HIGH_SIMILARITY',
              reason: `High phrasing overlap (${Math.round(score * 100)}%) between ${qA.id} and ${qB.id}`,
            });
          }
        }
      }
    }

    // 2. Taxonomy Concentrations & Topic Share
    const taxonomyConcentrations: {
      categoryId: string;
      categoryName: string;
      topicId: string;
      topicName: string;
      questionCount: number;
      shareOfCategory: number;
    }[] = [];

    for (const cat of categories) {
      const catQuestions = questions.filter((q) => q.categoryId === cat.id);
      const catTopics = topics.filter((t) => t.categoryId === cat.id);

      if (catQuestions.length === 0) continue;

      for (const top of catTopics) {
        const topQuestions = catQuestions.filter((q) => q.topicId === top.id);
        const share = Math.round((topQuestions.length / catQuestions.length) * 100);

        if (topQuestions.length > 0) {
          taxonomyConcentrations.push({
            categoryId: cat.id,
            categoryName: cat.name,
            topicId: top.id,
            topicName: top.name,
            questionCount: topQuestions.length,
            shareOfCategory: share,
          });
        }

        // Concentration warning if single topic takes > 50% in a populated category
        if (share > 50 && catQuestions.length >= 8) {
          warnings.push({
            type: 'SUBTOPIC_CONCENTRATION',
            severity: 'MEDIUM',
            title: `High Topic Concentration: ${top.name}`,
            description: `Topic '${top.name}' accounts for ${share}% (${topQuestions.length}/${catQuestions.length}) of all questions in '${cat.name}'.`,
            affectedEntities: [top.id],
            recommendation: `Diversify content generation into other topics under ${cat.name} to maintain pedagogical balance.`,
          });
        }
      }

      // 3. Difficulty Skew Check
      const easyCount = catQuestions.filter((q) => q.difficulty === 'EASY').length;
      const medCount = catQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
      const hardCount = catQuestions.filter((q) => q.difficulty === 'HARD').length;

      if (catQuestions.length >= 6) {
        if (easyCount / catQuestions.length > 0.7) {
          warnings.push({
            type: 'DIFFICULTY_SKEW',
            severity: 'MEDIUM',
            title: `Excessive Easy Difficulty Skew: ${cat.name}`,
            description: `${Math.round((easyCount / catQuestions.length) * 100)}% of questions in ${cat.name} are marked EASY.`,
            affectedEntities: [cat.id],
            recommendation: `Create more MEDIUM and HARD challenge questions for competitive exam readiness.`,
          });
        } else if (hardCount / catQuestions.length > 0.7) {
          warnings.push({
            type: 'DIFFICULTY_SKEW',
            severity: 'MEDIUM',
            title: `Excessive Hard Difficulty Skew: ${cat.name}`,
            description: `${Math.round((hardCount / catQuestions.length) * 100)}% of questions in ${cat.name} are marked HARD.`,
            affectedEntities: [cat.id],
            recommendation: `Include introductory EASY and standard MEDIUM foundational problems.`,
          });
        }
      }
    }

    if (matches.some((m) => m.type === 'EXACT_DUPLICATE')) {
      const dupCount = matches.filter((m) => m.type === 'EXACT_DUPLICATE').length;
      warnings.push({
        type: 'SIMILARITY_CLUSTER',
        severity: 'HIGH',
        title: `${dupCount} Exact Question Duplicate(s) Detected`,
        description: `Found ${dupCount} identical question texts across the question library.`,
        affectedEntities: matches.filter((m) => m.type === 'EXACT_DUPLICATE').map((m) => m.sourceQuestionId),
        recommendation: `Review and reject or archive duplicate questions to avoid redundant video production.`,
      });
    }

    // Health Score calculation (100 base, -10 per exact dup, -4 per high similarity, -5 per warning)
    const exactCount = matches.filter((m) => m.type === 'EXACT_DUPLICATE').length;
    const highSimCount = matches.filter((m) => m.type === 'HIGH_SIMILARITY').length;
    let score = 100 - (exactCount * 15) - (highSimCount * 4) - (warnings.length * 5);
    score = Math.max(20, Math.min(100, score));

    return {
      scannedQuestionsCount: questions.length,
      exactDuplicatesCount: exactCount,
      highSimilarityMatchesCount: highSimCount,
      similarityMatches: matches,
      diversityWarnings: warnings,
      taxonomyConcentrations: taxonomyConcentrations.sort((a, b) => b.questionCount - a.questionCount),
      healthScore: score,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const similarityService = SimilarityService.getInstance();
