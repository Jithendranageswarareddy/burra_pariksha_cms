# Burra Pariksha Canonical Content Modes Specification

**Document ID:** BP-CONTENT-MODES-002\
**Status:** Proposed product/editorial specification\
**Recommended path:**
`docs/burrapariksha-content-planning/02-content-modes-specification.md`\
**Parent document:** `01-content-excellence-baseline.md`

## 1. Purpose and authority

This document translates the Content Excellence Baseline into
mode-specific expectations. It defines each mode's purpose, typical
structure, quality checks, acceptance criteria, and appropriate AI
assistance.

The three canonical content modes are:

1.  **Topic Introduction Video** --- `TOPIC_INTRODUCTION`
2.  **Worked Examples Video** --- `WORKED_EXAMPLES`
3.  **Question Challenge Short** --- `QUESTION_CHALLENGE_SHORT`

Use these exact display names and technical IDs in product requirements,
documentation, prompts, UI labels, tests, analytics, workflow
configuration, and data contracts. Do not create alternate identifiers
casually.

This is a content specification. It does not independently authorize
changes to application architecture, APIs, database schemas, workflow
stages, publishing controls, or security rules. Implementation must fit
the existing CMS.

## 2. Shared principles

Every mode must: - Deliver genuine audience and learning value. - Be
correct, clear, and appropriate for its intended audience. - Fulfill the
purpose promised by its title and opening. - Explain necessary reasoning
and state material assumptions or limitations. - Treat learner mistakes
respectfully. - Avoid ambiguity, deception, and manufactured controversy
as engagement tactics. - Use audience comments as the primary
qualitative starting point for identifying needs, while acknowledging
sampling bias. - Use permitted platform analytics and prior analysis as
supporting evidence, not automatic explanations. - Link significant
recommendations to evidence and state uncertainty. - Preserve privacy,
platform compliance, auditability, and existing workflow rules. - Keep
content mode separate from topic, media format, instructional technique,
workflow status, and platform destination.

### Shared content context

Where supported by existing models, a content item should be associated
with its canonical mode, topic/subtopic, intended audience or
prerequisite knowledge, learning objective, core audience need,
mode-specific script or question material, verification evidence,
quality findings, version/workflow state, related content, and audience
insights that motivated it.

This is a product-level requirement, not a directive to add duplicate
fields. Inspect existing models and contracts before implementation.

## 3. Overview

  ----------------------------------------------------------------------------------
  Display name      Technical ID                 Primary purpose   Typical format
  ----------------- ---------------------------- ----------------- -----------------
  Topic             `TOPIC_INTRODUCTION`         Build initial     Usually long-form
  Introduction                                   conceptual        instructional
  Video                                          understanding     video

  Worked Examples   `WORKED_EXAMPLES`            Demonstrate       One or more
  Video                                          problem-solving   step-by-step
                                                 and reasoning     problems

  Question          `QUESTION_CHALLENGE_SHORT`   Test retrieval    Usually
  Challenge Short                                and application   short-form,
                                                                   question-led
                                                                   video
  ----------------------------------------------------------------------------------

"Usually" describes the intended pattern, not an absolute technical
restriction. A media-format change must not silently change the
instructional mode.

## 4. Topic Introduction Video --- `TOPIC_INTRODUCTION`

### Purpose

Explain what a topic is, why it matters, what its core concepts mean,
and how those concepts fit together. The primary outcome is that a
learner can describe the topic's basic meaning and recognize its central
idea.

### When to use it

Use this mode when the audience needs a conceptual foundation. Typical
needs include: - "What does this concept mean?" - "Why do we use this
method?" - "How are these ideas connected?" - "When does this concept
apply?" - "What should I understand before trying these problems?"

If the audience understands the concept but cannot apply it, a worked
example may be more suitable. If the audience is ready to test
understanding, a challenge may be more suitable.

### Recommended structure

1.  Identify the real question or learner need.
2.  State what the viewer should understand by the end.
3.  Establish context or relevance where useful.
4.  Define essential terms and symbols.
5.  Build the concept in logical steps.
6.  Use an illustration, comparison, or simple example where it improves
    understanding.
7.  Explain important assumptions, limits, or exceptions.
8.  Address likely misconceptions where relevant.
9.  Summarize the core mental model.
10. Suggest a related worked example or challenge when useful.

Adapt the sequence to the topic. The goal is sufficient understanding,
not mechanical compliance with a template.

### Quality checks

-   The topic and intended audience are clear.
-   The opening accurately represents the lesson.
-   Definitions and foundational claims are correct.
-   Terms are explained before they are relied upon.
-   The reasoning is coherent and avoids unexplained jumps.
-   Examples genuinely illustrate the concept.
-   Important assumptions and exceptions are not hidden.
-   Simplification does not create a misleading misconception.
-   The summary reflects the actual lesson.
-   Spoken explanation, on-screen text, and visuals agree.
-   External claims and assets have appropriate evidence, attribution,
    or permission.

### Failure conditions

Revise if the content is mainly unrelated facts, assumes essential
unexplained knowledge, contains an incorrect definition, uses a
contradictory example, promises more than it delivers, hides a material
exception, or presents a formula without the conceptual explanation its
purpose requires.

### Acceptance criteria

Ready for the existing approval process only when the learning objective
is reviewable; core concepts are checked; the explanation fits the
audience; assumptions and limits are handled; examples and visuals
support the concept; no known high-severity correctness issue remains
unresolved; and title/opening accurately represent the content.

### AI assistance

AI may flag undefined terms, logical gaps, oversimplifications,
unsupported claims, and opportunities for clearer examples. It must cite
the passage or evidence behind each material suggestion and distinguish
confirmed defects from hypotheses. It must not silently remove caveats
or claim the topic is fully explained merely because a checklist is
complete.

## 5. Worked Examples Video --- `WORKED_EXAMPLES`

### Purpose

Demonstrate how to solve one or more problem types while making the
reasoning and decision points explicit. The learner should be able to
apply the method to a new, sufficiently similar problem and understand
why the steps work.

### When to use it

Use this mode when learners need help applying a concept, selecting a
method, understanding a step, checking a result, or transferring a
formula to a new problem. Typical needs include: - "How do I solve this
type of question?" - "Why do we use this operation here?" - "How do I
know which formula applies?" - "Can you show another example?" - "Why
does my method give a different result?"

### Recommended structure

For each featured problem: 1. Present the complete problem clearly. 2.
Identify what is known and what must be found. 3. Explain how to
recognize the problem type, where useful. 4. Select a method and explain
why it fits. 5. Show each meaningful transformation or decision. 6.
Explain why each important step is valid. 7. State the result with
correct units, notation, and precision. 8. Verify the result
independently where feasible. 9. Explain a relevant common mistake or
limitation. 10. Summarize the reusable method or show how it transfers.

Multiple examples should have a clear instructional purpose, such as
increasing difficulty or covering distinct problem types. Do not add
examples merely to increase length.

### Quality checks

-   The problem statement is complete and unambiguous.
-   Given information is represented accurately.
-   The method is valid under the stated assumptions.
-   Every intermediate calculation and logical step is correct.
-   Units, signs, notation, rounding, and answer format are consistent.
-   The final answer follows from the shown work.
-   An independent check is used where feasible.
-   Valid alternative methods are not falsely dismissed.
-   Shortcuts are accompanied by necessary conditions.
-   No essential reasoning step is hidden.
-   The spoken explanation, displayed work, and final answer agree.

For mathematical content, verify the full derivation---not just the
final numeric result. A correct final answer reached through invalid
reasoning still requires correction.

### Failure conditions

Revise if any calculation or inference is wrong, a key step is
unjustified, the method is used outside its valid conditions, the
question lacks information, units or signs materially change the answer,
the final answer conflicts with the work, a valid method is wrongly
dismissed, or the example teaches copying steps without explaining the
reasoning.

### Acceptance criteria

Ready for approval when every problem is readable; the solution has been
checked to a level appropriate to its risk; meaningful steps and method
choices are explained; assumptions and notation are correct; the final
answer matches the derivation; relevant misconceptions are addressed; no
known high-severity issue remains unresolved; and required workflow
gates are satisfied.

### AI assistance

AI may solve independently, compare solution paths, flag skipped
transformations, check units, suggest clearer reasoning, or generate
related practice. For high-impact solutions, verification must be
meaningfully independent of the initial generation. Repeating the same
prompt to the same model is not sufficient. AI must never invent a
verification result.

## 6. Question Challenge Short --- `QUESTION_CHALLENGE_SHORT`

### Purpose

Invite viewers to retrieve knowledge, reason independently, and test
whether they can apply what they know. The challenge must be fair,
clear, and aligned with expected prior knowledge.

### When to use it

Use this mode to test or activate knowledge, reinforce a recently taught
idea, reveal a misconception, or help learners identify what they still
need to study. Typical needs include: - "Can I solve this without seeing
the solution?" - "Have I understood the method?" - "Can I recognize the
right approach?" - "Which answer follows from the information?"

### Recommended structure

1.  Present the question accurately.
2.  Include all information needed to interpret it.
3.  Make the response task clear.
4.  Allow a reasonable thinking opportunity.
5.  Reveal the verified answer when the format calls for it.
6.  Explain the decisive insight when appropriate.
7.  Invite participation without shaming wrong answers.
8.  Link to a related introduction or worked example when useful.

Short format does not excuse an incomplete question, wrong answer, or
unfair trick.

### Quality checks

-   The question is accurate and complete.
-   The expected answer and reasoning are verified.
-   Necessary assumptions are stated or established.
-   Wording does not unintentionally allow multiple defensible answers.
-   Difficulty matches the intended audience and purpose.
-   The answer reveal matches the exact question shown.
-   Explanations of incorrect options are fair.
-   The question tests the intended knowledge rather than ambiguity.
-   The time allowed is reasonable for complexity and reading load.
-   Spoken and visual versions agree.

If multiple answers are valid, acknowledge them or revise the question
so the intended answer is defensible.

### Failure conditions

Revise if the answer is wrong, information is missing, multiple answers
are defensible but only one is accepted, the reveal answers a different
question, an assumption is unstated, difficulty comes primarily from
misleading wording, a valid alternative is dismissed incorrectly, or the
audience is shamed or deceived for engagement.

### Acceptance criteria

Ready for approval when the question and task are clear, answer and
reasoning are verified, the problem is fair and sufficiently specified,
the reveal matches the question, the presentation allows a reasonable
attempt, explanations are accurate and respectful, no known
high-severity issue remains unresolved, and the existing workflow gates
are satisfied.

### AI assistance

AI may propose questions, identify the intended skill, suggest a
difficulty estimate, detect ambiguity, solve independently, identify
plausible alternative answers, and draft a concise explanation.
Generated questions must be verified before approval. A model's
assertion that an answer is unique is not enough by itself.

## 7. Selecting the right mode

  ----------------------------------------------------------------------------
  Audience need           Likely mode                  Reason
  ----------------------- ---------------------------- -----------------------
  Understand what a topic `TOPIC_INTRODUCTION`         Builds conceptual
  means                                                foundation

  Understand why a        `TOPIC_INTRODUCTION` or      Depends on whether the
  concept works           `WORKED_EXAMPLES`            gap is conceptual or
                                                       step-specific

  Learn to solve a        `WORKED_EXAMPLES`            Demonstrates
  problem type                                         application

  Understand a missing    Focused `WORKED_EXAMPLES` or Targets a reasoning gap
  step                    correction                   

  Test independent        `QUESTION_CHALLENGE_SHORT`   Requires retrieval and
  application                                          application

  Correct an ambiguous    Revise the existing item or  New content may not be
  question                corrected challenge          needed

  Learn a real-world      Often `WORKED_EXAMPLES`      Demonstrates practical
  application                                          use

  Learn a missing         `TOPIC_INTRODUCTION`         Establishes a
  prerequisite                                         foundation
  ----------------------------------------------------------------------------

These are decision aids, not rigid rules. AI should explain its
recommendation and state uncertainty where evidence is insufficient.

## 8. Relationships between modes

A useful learning path may be:

`TOPIC_INTRODUCTION → WORKED_EXAMPLES → QUESTION_CHALLENGE_SHORT`

This is not mandatory. A viewer may discover a challenge first and then
need an introduction or worked example. The CMS should support
meaningful relationships such as prerequisites, examples illustrating an
introduction, challenges testing a method, follow-ups to comment
clusters, corrections, and alternate methods. Do not create links simply
to fill a set or increase content count.

## 9. Comment-driven improvement

Comments are the primary qualitative starting point for mode-specific
improvements. Permitted analytics and prior analyses can provide context
and help evaluate outcomes.

**For `TOPIC_INTRODUCTION`,** look for repeated requests for
definitions, confusion about basic concepts, missing prerequisites,
conflicting interpretations, or requests for context. Possible actions:
clarify terms, add a prerequisite, illustrate the concept, or correct
oversimplification.

**For `WORKED_EXAMPLES`,** look for questions about specific steps,
repeated calculation errors, requests for more problem types,
alternative methods, or inability to apply a formula. Possible actions:
add a reasoning step, verify the solution, compare methods, or create a
focused example.

**For `QUESTION_CHALLENGE_SHORT`,** look for ambiguity reports, credible
answer disputes, alternate valid answers, insufficient thinking time, or
requests for explanation. Possible actions: clarify wording, acknowledge
multiple answers, correct the answer key, adjust presentation, or link a
worked example.

For substantial recommendations, record observation, supporting
evidence, interpretation, confidence, limitations, proposed action, and
verification plan. Never invent comments or claim "many viewers" based
on a small sample. A single credible correctness report may justify
urgent investigation. Respect privacy and platform rules when storing or
quoting comments.

## 10. Shared review and workflow requirements

This specification does not replace the existing 15-stage CMS workflow.
For all modes, distinguish drafting, content verification, editorial
review, workflow approval, authorized publication, and post-publication
improvement.

A generated draft is not verified. A verified draft is not automatically
approved. Approval does not bypass publishing controls.

Preserve: - The canonical 15-stage workflow. - Save Draft versus Submit
for Verification. - Backend authorization. - Optimistic concurrency. -
Audit requirements. - GAR-02 anti-self-approval. - Internal-note
isolation from audience-facing output.

Suggested severity labels for review are **Critical**, **High**,
**Medium**, and **Low**. Treat these as proposed editorial categories
until mapped to existing application statuses. A critical issue must not
be hidden by an aggregate score.

## 11. Shared acceptance checklist

Before the existing approval stage, reviewers should ask: - Is the
canonical mode correct? - Is the intended audience need clear? - Does
the item fulfil its learning objective? - Are central claims,
calculations, questions, and answers verified? - Are assumptions and
limitations clear? - Is the reasoning complete enough for the mode? - Do
examples, questions, and answer reveals agree? - Is the content
respectful and accessible? - Does the title/opening accurately represent
the content? - Are high-severity issues resolved? - Are sources, assets,
and audience data handled appropriately? - Are recommendations traceable
to evidence? - Are workflow, authorization, audit, and internal-note
safeguards preserved? - Are links to related content useful and
accurate?

A checklist is a review aid, not proof of correctness by itself.

## 12. Implementation and AI evaluation guidance

Before building a mode-specific feature: 1. Inspect existing models, API
contracts, workflow rules, and tests. 2. Reuse existing fields and
services where appropriate. 3. Avoid alternate mode IDs and duplicate
sources of truth. 4. Define input, output, failure behavior, and
human-review boundaries. 5. Identify high-severity false negatives and
false positives. 6. Test correct, incorrect, ambiguous, incomplete, and
adversarial cases. 7. Use mocks or the local emulator where possible. 8.
Preserve authorization, audit, concurrency, and data isolation. 9.
Report actual test results; never claim unrun tests passed. 10. Do not
deploy, push, or mutate production data without explicit authorization.

Firestore remains authoritative; Sheets must not become a competing
runtime source of truth. Backend services remain responsible for
authorization and workflow enforcement.

Evaluate AI features with reviewed examples, including valid
alternatives, rare high-severity mistakes, conflicting comments, and
cases where no change is warranted. Track task-appropriate
precision/recall, missed high-severity issues, evidence-link accuracy,
reviewer decisions, stability across model/prompt versions, and
operational failures. Add regression cases for discovered failures; do
not weaken tests to improve reported performance.

## 13. Out of scope

This document does not: - Change or reorder workflow stages. - Finalize
new database collections or fields. - Authorize automatic publishing or
self-approval. - Claim a platform API is connected or exposes specific
metrics. - Treat the proposed 99.9999999999999% emphasis on comments as
measured data. - Guarantee virality, views, learning outcomes, or
error-free content. - Replace platform terms, privacy policy, or legal
review. - Authorize production changes, deployment, or GitHub pushes.

## 14. Maintenance and change control

A proposed change must identify the affected mode or rule, rationale and
evidence, impact on identifiers/content/workflows/data/analytics/tests,
compatibility concerns, and required review. Do not casually change
canonical terminology. If a change is approved, update this
specification, the baseline, README/index links, relevant technical
contracts, prompts, and tests together.

## 15. Final standard

-   `TOPIC_INTRODUCTION` helps the learner understand what a topic is
    and how its core ideas fit together.
-   `WORKED_EXAMPLES` helps the learner understand how to solve problems
    and why the method works.
-   `QUESTION_CHALLENGE_SHORT` helps the learner test knowledge fairly
    through independent reasoning and application.

The CMS and its AI features should select the right mode, create
accurate content, verify it, learn from the audience, and improve it
with evidence. The objective is not simply to publish more videos; it is
to make each item more useful, trustworthy, understandable, and
responsive to real learner needs.
