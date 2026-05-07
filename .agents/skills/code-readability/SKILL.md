---
name: code-readability
description: Improve code indentation, readability, simplicity, and long-term maintainability. Use this skill whenever the user asks to make code cleaner, easier to read, simpler, better structured, more scalable, easier to maintain, less nested, less duplicated, or when they mention indentation, formatting, refactoring for clarity, code quality, long-term scale, code lisible, simplifier, maintenable, indentation, ou scale sur le long-terme.
---

# Code Readability

Use this skill to improve existing code without changing behavior. The goal is code that is easier to scan today and easier to extend later.

## Operating Principles

- Preserve behavior first. Read the surrounding code and understand the current contract before editing.
- Prefer the smallest useful change. Do not redesign architecture when local simplification is enough.
- Follow the repository's existing style, formatter, naming conventions, and file boundaries.
- Make code more obvious by reducing indentation depth, separating concerns, and naming intermediate values.
- Optimize for future edits: the next developer should know where to add behavior without reading unrelated branches.

## Workflow

1. Identify the target scope.
   - Confirm which files, functions, components, or modules are in scope.
   - If the user gives a broad request, inspect the most relevant files first and choose a narrow, defensible starting point.

2. Establish the current behavior.
   - Read the code path before changing it.
   - Note inputs, outputs, side effects, state updates, API calls, rendering behavior, and error handling.
   - If behavior is unclear, preserve it and call out the uncertainty.

3. Find readability pressure points.
   - Deep nesting or long conditional branches.
   - Repeated expressions or duplicated blocks.
   - Large functions mixing data shaping, validation, rendering, and side effects.
   - Names that hide intent or force readers to inspect implementation details.
   - Inline logic that makes JSX, SQL, shell commands, or async flows hard to scan.
   - Formatting that fights the project formatter.

4. Apply targeted improvements.
   - Use early returns or guard clauses to flatten control flow.
   - Extract small helpers only when they remove real complexity or meaningful duplication.
   - Name derived values when the name explains why the value exists.
   - Keep helpers close to their use until there is clear reuse pressure.
   - Split rendering into local functions or components only when the current component is hard to scan.
   - Replace clever expressions with boring, explicit code when it reduces cognitive load.

5. Verify.
   - Run the formatter or lint command that matches the touched files.
   - Run focused tests or build checks when the change touches executable code.
   - If verification cannot run, state exactly what was not verified.

## Indentation And Structure

- Let the configured formatter own whitespace, line wrapping, and indentation.
- Reduce indentation by simplifying control flow, not by manually fighting the formatter.
- Avoid nested ternaries in production code unless the local style clearly accepts them and the expression is trivial.
- Keep `try/catch`, transaction, and resource cleanup boundaries explicit; do not flatten them in ways that hide failure behavior.
- In JSX, move non-trivial conditions and mapped data above `return` when it makes the markup easier to read.

## Simplicity Rules

- Remove dead branches, unused variables, and redundant comments when verified.
- Prefer one clear data shape over several partially overlapping temporary shapes.
- Avoid new abstractions that only wrap one call without clarifying intent.
- Do not introduce dependencies for formatting, indentation, or small refactors unless the repo already uses them.
- Keep public APIs stable unless the user explicitly asks for an API-level refactor.

## Long-Term Scale

- Respect module ownership. Do not move logic across layers unless the current location clearly blocks maintenance.
- Keep business rules in the same layer as similar existing rules.
- Prefer deterministic helpers for parsing, sorting, grouping, and normalization.
- When adding a helper, choose a name that describes domain intent rather than implementation mechanics.
- Leave a short comment only when it prevents a future reader from misunderstanding a non-obvious constraint.

## Review Checklist

Before finishing, check:

- Behavior is preserved or intentional behavior changes are explicitly listed.
- The touched code has less nesting, duplication, or mixed responsibility than before.
- Names explain intent without becoming verbose.
- The formatter/linter agrees with the result.
- The final response includes changed files and verification performed.

## Output Format

When reporting back, be concise:

- State what changed.
- Mention the main readability improvement.
- List verification commands and results.
- Call out any remaining uncertainty.
