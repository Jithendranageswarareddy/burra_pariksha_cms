# Burra Pariksha Content Excellence Baseline


**Purpose:** Canonical product, editorial, audience-insight, AI,
quality, and governance foundation for future Burra Pariksha CMS
development.\
**Canonical modes:** `TOPIC_INTRODUCTION`, `WORKED_EXAMPLES`,
`QUESTION_CHALLENGE_SHORT`

## 1. Mission and product principle

Burra Pariksha exists to deliver meaningful educational value: help real
people understand concepts, solve real problems, apply knowledge
correctly, and become more capable of solving problems independently.
Views and reach matter because they help useful content find more
people. They are not the ultimate measure of success when separated from
learning, trust, correctness, and usefulness.

**Core principle:** Understand the learner's real need, create accurate
and useful learning content, listen carefully to the audience, and
improve the next piece of content using evidence. Reach should grow
because content earns attention and trust---not because it misleads,
exaggerates, or sacrifices quality.

The CMS should become a disciplined learning-content system: one that
can produce at scale while maintaining correctness, clear explanations,
audience empathy, and accountability. It must not become an unchecked
AI-content factory.

Every content-related feature should help answer: 1. What real question,
confusion, task, or problem does the audience have? 2. What does the
audience understand, misunderstand, assume, or want to accomplish? 3.
Which content mode best serves that need? 4. Is the content correct,
clear, complete, and appropriate for its audience? 5. Can a learner
apply the explanation independently? 6. What evidence suggests the
content helped or failed? 7. What do comments reveal about the
audience's language, mindset, and remaining confusion? 8. What should be
improved, and how will we verify the improvement? 9. Can AI make the
work faster without becoming an unchecked authority?

### Decision hierarchy

When objectives conflict, prioritize: 1. Safety, integrity, and
correctness. 2. Learning usefulness. 3. Clarity and accessibility. 4.
Audience relevance and trust. 5. Reach and engagement. 6. Production
efficiency.

A serious correctness failure cannot be offset by high engagement. Views
are an important outcome, but they never justify false answers,
misleading titles, manufactured controversy, fabricated audience
sentiment, or unverified AI explanations.

## 2. Canonical content modes

Use these names consistently in the UI, README, specifications, workflow
configuration, tests, prompts, and analytics. Do not invent alternate
names for the same mode.

  ----------------------------------------------------------------------------
  Display name            Technical ID                 Primary job
  ----------------------- ---------------------------- -----------------------
  Topic Introduction      `TOPIC_INTRODUCTION`         Explain what a topic
  Video                                                is, why it matters, and
                                                       the core concepts
                                                       learners need.

  Worked Examples Video   `WORKED_EXAMPLES`            Demonstrate how to
                                                       solve different problem
                                                       types, making steps and
                                                       reasoning explicit.

  Question Challenge      `QUESTION_CHALLENGE_SHORT`   Invite viewers to
  Short                                                attempt a question or
                                                       problem and test their
                                                       knowledge.
  ----------------------------------------------------------------------------

### 2.1 Topic Introduction Video --- `TOPIC_INTRODUCTION`

**Purpose:** Establish a mental model of the topic. Explain what it
covers, what it means, why it matters, and how its core ideas fit
together.

**Typical structure:** identify the learner's question; explain
relevance; define terms; build the concept from familiar ideas; give a
simple illustration; clarify assumptions and misconceptions; summarize
the mental model; link to relevant worked examples or challenges.

**Quality test:** Can the learner explain what the topic is about and
recognize its basic idea, even if they cannot yet solve every problem?

### 2.2 Worked Examples Video --- `WORKED_EXAMPLES`

**Purpose:** Teach learners to approach and solve problems by making the
reasoning visible. The goal is not only the final answer but why each
step is valid and how to decide what to do next.

**Typical structure:** state the problem; identify knowns and unknowns;
recognize the problem type; select and justify a method; explain each
meaningful step; verify the result independently where feasible;
identify common mistakes; summarize a reusable method; optionally give a
similar problem to try.

**Quality test:** Can the learner apply the reasoning to a new problem
rather than merely copying the example?

### 2.3 Question Challenge Short --- `QUESTION_CHALLENGE_SHORT`

**Purpose:** Prompt learners to retrieve knowledge, reason
independently, and test understanding.

**Typical structure:** present a clear question; provide sufficient
context; make the response task clear; allow time to think; reveal the
answer when the format calls for it; explain the key insight where
appropriate; invite participation without shaming incorrect answers.

**Quality test:** Is the challenge answerable from the information
provided and expected prior knowledge? Does it test the intended skill
rather than exploit ambiguity?

### 2.4 Keep concepts separate

A topic, content mode, media format, instructional technique, audience
segment, platform destination, and workflow status are different
dimensions. For example, `WORKED_EXAMPLES` is a content mode;
step-by-step explanation is an instructional technique; long-form video
is a media format. Changing aspect ratio must not silently change the
instructional purpose.

The modes work together: introductions build conceptual understanding,
worked examples demonstrate application, and challenges test independent
retrieval and application. A learner may enter through any mode; the CMS
should support links among them without requiring a rigid sequence.

## 3. Audience-first operating philosophy

Audience understanding is a core content capability, not a final-stage
marketing activity. Different viewers may have different prior
knowledge, goals, vocabulary, confidence, and real-life constraints. A
comment may reveal a misconception, missing prerequisite, preferred
explanation, real-world application, language barrier, or new content
opportunity.

The objective is not to guess what the audience thinks. It is to listen,
collect evidence, identify recurring patterns, test interpretations, and
respond with better content.

### 3.1 Comments as the primary qualitative source

For Burra Pariksha, comments should be the **primary qualitative
starting point and default source for audience-mindset analysis**. They
often contain the audience's own words: what was unclear, which step
felt confusing, what they expected, how they tried to solve the problem,
and what they want explained next.

The stated figure "99.9999999999999%" expresses the strategic emphasis
on comments; it is not a verified statistic. Do not encode it as a
measured fact unless a defined, representative study supports it.
Comment quality and volume vary, some viewers never comment, and
platform behavior differs. The relative contribution of each source
should remain measurable and revisable.

**Operating rule:** Start with comments to understand the audience's
words and reasoning. Use permitted analytics and prior analyses to add
context, test hypotheses, and measure outcomes. Do not let aggregate
metrics erase specific human problems revealed in comments.

Comments are not a perfect census. They may be biased toward highly
engaged people, strong opinions, jokes, spam, copied text, or
misinformation. The system must label evidence strength and avoid
treating the loudest or most frequent voice as universal truth.

### 3.2 Audience feedback loop

1.  **Listen:** Collect permitted comments and feedback for a specific
    item.
2.  **Preserve context:** Link each item to platform, content ID, time,
    thread context where available, and collection time.
3.  **Classify:** Identify questions, confusion, alternative methods,
    misconceptions, requests, praise, criticism, real-life use cases,
    and unrelated material.
4.  **Cluster:** Group comments that express the same underlying need
    even when wording differs.
5.  **Interpret cautiously:** Separate direct statements from AI
    inference.
6.  **Prioritize:** Consider educational value, recurrence, severity,
    evidence quality, feasibility, and reach.
7.  **Respond:** Decide whether to reply, correct content, add a
    clarification, create a follow-up, revise a future lesson, or take
    no action.
8.  **Create and verify:** Draft an improvement and verify correctness
    before publication.
9.  **Measure:** Check whether the change resolves the problem or
    creates new confusion.
10. **Learn:** Record outcomes for future recommendations.

### 3.3 Transparently connect with viewers

When a genuine recurring pattern appears, content may say: - "Several of
you asked why this step works. Let's break down the reasoning." - "Some
viewers used a different method. Here is when that method works." - "A
few comments pointed out that the question could be interpreted in two
ways. Let's clarify it." - "Many of you asked for a real-life example.
Let's work through one."

Every claim must be grounded in actual evidence. Do not claim "many,"
"most," or "everyone" from a handful of comments. Never invent comments,
fabricate sentiment, or attribute a view to someone who did not express
it. Follow platform rules, privacy requirements, and copyright
constraints when quoting or displaying comments; consider paraphrasing
or removing identifiers.

### 3.4 Understand the problem behind the words

"I don't get it" may mean a prerequisite is missing, a step was skipped,
the pace was too fast, a term was unfamiliar, the example felt
irrelevant, the viewer understands the procedure but not the reason, or
the problem is ambiguous. AI should propose plausible interpretations
and show evidence and confidence rather than silently treating one guess
as fact.

## 4. Comment intelligence requirements

A future comment-analysis feature should produce structured, reviewable
insights---not merely a sentiment score.

### 4.1 Suggested categories

-   Direct question.
-   Conceptual confusion.
-   Step-level confusion.
-   Misconception.
-   Alternative method.
-   Disputed answer or reasoning.
-   Ambiguity report.
-   Prerequisite gap.
-   Real-world use case.
-   Follow-up request.
-   Pacing or presentation feedback.
-   Language or accessibility need.
-   Positive learning signal.
-   Unresolved outcome after trying a method.
-   Content error report.
-   Off-topic, spam, or low-confidence item.

Comments may receive multiple labels. Keep category definitions
versioned; do not silently change their meanings.

### 4.2 Insight record

Where available and justified, an insight should record: - Content ID
and canonical mode. - Platform and platform content ID. - Safe internal
source reference and comment timestamp. - Collection time and data
window. - Original text or policy-compliant stored representation. -
Language and any translation. - Category labels, topic, subtopic, and
problem type. - Extracted question or issue. - AI interpretation and
supporting evidence. - Cluster size and relevant coverage information. -
Confidence, uncertainty, and sampling limitations. - Potential
educational impact and suggested action. - Human review status and
decision. - Linked content revision or follow-up. - Outcome measurement
when available. - Model, prompt, taxonomy, and version metadata needed
for reproducibility.

Collect only fields required for a documented purpose. Do not collect
private messages or restricted data without an authorized basis.

### 4.3 Cluster by underlying need

Group by meaning, not exact wording alone. "Why did you divide here?"
and "I lost you at step three" may reveal the same reasoning gap in
context. Preserve disagreement and distinguish genuine alternative
methods, contradictory claims, low-context comments, and issues that
cannot be interpreted reliably.

Frequency is not importance. A single credible correctness report may
deserve urgent review. Ranking should consider severity, learning
impact, recurrence, evidence quality, coverage, audience relevance,
actionability, potential reach, and cost or risk. Show the rationale
rather than hiding it in an unexplained score.

Do not use comment intelligence to manufacture engagement, provoke
arguments, misrepresent dissent, or make questions intentionally
ambiguous. Invite useful participation by asking learners to explain
reasoning or share a legitimate alternative.

## 5. Platform analytics and previously analyzed data

Comments are the primary qualitative starting point. The CMS should also
be able to use relevant, lawfully accessible platform data and
previously analyzed results. Analytics can contextualize comment
patterns and help evaluate whether improvements work.

Potential sources, subject to actual platform availability and
permissions, include: - Comments and reply threads. - Views and view
trends. - Watch time, average view duration, and retention data. -
Impressions and click-through rate. - Likes, shares, saves, and
permitted engagement signals. - Subscriber or follower changes
associated with publication. - Search or discovery sources where
available. - Publication date, duration, title, description, and other
content metadata. - Existing internal reviews and verified
corrections. - Historical comment clusters and previous AI analysis. -
Outcomes of earlier revisions, follow-up videos, or experiments. -
Aggregated audience summaries where provided and appropriate.

This list does not mean every platform exposes every field or that an
integration already exists. Each connector must document permissions,
data availability, refresh cadence, limitations, and terms.

### 5.1 What the sources mean

Analytics may show **what happened**: a retention drop, view increase,
or click-through change. Comments may suggest **why it may have
happened**: a missing prerequisite, confusing step, unmet expectation,
or request for another example. Neither proves causality alone. A
retention drop does not prove the explanation is bad; positive comments
do not prove that learners can apply the concept.

Use comments to discover needs, analytics to understand viewing
behavior, content review to assess correctness, and follow-up evidence
or experiments to assess improvement. Preserve alternative explanations
when evidence is inconclusive.

### 5.2 Reuse prior analysis responsibly

Maintain reusable insight records for: - Prior comment clusters and
supporting references. - Known misconceptions and validated
explanations. - Questions already answered in published content. -
Topics with recurring demand. - Revisions and their rationale. -
Analytics summaries with time windows. - Accepted and rejected
recommendations and outcomes. - Known data gaps and model-version
metadata.

Before reusing analysis, check whether the source data, content, policy,
taxonomy, or model assumptions have changed. Historical conclusions are
not automatically current.

### 5.3 Provenance and platform connectors

Every dataset should identify its source, content/account scope, time
window, collection time, time zone where relevant, raw versus
aggregated/inferred status, missing fields, limitations, API/export
version, permissions, retention constraints, and refresh status.

Connectors must use authorized accounts and least-privilege scopes;
respect platform terms, rate limits, retention rules, and deletion
requirements; avoid prohibited scraping; protect credentials; handle
pagination, duplicates, edits, and partial sync; make retries
idempotent; record provenance; fail safely when permissions change; and
support deletion or reprocessing where required. Absence of API data is
not proof that no audience need exists.

## 6. Correctness and pre-publication quality

AI fluency is not evidence of correctness. A confident explanation can
still contain a false premise, calculation error, missing condition, or
invalid generalization.

### 6.1 Risk categories

The CMS should help reviewers detect: - Factual error. - Mathematical or
logical error. - Wrong or incomplete answer key. - Ambiguous problem
statement. - Missing assumption. - Invalid method or
overgeneralization. - Internal inconsistency. - Missing pedagogical step
or prerequisite. - Misleading title or opening. - Accessibility or
presentation issue. - Citation, attribution, or permission issue. -
Privacy issue. - Platform-policy issue. - Mismatch between content and
intended audience.

### 6.2 Mode-specific checks

**`TOPIC_INTRODUCTION`:** Verify definitions and foundational claims;
check that examples illustrate the concept; state important limits and
exceptions; avoid oversimplifications that create misconceptions; ensure
the promised scope matches the lesson.

**`WORKED_EXAMPLES`:** Independently solve every problem; verify
intermediate steps, not just final answers; check arithmetic, units,
signs, notation, and assumptions; confirm method suitability; use an
independent check where feasible; explain why common wrong approaches
fail without falsely dismissing valid alternatives.

**`QUESTION_CHALLENGE_SHORT`:** Verify question, answer, and intended
reasoning; ensure all necessary information is present; identify
multiple defensible answers; ensure fair difficulty; verify the reveal
matches the question; do not use ambiguity as a substitute for
difficulty.

### 6.3 Independent verification

For high-impact claims, use a check independent of the initial
generation process: deterministic calculation, a separate solution path,
a trusted reference, or qualified human review. Running the same model
prompt twice is not necessarily independent verification.

Distinguish verified fact, independently checked calculation, supported
interpretation, plausible hypothesis, uncertain information, and
unverified claim requiring review. Do not claim "99.9% correct" without
a valid evaluation procedure.

## 7. AI's role and boundaries

AI can draft scripts, suggest examples, identify missing steps, solve
problems, classify and cluster comments, detect possible contradictions,
suggest titles and openings, identify content opportunities, prepare
reviewer checklists, draft replies for approval, and compare revisions
with requirements.

AI must not, unless a separately approved and tested workflow explicitly
allows it: - Publish or approve high-impact content without required
human review. - Change a correct answer to match audience preference. -
Treat popular comments as authoritative. - Invent comments, citations,
metrics, or audience statistics. - Hide uncertainty or conflicting
evidence. - Make irreversible data changes without authorization. -
Bypass workflow authorization, audit, or concurrency controls. - Reveal
private comment data or credentials. - Silently alter canonical mode
definitions or workflow policy. - Delete records because they appear old
or negative.

Separate three stages: 1. **Generation:** Is this a useful draft? 2.
**Verification:** Is it correct, complete, and supported? 3.
**Approval:** Is it appropriate to publish under editorial standards?

Passing one stage does not automatically pass the next. AI
recommendations are proposals; the CMS should record provenance,
evidence, review state, and the human decision.

## 8. Recommendation standard

A useful recommendation should state: 1. Observation. 2. Supporting
evidence. 3. Interpretation. 4. Confidence and limitations. 5. Audience
need. 6. Concrete action. 7. Expected benefit. 8. Risks and trade-offs.
9. Verification plan. 10. Outcome measure.

Weak: "Make the video more engaging."

Better: "Several comments ask why the denominator changes in step two.
Add an explanation before that transition, verify it with an
independently solved example, then review new comments and retention
around the section."

Recommendation categories include correctness correction, clarification,
prerequisite lesson, worked-example expansion, challenge improvement,
audience-language improvement, accessibility improvement, packaging,
follow-up content, content linking, no change, and human investigation.

Prioritization should consider correctness severity, learning impact,
recurrence, evidence strength, audience relevance, feasibility,
reversibility, and expected reach. Show the rationale and permit human
override with an auditable reason.

## 9. Audience mindset and respectful communication

"Audience mindset" means goals, assumptions, questions, emotional
context, vocabulary, confidence, and problem-solving habits evidenced by
feedback. It does not authorize invasive psychological profiling.

Learn what viewers are trying to do, what terms they use, where
reasoning breaks down, which examples feel relevant, what makes them
uncertain, and what they want next. Do not infer sensitive traits or
label people as unintelligent, lazy, dishonest, or incapable. An
incorrect answer is evidence about a response, not a person's worth.

Respond to the underlying need. Acknowledge genuine questions, explain
missing reasoning, correct errors openly, thank viewers for useful
feedback, and clarify when multiple methods are valid under different
assumptions. Do not use confusion as a marketing prop.

## 10. Content opportunity discovery

The CMS should convert evidence into a structured backlog rather than
leaving ideas scattered in comment threads.

Opportunity types include a missing introduction, unclear concept,
missing worked problem, challenge for a key skill, common wrong answer
worth explaining, real-world scenario, correction, missing prerequisite,
language/accessibility request, unresolved follow-up, comparison of
confused methods, or a link between related videos.

Map needs to a mode: - "What does this mean?" → usually
`TOPIC_INTRODUCTION`. - "How do I solve this type?" → usually
`WORKED_EXAMPLES`. - "Can I solve this myself?" → usually
`QUESTION_CHALLENGE_SHORT`. - "Why does this step work?" → a focused
worked example or clarification. - "How do these concepts differ?" → an
introduction, comparative example, or both.

Before creating a new item, search existing content and insight records.
Recommend linking existing content, improving it, creating a follow-up,
creating new content, merging duplicates, or deferring due to weak
evidence. A correction, pinned clarification, caption revision, or link
may be better than a new video.

## 11. Balanced measurement

No single metric represents content quality. Keep a balanced view of
correctness, learning usefulness, audience feedback, reach, and
operational reliability.

**Correctness:** verified error count and severity; unresolved
correctness flags; time to investigate and correct credible reports;
documented independent checks for high-risk solutions.

**Learning usefulness:** alignment with stated objectives; ability to
solve a related problem; decrease in recurring confusion after revision;
completeness of reasoning; ability to distinguish valid from invalid
methods.

**Audience feedback:** analyzed comment coverage and time window;
recurring confusion clusters; credible error reports; time to address
high-priority needs; recommendations linked to evidence; recommendations
with outcome checks; repeated unanswered questions.

**Reach:** views, impressions, click-through, watch time, retention,
shares, saves, relevant audience growth, discovery source, and movement
to related content, where available.

**Operations:** time from idea to verified publication; review backlog;
rework due to missing requirements; recommendation acceptance/rejection
reasons; test coverage; integration failures; audit completeness;
reviewer load and credible cost measures.

Views, likes, and comments are not direct measurements of learning. "No
reports received" does not prove "no errors exist." Compare metrics only
with appropriate context, including format, age, audience size, time
window, and platform distribution.

## 12. Experiments and causal humility

Define the hypothesis before testing a title, opening, example, pacing,
or structure. Record the audience problem, proposed change, expected
benefit, primary metric, guardrails, baseline or comparison period,
context, confounders, result, uncertainty, and decision.

A clearer opening may improve retention, but an overpromising opening
may increase clicks while damaging trust. Pair growth metrics with
integrity and usefulness checks. Do not claim causality when data only
shows correlation; use "associated with" or "suggests" when appropriate.

## 13. Workflow, architecture, and governance

This baseline does not replace the application's established workflow,
authorization, concurrency, audit, or data architecture.

Preserve the canonical 15-stage workflow, the distinction between Save
Draft and Submit for Verification, optimistic concurrency, audit
requirements, GAR-02 anti-self-approval, and internal-note isolation.
Saving a draft is not submission; generation is not verification;
verification is not publication unless the workflow explicitly defines
it. UI hiding is not a security boundary; backend authorization remains
authoritative.

A conceptual recommendation lifecycle might be
`GENERATED → NEEDS_REVIEW → ACCEPTED / REJECTED / DEFERRED → IMPLEMENTED → VERIFIED → OUTCOME_REVIEWED`.
Map this to existing workflow capabilities before implementation; do not
create a parallel workflow engine unnecessarily.

For significant recommendations, record evidence, model/process, content
version, reviewer decision, rationale, resulting change, verification,
and outcome where available.

**Firestore remains the authoritative datastore.** Sheets must not
become a competing runtime source of truth. Reporting exports should be
explicit outputs, not an undocumented second database. Backend services
own authorization, workflow enforcement, concurrency, and audit.

Use least-privilege access. Protect platform tokens and credentials.
Prefer mocks and local emulators for tests. Avoid unnecessary production
reads and writes. Never run destructive operations against production
during ordinary testing. Production data operations require explicit
authorization. Keep test data separate, enforce retention/deletion
rules, and prevent internal notes from leaking into public outputs.

## 14. Privacy, fairness, and accessibility

Collect only data needed for a documented purpose. Prefer aggregate
patterns and safe internal references over unnecessary identifiers.
Public visibility does not automatically mean unrestricted reuse. Follow
platform terms, applicable law, privacy rules, copyright constraints,
rate limits, and deletion requirements.

Do not put raw comments into broad AI prompts if redacted excerpts will
suffice. Do not send private or identifying data to external models
unless approved and data-handling conditions are appropriate. Commenters
may not represent silent viewers; identify sample size, coverage, and
bias. Do not suppress legitimate criticism merely because it is
negative.

Review audio clarity, legible on-screen text, sufficient reading time,
consistent notation, captions where appropriate, contrast, pacing,
transitions, spoken/on-screen alignment, suitable language complexity,
and accurate depiction of equations and assumptions. AI can flag
potential issues, but actual video rendering and accessibility require
appropriate preview or tests.

## 15. Knowledge reuse and consistency

Maintain reusable, versioned assets such as verified definitions,
notation conventions, known misconceptions, checked examples,
topic/subtopic relationships, prerequisites, follow-up links, editorial
rules, approved references, resolved audience questions, and known
limitations.

AI may compare related content for conflicting definitions, inconsistent
answers, notation differences, missing prerequisites, challenges that
test untaught methods, or corrections not propagated elsewhere. Not
every difference is an error: conventions and valid methods can differ.
Flag discrepancies for review rather than automatically normalizing
them.

## 16. Future AI roadmap

This roadmap is proposed, not a claim that the features already exist.

1.  **Foundation:** canonical IDs, learning objectives, verified
    solutions, content versions, provenance.
2.  **Pre-publication review:** mode-specific checklists, ambiguity
    flags, calculation checks, reviewer summaries.
3.  **Comment intelligence:** authorized imports, classification,
    clustering, high-risk error reports, evidence-linked summaries.
4.  **Opportunity backlog:** map insight clusters to canonical modes,
    find duplicates and existing answers, prioritize transparently.
5.  **Analytics integration:** authorized connectors, time-windowed
    data, performance context, cautious hypotheses.
6.  **Feedback loop:** link recommendations to revisions, verify
    content, observe outcomes, record what worked.
7.  **Cross-library intelligence:** recurring misconceptions,
    prerequisite links, conflicts, learning paths.
8.  **Carefully evaluated automation:** only low-risk, reversible tasks
    after reliability is demonstrated.

Do not begin with an autonomous publishing agent. Begin with evidence
quality, correctness, traceability, and reviewer usefulness.

## 17. AI evaluation requirements

Every AI feature needs a written evaluation plan before production use.
Define the task precisely; "analyze comments" is too broad. "Cluster
comments about the same unresolved step and cite supporting comments" is
testable.

Use a reviewed, authorized dataset covering clear questions, ambiguity,
sarcasm, multiple languages where in scope, valid alternative methods,
incorrect claims, error reports, spam, duplicates, insufficient context,
rare high-severity issues, contradictions, and cases where no action is
appropriate.

Measure relevant precision/recall, cluster quality, extraction accuracy,
evidence-link accuracy, unsupported inference rate, missed high-severity
issues, reviewer decisions, stability across model/prompt versions,
language coverage, latency, cost, and operational failures. For error
detection, pay special attention to false negatives.

When a failure is found, create a regression case where possible. Do not
improve benchmarks by removing difficult cases or weakening assertions.

## 18. Non-negotiable principles

1.  Audience value comes first.
2.  Reach must be earned without misleading viewers.
3.  Comments are the primary qualitative starting point, with sampling
    bias acknowledged.
4.  Analytics provide context, not automatic explanations.
5.  Reuse prior analysis only after checking freshness and provenance.
6.  Correctness is mandatory; plausible AI output is not verified
    output.
7.  Significant recommendations need evidence and visible uncertainty.
8.  Frequency is not severity.
9.  Never fabricate audience comments, sentiment, statistics, or
    sources.
10. Never shame learners for mistakes.
11. Keep canonical mode names stable.
12. Keep content mode separate from media format and technique.
13. AI must not bypass governed workflows.
14. Preserve data provenance.
15. Protect privacy and platform compliance.
16. Firestore remains authoritative.
17. Preserve the 15-stage workflow, Save Draft/Submit distinction,
    optimistic concurrency, audit, GAR-02, and internal-note isolation.
18. Use mocks and local emulators for tests; do not run destructive
    production operations during ordinary development.
19. Evaluate AI and maintain regression tests.
20. Turn discovered errors and confusion into durable improvements.
21. Silence is not proof of correctness or understanding.
22. Keep humans accountable for consequential editorial decisions.
23. Make uncertainty visible.
24. Prefer useful revisions over unnecessary volume.
25. Build trust over time.

## 19. Reusable instruction for future AI coding prompts

> **Burra Pariksha Content Excellence Baseline**
>
> Burra Pariksha exists to deliver accurate, practical,
> audience-centered educational content that helps people understand
> concepts, solve real problems, and apply knowledge independently.
> Sustainable reach matters, but never outranks correctness, usefulness,
> trust, privacy, or platform compliance.
>
> Use canonical modes consistently: `TOPIC_INTRODUCTION` (Topic
> Introduction Video), `WORKED_EXAMPLES` (Worked Examples Video), and
> `QUESTION_CHALLENGE_SHORT` (Question Challenge Short).
>
> Treat comments as the primary qualitative starting point for
> understanding questions, confusion, misconceptions, alternative
> methods, real-life needs, and follow-up requests. The claim that
> comments will generate 99.9999999999999% of insights is strategic
> emphasis, not a measured statistic. Use permitted analytics and prior
> analyses as supporting context. Preserve provenance, time windows,
> uncertainty, and sampling limitations.
>
> Significant recommendations must state the observation, evidence,
> interpretation, confidence and limitations, proposed action, expected
> benefit, risks, verification plan, and outcome measure. Never invent
> audience sentiment, comments, metrics, sources, or certainty. A single
> credible correctness report may deserve urgent review.
>
> AI must not bypass the established 15-stage workflow, Save Draft
> versus Submit for Verification, backend authorization, optimistic
> concurrency, audit, GAR-02 anti-self-approval, or internal-note
> isolation. Firestore remains authoritative; Sheets must not become a
> competing runtime source of truth. Use mocks and local emulators.
> Never deploy, push, or mutate production data without explicit
> authorization.
>
> Before implementation, define scope, evidence requirements, failure
> modes, privacy constraints, evaluation, regression tests, and human
> approval boundaries. Prefer small, testable, auditable improvements
> over broad autonomous behavior.

## 20. Maintenance and repository placement

Store this document and link to
it from the main `README.md` under **Product and Content Principles**.
Keep the README link concise; the full baseline belongs here.

Related specifications should cover the canonical mode schema, 15-stage
workflow, mode-specific editorial templates, comment-intelligence data
model, platform integration and retention policy, AI evaluation suite,
verification checklist, analytics definitions, and experiment records.
Avoid copying this entire baseline into every document; link to the
canonical source.

When changing this baseline, identify the principle affected, state the
reason and evidence, assess impact on
modes/workflow/data/privacy/quality gates, preserve compatibility where
possible, update related specifications and tests, and record
significant decisions. Do not change foundational rules merely because
one model suggests it.

## 21. Final commitment

Burra Pariksha should grow by becoming better at understanding what
learners actually need and delivering content that genuinely helps them.
Its durable advantage will not be the quantity of AI-generated videos,
but the combination of editorial judgment, verified explanations,
careful comment analysis, relevant platform data, structured content
modes, and a feedback loop that remembers what has been learned.

Every comment can be a clue. Every recurring confusion can reveal a
missing explanation. Every credible error report can prevent future
learners from being misled. Every successful revision can become
reusable knowledge. Every metric can help ask a better question when
interpreted carefully.

**Operating commitment:** Understand the audience, solve the real
learning problem, verify the content, listen to the response, and
improve with evidence. Earn more views by consistently delivering more
value.
