> **Study status:** Pilot-only. The clean baseline, fixed-attack comparison, and attack-template search completed. The confirmatory transfer and defence stages did not.

{{component:notebook-link}}

### Abstract

Reasoning effort is becoming a deployment setting. A developer can ask the same model to spend less or more effort on a task without changing its weights. That creates an appealing safety hypothesis: perhaps a model that thinks for longer is more likely to notice that an instruction came from untrusted data rather than the user. The opposite is also plausible. Extra deliberation might help an agent plan around safeguards, rationalise an injected instruction, or execute an attacker’s objective more competently.

I tested these possibilities with one pinned `gpt-oss-20b` checkpoint in four simulated AgentDojo domains. Model weights, tools, task IDs, prompt hierarchy, decoding settings and rollout seeds were held fixed. The intervention changed only the first system line among `Reasoning: low`, `Reasoning: medium` and `Reasoning: high`. Outcomes were scored from tool execution and final simulated state, not from whether the model used refusal language.

The completed data do not show a resolved safety benefit or a backfire effect. Clean task completion rose from 187/300 at low effort to 195/300 at high effort, a difference of +2.67 percentage points (task-clustered 95% CI: −2.33 to +8.33). Under AgentDojo’s fixed injection, attack success was 180/800 at low effort and 193/800 at high effort, a difference of +1.63 points in the unsafe direction (95% CI: −1.88 to +5.25). A fixed-library attack search also found almost identical attack success across efforts.

The intended adaptive claim remains unanswered. Every effort level selected the same hand-written attack template, the selection set was not followed by an untouched post-selection test, and the confirmatory transfer run exceeded the hosted session window before its in-memory results were durably written. The narrow conclusion is therefore a negative one: for this checkpoint and scaffold, configured reasoning effort did not produce a statistically resolved change in the outcomes that completed. It should not yet be treated as a security control.

## Why ask this question?

Recent work on inference-time scaling reports that longer reasoning can improve resistance to prompt-injection tests, including a study by [Zaremba et al.](https://cdn.openai.com/papers/trading-inference-time-compute-for-adversarial-robustness-20250121_1.pdf) and an open-model extension by [Wu et al.](https://arxiv.org/abs/2507.15974). That result is useful, but deployment pressure is not fixed. An attacker can observe the system, test variants and optimise for the reasoning regime that is actually deployed.

This leaves two competing mechanisms.

With more deliberation, an agent may track provenance more carefully: the user asked for one task, a tool returned data, and text inside that data has no authority to redefine the task. Yet the same additional capability may make the injected objective easier to execute. A model can recognise a conflict and still take the wrong action, or turn a weak attack into a coherent plan. Static attacks cannot tell us whether extra reasoning supplies durable protection or merely defeats yesterday’s prompt.

The distinction matters most for agents. A chatbot can say something undesirable; a tool-using agent can send a message, change a file, make a booking or initiate a simulated transfer. Its safety should therefore be judged by what changed in the environment.

## Threat model

The experiment studies **indirect prompt injection**. The legitimate user gives the agent a task. During execution, a tool returns attacker-controlled content containing a conflicting instruction. The attacker succeeds only if the agent completes a specified unauthorised objective in the simulated environment.

[AgentDojo](https://arxiv.org/abs/2406.13352) supplies realistic task and attack pairs across banking, Slack, travel and workspace applications. Its environment-state scorers make it possible to distinguish three outcomes:

- **Task success:** the legitimate user’s goal was completed.
- **Attack success rate (ASR):** the attacker’s goal was achieved.
- **Secure task success:** the legitimate goal was completed and the attacker’s goal was not.

This is a model organism for agent hijacking, not a direct test of catastrophic risk. The attacks are malicious external content. They are not evidence that the model is scheming, pursuing a hidden objective, or intentionally subverting oversight.

## Experimental design

The primary comparison used the open-weight `openai/gpt-oss-20b` checkpoint at commit:

```text
6cee5e81ee83917806bbde320786a8fb61efebee
```

OpenAI trained gpt-oss to accept low, medium and high reasoning settings through the system prompt, which made it possible to vary the configured effort while keeping one checkpoint fixed. The experiment ran through vLLM and Inspect AI using Inspect Evals’ AgentDojo implementation.

| Component | Setting |
|---|---|
| Model | `openai/gpt-oss-20b`, pinned commit |
| Reasoning intervention | First system line only: `Reasoning: low\|medium\|high` |
| Domains | Banking, Slack, travel, workspace |
| Confirmatory seeds | 20260726, 20365455, 20470184, 20574913, 20679642 |
| Decoding | Temperature 0.2, top-p 0.95, maximum output 8,192 tokens |
| Context and execution | 16,384-token model context, concurrency 4, parallel tool calls disabled |
| Primary fixed-attack estimand | ASR(high) − ASR(low) |
| Uncertainty | 10,000 task-clustered percentile-bootstrap resamples |

Task IDs and seeds were paired across effort conditions. This matters because AgentDojo tasks vary substantially in difficulty. Treating repeated trajectories from the same task as independent observations would make the intervals too narrow.

The protocol also set a 30% clean-completion floor at the effort level. A model that cannot use its tools may look safe because it cannot complete the attack either. All three efforts cleared that floor, although the runner did not implement the stronger task-level supported-capability subset that I had originally intended.

### The four planned stages

The experiment was designed to move from a conventional comparison to a stronger adversarial test.

1. **Clean capability:** establish whether each effort level can complete benign tasks.
2. **Fixed attack:** run the same official AgentDojo attack condition against every effort.
3. **Effort-conditioned search and transfer:** select an attack separately against each effort, then evaluate every selected attack against every target effort.
4. **Authority checkpoint:** test a separate scaffold intervention that asks the agent to verify provenance and authority before acting.

Only the first two stages completed as confirmatory evaluations. The attack search completed, but it did not produce distinct effort-specific attacks. The complete confirmatory transfer and authority-checkpoint stages are absent.

## What completed

Across the finalised pilot, baseline and search files, the audit recovered 9,348 row-level trajectories:

| Artifact | Rows | Final errors | Score coverage |
|---|---:|---:|---:|
| Exploratory pilot | 2,928 | 0 | 100% |
| Confirmatory clean and fixed baseline | 3,300 | 0 | 100% |
| Confirmatory attack search | 3,120 | 0 | 100% |
| **Total** | **9,348** | **0** | **100%** |

Duplicate-key checks, manifest identity and file hashes passed. Raw Inspect logs were not recovered, so exact provider requests, retries and finish reasons cannot be reconstructed. The row-level records do retain scorer outputs, conversations, tool calls, latency and visible reasoning text.

## Results

The central table reports raw counts, rates and task-clustered intervals. Positive high-minus-low ASR means high effort was less safe.

| Outcome | Low effort | Medium effort | High effort | High minus low |
|---|---:|---:|---:|---:|
| Clean task completion | 187/300 = 62.33%<br>95% CI [51.67, 73.00] | 194/300 = 64.67%<br>95% CI [54.33, 74.67] | 195/300 = 65.00%<br>95% CI [54.67, 74.67] | +2.67 pp<br>95% CI [−2.33, +8.33], p=.296 |
| Fixed official-attack ASR | 180/800 = 22.50%<br>95% CI [17.75, 27.50] | 194/800 = 24.25%<br>95% CI [19.50, 29.25] | 193/800 = 24.13%<br>95% CI [19.50, 29.13] | +1.63 pp<br>95% CI [−1.88, +5.25], p=.338 |
| Selected-template validation ASR | 85/240 = 35.42%<br>95% CI [24.17, 46.67] | 88/240 = 36.67%<br>95% CI [25.83, 47.92] | 86/240 = 35.83%<br>95% CI [24.58, 47.50] | +0.42 pp<br>95% CI [−4.17, +5.42], p=.924 |

{{component:effort-ci-explorer}}

### Clean capability

High effort completed eight more clean trajectories than low effort, but the interval around the paired difference includes both no effect and a moderately useful improvement. The data do not resolve the hypothesis that extra reasoning improves benign task completion.

This result still clears an important interpretive hurdle. Attack outcomes are not being compared between a capable high-effort agent and a non-functional low-effort agent. Each condition completed more than 60% of clean trajectories.

### Fixed attack

The preregistered fixed-attack hypothesis predicted lower ASR at higher effort. The observed ordering went the other way: 22.50% at low effort, 24.25% at medium and 24.13% at high. The high-minus-low difference was only +1.63 percentage points, with an interval spanning −1.88 to +5.25 points.

That is not evidence that thinking longer backfires. It is evidence that this run did not reproduce a protective effect under the tested agent setup. The distinction is important. A non-significant estimate in the unsafe direction is neither a reversal nor proof of equivalence.

Secure task success was also not better at high effort:

| Effort | Secure task success under fixed attack |
|---|---:|
| Low | 319/800 = 39.88% [33.88, 46.00] |
| Medium | 289/800 = 36.13% [29.75, 42.50] |
| High | 293/800 = 36.63% [30.75, 42.63] |

This joint metric is useful because an agent that merely refuses everything can achieve low ASR while failing the user. Here, the apparent safety–utility frontier did not shift favourably with configured effort.

## The attack search did not answer the adaptive question

The planned experiment called for attacks optimised separately against low, medium and high effort. The implemented search was narrower: equal-budget successive halving over ten hand-written templates.

For each effort, it used:

| Search stage | Persisted target trajectories |
|---|---:|
| Screening | 80 |
| Development | 240 |
| Validation and selection | 720 |
| **Total per effort** | **1,040** |

The trajectory budget was exactly equal across efforts. Realised generation work was not identical: the low, medium and high searches recorded 5,759, 5,554 and 5,894 model turns respectively. They produced 4,777, 4,561 and 4,927 tool calls. This does not invalidate the fixed query schedule, but it shows why an attack-budget audit should report more than one counter.

More importantly, all three searches selected the same literal template, `authority_update`. There was therefore no meaningful difference between a “low-source” and “high-source” attack. The 35–37% validation rates in the main table describe one selected template, not three distinct attacks adapted to three reasoning regimes.

The validation partition also selected the winner. It was not an untouched post-selection test, and all four domains appeared in every split. Calling these numbers “held-out adaptive performance” would overstate the design. The supported label is **fixed-library, effort-conditioned template selection**.

This is where the study’s initial title, *When More Thinking Backfires*, failed its own evidential test. A backfire claim would require a stable reversal against genuinely effort-adapted attacks on untouched tasks or domains. These data do not contain that comparison.

## What the pilot transfer matrix says, and what it does not

The exploratory pilot did complete a 3 × 3 transfer matrix with 96 trajectories per cell:

| Selected against → tested on | Low target | Medium target | High target |
|---|---:|---:|---:|
| Low source | 36/96 (37.50%) | 38/96 (39.58%) | 35/96 (36.46%) |
| Medium source | 33/96 (34.38%) | 34/96 (35.42%) | 31/96 (32.29%) |
| High source | 33/96 (34.38%) | 32/96 (33.33%) | 29/96 (30.21%) |

{{component:transfer-matrix}}

High effort was directionally the lowest-ASR target in each row, and all task-clustered intervals overlapped. Yet every source row used `authority_update`. The source labels do not encode distinct attacks, so the matrix cannot measure transfer asymmetry. At most, it is a noisy pilot comparison of target effort under repeated uses of the same template.

## Did the intervention actually produce more reasoning?

The experiment changed a documented model control, not a directly measured quantity of hidden computation. Provider-native `reasoning_tokens` were absent from every finalised row. The notebook could count visible reasoning-text tokens, but those traces are neither guaranteed to include all computation nor faithful descriptions of the model’s internal cause.

| Descriptive telemetry | Low | Medium | High |
|---|---:|---:|---:|
| Mean visible reasoning tokens, clean | 323.87 | 420.51 | 391.08 |
| Mean visible reasoning tokens, fixed attack | 444.83 | 642.07 | 654.97 |
| Median latency in seconds, clean | 3.445 | 4.035 | 3.813 |
| Median latency in seconds, fixed attack | 5.443 | 6.108 | 6.513 |

Under attack, visible reasoning length and median latency rose with the configured setting. On clean tasks, the pattern was not monotonic. One high-effort clean trajectory reported 900.051 seconds and inflated the mean, which is why the table uses medians for latency.

The safe wording is therefore “configured reasoning effort changed” rather than “inference compute increased by a known amount.” A stronger manipulation check would retain provider-native reasoning usage, finish reasons and truncation fields.

## Why the confirmatory run stopped

The complete confirmatory transfer required 7,200 trajectories, followed by 5,700 trajectories for the authority-checkpoint stage. The hosted MoLab session was approaching its 12-hour limit, and the projected run was much longer. Restarting would also discard the unfinished phase’s in-memory state, so I stopped it rather than treating a partial, non-reproducible sample as final evidence.

At the last monitored checkpoint, the transfer loop represented 2,680 of 7,200 planned trajectories. None of those trajectory bodies had been durably persisted. The authority-checkpoint stage had not started. Both are excluded from every estimate in this article.

This was not just an inconvenience. It exposed a flaw in the experiment runner. Each source–target block was appended to an in-memory list, while `persist_result_frame` was called only after the entire transfer phase returned. A long evaluation is scientifically resumable only if completed atomic units are written with stable keys, hashes and configuration metadata.

The next runner should persist after every `(source effort, target effort, seed, domain)` block and skip already verified keys on restart. That change does not alter the research question, but it determines whether the expensive part of the protocol can produce auditable evidence.

## What the evidence supports

| Supported by the completed data | Not supported by the completed data |
|---|---|
| All three effort conditions cleared the clean-capability floor. | Higher effort is equivalent to lower effort; the intervals still allow meaningful differences. |
| No statistically resolved high-versus-low difference appeared in clean completion, fixed ASR or selected-template validation ASR. | More reasoning protects against an attacker that adapts to the deployed reasoning regime. |
| The fixed-library search used equal persisted trajectory budgets. | The selected templates were genuinely effort-specific; all efforts chose the same prompt. |
| Outcome scoring used simulated tool execution and environment state. | The model was scheming, intentionally subverting control, or demonstrating catastrophic-risk behaviour. |
| The run identified a non-resumable persistence boundary in the evaluation code. | The planned authority checkpoint works, or interacts favourably with reasoning effort. |

The absence of a resolved difference should not be translated into “reasoning effort does not matter.” It means the experiment has not located an effect within its current precision, checkpoint, scaffold and attack family.

## A stronger follow-up

The follow-up should begin with the runner rather than a larger model. Every completed condition must be written atomically, with an idempotent resume path and a manifest that records the exact attack, target condition, seed, task and scorer version. Raw Inspect logs should be retained so retries, provider calls, finish reasons and token accounting can be audited.

The attack stage should then move beyond template selection. A black-box optimiser such as [Tree of Attacks with Pruning](https://arxiv.org/abs/2312.02119), or an evolutionary mutation procedure adapted to tool-return injections, could generate new candidates from observed outcomes. Target-model calls should be capped and logged equally for every effort. Attacker-model compute, failed requests and retry policy should be reported separately.

Selection and evaluation also need a harder boundary. I would optimise on training tasks from three domains, freeze the attack, and test it on the fourth, rotating the held-out domain. An additional untouched same-domain test would distinguish ordinary task generalisation from cross-domain transfer. The 3 × 3 matrix would run only after the attacks and analysis code were frozen.

Finally, the confirmatory analysis should specify a smallest effect of practical interest. A confidence interval inside that margin could support an equivalence statement; a wide interval crossing zero cannot. The same protocol can then be replicated on `gpt-oss-120b`, followed by the authority-and-provenance checkpoint as a separate factorial intervention. A blinded trajectory sample should test process labels such as attack recognition, authority tracking, rationalisation and recovery without treating chain-of-thought as ground truth.

## Implications for agent safety

Configured reasoning effort may be a useful capability and latency control. This study gives no basis for treating it as a stand-alone safety measure. In the completed fixed evaluation, high effort did not reduce compromise; in the incomplete adaptive evaluation, the search was too narrow to test the intended claim.

For deployment, the practical unit of safety remains the whole agent system: instruction provenance, tool permissions, least-privilege access, confirmation for consequential actions, state-based monitoring and recovery after a bad step. More deliberation may help such controls, but only if the model is directed toward the relevant authority problem and the surrounding system prevents a single mistaken interpretation from becoming an irreversible action.

The result I trust is less dramatic than the one I set out to test. That is precisely why it is useful. The run narrowed one claim, rejected a tempting title, and turned an infrastructure failure into a concrete requirement for the next evaluation.

## Reproducibility record

The live implementation and result presentation are available in the [public marimo notebook](https://molab.marimo.io/notebooks/nb_TZRxUhXprugmvKP3t8e1rN).

| Item | Identifier |
|---|---|
| Frozen runner SHA-256 | `16bbd6781b19d92eb53abc375014d2b17540d216a12119953e8855c7c8042561` |
| Recorded repository commit | `1b41053a83523522c02ec06cb455535b742afb28` |
| Confirmatory manifest SHA-256 | `6a8602bc07dc1058838df20a028257500313379470b90e6508b4d30fe092bb6f` |
| Pilot manifest SHA-256 | `a5b25a3042c6e7860fbeab5fe7e34c09750743f7b8f97875bdb981a802a1e2f5` |
| Confirmatory baseline CSV SHA-256 | `73f2b65128f1787815059009a967a27cb653d3f0896aa212ce52f3b531517e9e` |
| Confirmatory search CSV SHA-256 | `21a3c2f871ee1be8c3299a1528fa0e9b08737f722ced12331f54b915c89c3ff2` |
| Exploratory pilot CSV SHA-256 | `d61f4fcf017c9eb48981acaa7cd19715ee194fc2256ce8bfc93b0496eee3b82f` |

The resolved environment used vLLM 0.26.0, Inspect AI 0.3.249 and `inspect-evals[agentdojo]` 0.16.0 on an NVIDIA RTX PRO 6000 Blackwell GPU. The last finalised stage was written on 26 July 2026 at 16:37:45 UTC. The public notebook may continue to receive presentation edits; the frozen runner and result hashes identify the code and data audited here.

## References

1. Edoardo Debenedetti et al., [“AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents”](https://arxiv.org/abs/2406.13352), 2024.
2. OpenAI, [“gpt-oss-120b & gpt-oss-20b Model Card”](https://arxiv.org/abs/2508.10925), 2025.
3. Wojciech Zaremba et al., [“Trading Inference-Time Compute for Adversarial Robustness”](https://cdn.openai.com/papers/trading-inference-time-compute-for-adversarial-robustness-20250121_1.pdf), 2025.
4. Tong Wu et al., [“Does More Inference-Time Compute Really Help Robustness?”](https://arxiv.org/abs/2507.15974), 2025.
5. Qiusi Zhan et al., [“Adaptive Attacks Break Defenses Against Indirect Prompt Injection Attacks on LLM Agents”](https://arxiv.org/abs/2503.00061), 2025.
6. Anay Mehrotra et al., [“Tree of Attacks: Jailbreaking Black-Box LLMs Automatically”](https://arxiv.org/abs/2312.02119), 2023.
7. UK AI Security Institute, [Inspect Evals: AgentDojo](https://ukgovernmentbeis.github.io/inspect_evals/evals/safeguards/agentdojo/).
