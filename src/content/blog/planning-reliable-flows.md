---
title: "Design the unhappy path before you automate"
description: "A practical planning checklist for flows that need to survive missing data, retries and handovers."
category: "Power Automate"
date: 2026-10-25
readingMinutes: 3
draft: false
---

It is easy to sketch an automation when every input is present and every step succeeds. The more useful design exercise is to ask what should happen when that is not true.

For a Power Automate project, write the failure story alongside the happy path before building the flow.

## Define a successful outcome

Describe success in business terms. “The flow finished” is different from “the right person received the right document once.”

Write down the evidence that would confirm the outcome. This also helps decide what should be recorded for someone investigating a problem later.

## Think about repeated work

Ask what should happen if the same request arrives twice or a person tries again because they did not see a confirmation.

Consider whether a step can be repeated safely. Creating another record, sending another message or generating another document may require different decisions. Make those decisions explicit before choosing the implementation.

## Plan a recovery route

For each important step, consider:

1. What information could be missing or invalid?
2. What happens if a dependent service is unavailable?
3. Who needs to know about the failure?
4. What context will help that person investigate?
5. Where should the work resume after a correction?

Keep notifications useful. A message that identifies the affected request and the next action is more valuable than an unexplained failure alert.

## Leave a handover trail

Record the workflow's purpose, owner, dependencies and recovery steps somewhere the team can find. Avoid putting passwords, access tokens or sensitive records into notes or error messages.

Review the workflow with the person who would support it while you are away. If they cannot tell what happened or how to resume, the handover needs more work.

## Test the uncomfortable cases

Try a blank field, a repeated request, an unexpected file and an unavailable dependency in a safe test environment. Record the expected outcome before running each case.

The aim is not to predict every possible failure. It is to make ordinary failures understandable and recoverable.

