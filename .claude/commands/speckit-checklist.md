Generate a custom checklist for the current feature based on user requirements.

**CRITICAL CONCEPT**: Checklists are **UNIT TESTS FOR REQUIREMENTS WRITING** — they validate the quality, clarity, and completeness of requirements in a given domain. They do NOT test implementation behavior.

- ❌ NOT "Verify the button clicks correctly"
- ❌ NOT "Test error handling works"
- ✅ YES "Are visual hierarchy requirements defined for all card types?" (completeness)
- ✅ YES "Is 'prominent display' quantified with specific sizing/positioning?" (clarity)

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

Check if `.specify/extensions.yml` exists and look for `hooks.before_checklist`. Process hooks per the standard hook logic (optional hooks prompt user; mandatory hooks execute before proceeding). Skip silently if no hooks or file missing.

## Execution Steps

1. **Setup**: Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json` from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS list. All file paths must be absolute.

2. **Clarify intent (dynamic)**: Derive up to THREE initial contextual clarifying questions. They MUST:
   - Be generated from the user's phrasing + extracted signals from spec/plan/tasks
   - Only ask about information that materially changes checklist content
   - Be skipped individually if already unambiguous in `$ARGUMENTS`
   - Prefer precision over breadth

   Generation algorithm:
   1. Extract signals: feature domain keywords (e.g., auth, latency, UX, API), risk indicators ("critical", "must", "compliance"), stakeholder hints ("QA", "review", "security team"), and explicit deliverables ("a11y", "rollback", "contracts").
   2. Cluster signals into candidate focus areas (max 4) ranked by relevance.
   3. Identify probable audience & timing (author, reviewer, QA, release) if not explicit.
   4. Detect missing dimensions: scope breadth, depth/rigor, risk emphasis, exclusion boundaries, measurable acceptance criteria.
   5. Formulate questions from these archetypes: Scope refinement, Risk prioritization, Depth calibration, Audience framing, Boundary exclusion, Scenario class gap.

   Defaults when interaction impossible:
   - Depth: Standard
   - Audience: Reviewer (PR) if code-related; Author otherwise
   - Focus: Top 2 relevance clusters

   Output the questions (label Q1/Q2/Q3). After answers: if ≥2 scenario classes remain unclear, you MAY ask up to TWO more targeted follow-ups (Q4/Q5). Do not exceed five total questions.

3. **Understand user request**: Combine `$ARGUMENTS` + clarifying answers to derive checklist theme, consolidate must-have items, and map focus selections to category scaffolding.

4. **Load feature context**: Read from FEATURE_DIR:
   - spec.md, plan.md (if exists), tasks.md (if exists)
   - Load only necessary portions relevant to active focus areas

5. **Generate checklist** - Create "Unit Tests for Requirements":
   - Create `FEATURE_DIR/checklists/` directory if it doesn't exist
   - Generate unique checklist filename based on domain (e.g., `ux.md`, `api.md`, `security.md`)
   - **If file does NOT exist**: Create new file, number items starting from CHK001
   - **If file exists**: Append new items continuing from the last CHK ID
   - Never delete or replace existing checklist content — always preserve and append

   **CORE PRINCIPLE — Test the Requirements, Not the Implementation**:
   Every checklist item MUST evaluate the REQUIREMENTS THEMSELVES for:
   - **Completeness**: Are all necessary requirements present?
   - **Clarity**: Are requirements unambiguous and specific?
   - **Consistency**: Do requirements align with each other?
   - **Measurability**: Can requirements be objectively verified?
   - **Coverage**: Are all scenarios/edge cases addressed?

   **HOW TO WRITE CHECKLIST ITEMS**:

   ❌ **WRONG** (Testing implementation):
   - "Verify landing page displays 3 cards"
   - "Test hover states work on desktop"

   ✅ **CORRECT** (Testing requirements quality):
   - "Are the exact number and layout of featured items specified? [Completeness, Spec §FR-1]"
   - "Are hover state requirements consistently defined for all interactive elements? [Consistency]"
   - "Is 'prominent display' quantified with specific sizing/positioning? [Clarity, Spec §FR-4]"
   - "Are loading states defined for asynchronous data? [Gap]"

   Each item should:
   - Be in question format asking about requirement quality
   - Include quality dimension in brackets: [Completeness/Clarity/Consistency/Measurability/Coverage/Gap/Ambiguity/Conflict/Assumption]
   - Reference spec section `[Spec §X.Y]` when checking existing requirements
   - Use `[Gap]` marker when checking for missing requirements

   **🚫 ABSOLUTELY PROHIBITED** — These make it an implementation test:
   - ❌ Any item starting with "Verify", "Test", "Confirm", "Check" + implementation behavior
   - ❌ References to code execution, user actions, system behavior
   - ❌ "Displays correctly", "works properly", "functions as expected"
   - ❌ Test cases, test plans, QA procedures
   - ❌ Implementation details (frameworks, APIs, algorithms)

   **Traceability Requirements**:
   - MINIMUM: ≥80% of items MUST include at least one traceability reference ([Spec §X.Y], [Gap], [Ambiguity], [Conflict], or [Assumption])

   **Content Consolidation**:
   - Soft cap: If raw candidate items > 40, prioritize by risk/impact
   - Merge near-duplicates checking the same requirement aspect

6. **Structure Reference**: Generate the checklist following the canonical template in `.specify/templates/checklist-template.md`. If template is unavailable, use: H1 title, purpose/created meta lines, `##` category sections containing `- [ ] CHK### <requirement item>` lines with globally incrementing IDs starting at CHK001.

7. **Report**: Output full path to checklist file, item count, and summarize whether the run created a new file or appended to an existing one. Summarize focus areas selected, depth level, actor/timing, and any explicit user-specified must-have items incorporated.

## Post-Execution Checks

Check if `.specify/extensions.yml` exists and look for `hooks.after_checklist`. Process hooks per the standard hook logic. Skip silently if no hooks or file missing.
