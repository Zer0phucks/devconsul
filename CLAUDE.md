# GUIDELINES AND RULES 

## MAIN WORKFLOW

1. Whenever you start  a new task, start a new branch
2.  Whenever you finishg a task, submit your work to codex for testing and review.
3. If approved,skip to step 8

4. If not approved,

5. make fix all issues from the codex review.
6. Re-submit to codex
7. Repeat until approved.

8. merge the branch with main
9.  use /clear to clear your context  window
10. Then move on to the next task and do it all over again.


# Rules

- use parallel and sequential sub agents to  help manage the context window, and keep  your focus on the big picture while sub agents focus on individual tasks.
- When asked to work on the tasks from a TASKS.md file, keep working until all tasks are complete.
- create setup scripts (e.g., init.sh) to gracefully start servers, run test suites, and linters.
-Always shutdown/kill any dev servers/services when you are done wiith them