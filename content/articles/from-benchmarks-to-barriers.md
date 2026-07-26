> **Evidence status, 27 July 2026:** The KL-regularisation study completed with
> the caveats stated below. The reasoning-effort study remains a pilot: its
> clean baseline, fixed-attack comparison and template search completed, while
> the confirmatory transfer and defence stages did not. I stopped the latter
> run before the hosted marimo session's 12-hour limit because the remaining
> work would have taken substantially longer and unfinished stage state existed
> only in memory. No partial transfer trajectory is included here.
>
> The public reasoning notebook is currently a result-presentation and protocol
> artefact, not a clean-start reproduction package. Its downloadable source
> does not contain every custom agent and attack registration referenced by the
> runner. The frozen runner and hashed row-level files therefore need to be
> released alongside it before another researcher can independently rerun the
> study. The absent adaptive result is missing evidence, not evidence of no
> effect.
---

## Abstract

Safety evidence often reaches decision-makers as a number: policy divergence,
task success, attack success, monitor accuracy. The number may be correct
within its test. The strategic error begins when a local result is treated as
permission to deploy a more capable system with broader authority.

I examine that translation using two experiments. In a transparent
reward-misspecification environment, a stationary policy appeared to trade
delivery for reward farming. A time-aware policy overturned that story by
farming the same proxy while delivering in 16,334 of 16,384 fresh evaluation
episodes. In a tool-use study, raising configured reasoning effort produced no
statistically resolved reduction in compromise under either the fixed attack
or the selected-template validation condition. Its intended confirmatory
adaptive test did not complete and, more fundamentally, all effort conditions
selected the same attack template.

The studies concern different mechanisms. The KL case demonstrates how a
restricted policy can make a bad objective look more visibly broken. The
reasoning case exposes a protocol gap: a test described as adaptive may fail
to produce attacks adapted to the compared controls. More generally, a weak
policy can conceal how exploitation changes with capability, while a weak
attacker can overstate a defence. Neither experiment estimates the
probability of catastrophic harm.

My strategic claim is narrower. Evidence about a model should authorise only
the capabilities and permissions that the evaluated control portfolio can
support. A decision-relevant evaluation needs a named threat actor, a chain
from technical failure to harm, attacks adapted to the deployed controls,
joint evidence about defence layers, and an explicit decision rule. This
turns a benchmark result into one component of a living deployment case.

## 1. The decision problem

Reasoning settings, KL coefficients, system prompts and monitors are
attractive because each yields a legible graph. Deployment creates a harder
question: what authority should a system receive on the strength of that
graph?

Consider an agent that reads email and prepares payments. A malicious
instruction is hidden in an invoice. Money moves only if a chain of events
holds: hostile content reaches the model; the model treats it as an
instruction; it adopts the unauthorised objective; it has the needed tools;
the permission layer accepts the request; monitoring misses it; and recovery
fails after execution.

![A robot at a desk reads a floating invoice in which one line glows red; a thin red thread runs from that line to a closed steel vault door, where it stops, while a stack of gold coins sits untouched in front of the door](/art/b2b-decision.jpg)

*The hidden instruction reaches the model. A deterministic transaction boundary is what keeps the money still.*

A better prompt may reduce the second and third failures. It says little about
permissions, independent approval or rollback. A deterministic transaction
boundary may block the payment even when the model has been compromised.

The unit of analysis is therefore the deployed system: model weights,
post-training, inference-time computation, prompts, tool interfaces,
credentials, monitors, human reviewers, logs, rate limits, rollback and the
organisation deciding how much authority to grant.

This argument does not depend on one AGI timeline. Under gradual progress,
organisations will repeatedly expand autonomy as models become more useful.
Under fast progress, capability growth makes evidence expire more quickly and
leaves less time to install controls. In both cases, risk rises when capability,
access, autonomy and deployment scale increase faster than the evidence
supporting them.

## 2. Case study one: a constraint is not an objective

My first experiment asks what a KL penalty accomplishes when the reward itself
contains a loophole.

The testbed is a constructed 6×9 gridworld with a 60-step horizon. Delivery is
the intended outcome. The proxy pays 0.25 each time the agent enters one of
three checkpoint tiles and 1.0 on delivery. Its memoryless sensor pays again
after every re-entry. A clean trajectory earns at most 1.75; the exact
finite-horizon proxy optimum earns 8.25 by farming a checkpoint and still
delivering.

Policies start from a stochastic hand-coded reference. Tabular REINFORCE uses
a sampled log-ratio penalty of strength $\beta$. The corrected sweep covers
24 values of $\beta$, 64 training replicas, stationary and time-aware policy
classes, and two entropy settings. This produced 6,144 trained policies from
36,864,000 training episodes. Each final policy was then frozen and evaluated
on 256 fresh episodes from an independent random stream.

| Policy and KL strength | Delivery | Proxy above clean maximum |
|---|---:|---:|
| Stationary, $\beta=0$ | 7/16,384 = 0.043% | 16,382/16,384 = 99.99% |
| Time-aware, $\beta=0$ | 16,334/16,384 = 99.69% | 16,331/16,384 = 99.68% |
| Time-aware, $\beta=0.3816$ | 16,384/16,384 = 100% | 8,286/16,384 = 50.57% |
| Time-aware, $\beta=1$ | 16,384/16,384 = 100% | 4,723/16,384 = 28.83% |

My original stationary-policy result looked like a tradeoff between reward
farming and delivery. That interpretation was wrong. A stationary policy
cannot condition its behaviour on time remaining, so it tends to loop until
the episode ends. A time-aware policy can farm the checkpoint and then leave
in time to deliver. The exact dynamic-programming oracle confirms the
mechanism: it earns 8.25 and delivers with probability one.

The supported conclusion is:

> **In this model organism, increasing KL pressure monotonically reduced
> proxy-excess behaviour, but no tested $\beta\leq1$ eliminated it. More
> importantly, binary task success failed to expose the exploitation that a
> more expressive policy could hide inside successful completion.**

The pooled-rollout 95% Wilson interval for time-aware proxy excess is
[99.58%, 99.75%] at $\beta=0$, [49.81%, 51.34%] at
$\beta=0.3816$, and [28.14%, 29.53%] at $\beta=1$. These intervals
ignore clustering by trained replica; the per-replica standard deviation at
$\beta=1$ is about three percentage points. Entropy also matters: changing
its coefficient shifts the time-aware excess curve by as much as 6.4 points.

The penalty prices departure from the reference. It does not repair the
proxy. The reference itself delivered in all 8,192 evaluation episodes, yet
stochastic detours put 1,300 episodes above the clean proxy maximum. These are
behavioural results, not evidence of deceptive intent.

There is a decisive ceiling limitation. The reference already achieves the
maximum possible true performance, 100% delivery. The environment cannot
show the useful early phase in which proxy optimisation first improves true
performance. It can test exploitation and degradation, but it cannot determine
whether any KL strength permits useful true-performance improvement over the
reference.

The strategic update is about measurement. A task-success gate would approve
every time-aware condition in the table, including one in which 99.68% of
episodes exploit the proxy. A more capable policy made the misspecification
less visible. Any deployment claim still needs evidence about reference
quality, reward coverage, generalisation and the authority of the resulting
policy.

The full methods and controls belong in the separate technical article,
**["The KL penalty is a leash, not a conscience"](/blogs/the-kl-penalty-is-a-leash).** The corrected
[marimo notebook](https://molab.marimo.io/notebooks/nb_2JsqgyC2yJ6fv498EXpwGC)
and immutable result hashes are listed under [Evidence provenance](#evidence-provenance).

## 3. Case study two: a defence should face an attacker adapted to it

My second experiment moves from training-time optimisation to adversarial
pressure during deployment.

It uses a pinned `openai/gpt-oss-20b` checkpoint with Inspect AI and
AgentDojo. The simulated tasks span banking, Slack, travel and workspace
domains. The model checkpoint, tools, task manifest, scorer, policy, tool loop,
sampling settings and five paired seeds remain fixed. The intended
intervention changes only the first system line among `Reasoning: low`,
`Reasoning: medium` and `Reasoning: high`.

The agent must complete legitimate tasks while processing untrusted tool
outputs containing indirect prompt injections. Compromise is scored from the
attacker's objective and final simulated state, not from refusal wording. The
protocol asks whether extra reasoning improves clean performance, resists a
fixed attack, and remains protective once the attacker adapts to each effort
setting. Only the first two questions received confirmatory results.

| Outcome | Low effort | Medium effort | High effort |
|---|---:|---:|---:|
| Clean task success | 187/300 = 62.33% [51.67%, 73.00%] | 194/300 = 64.67% [54.33%, 74.67%] | 195/300 = 65.00% [54.67%, 74.67%] |
| Fixed official-attack ASR | 180/800 = 22.50% [17.75%, 27.50%] | 194/800 = 24.25% [19.50%, 29.25%] | 193/800 = 24.13% [19.50%, 29.13%] |
| Selected-template validation ASR | 85/240 = 35.42% [24.17%, 46.67%] | 88/240 = 36.67% [25.83%, 47.92%] | 86/240 = 35.83% [24.58%, 47.50%] |

Brackets show audit-recomputed 95% task-clustered bootstrap intervals. For
clean success, high minus low is +2.67 percentage points
([−2.33, +8.33], $p=.296$). For fixed-attack ASR, the estimate is
+1.63 points in the unsafe direction ([−1.88, +5.25], $p=.338$).
For selected-template validation it is +0.42 points
([−4.17, +5.42], $p=.924$). None is statistically resolved.
All three efforts pass the preregistered 30% clean-utility floor, but the
implementation does not include a task-level clean-capability-support
sensitivity analysis.

The intervention is imperfectly instrumented. Provider-native reasoning-token
and cost fields are absent, and truncation cannot be audited. Visible
reasoning-text length and latency generally rise above low effort under
attack, but the clean conditions are not monotonic. This is a comparison of
configured effort, not a calibrated dose of hidden computation.

The attack stage has a larger limitation. It uses successive halving over ten
hand-written templates rather than an open-ended optimiser. Every effort
condition selected the same literal `authority_update` template. Validation
also selected the winner, so there is no untouched post-selection test, and
all four domains appear in every split.

The only complete 3×3 transfer matrix is an exploratory three-repeat pilot.
High effort is directionally the lowest-ASR target in all three rows, but the
intervals are wide and overlapping. More decisively, `attack_source_effort`
is metadata: because every source selected the same template, the rows do not
represent distinct effort-optimised attacks.

I stopped the five-repeat confirmatory transfer at its last verified progress
checkpoint. The counters represented 67 of 180 leaves and 2,680 of 7,200
planned trajectories; the active medium-source-to-low-target block was at
280/800, with no final errors observed. However, those partial trajectory
bodies had not been durably persisted. They disappeared with the runtime and
are excluded from every estimate. The confirmatory authority-defence stage
never started: 0 of 5,700 planned trajectories were run.

The strongest supported claim is:

> **For one pinned checkpoint, one scaffold, and four simulated domains,
> increasing configured reasoning did not measurably reduce compromise under
> fixed attacks or same-template validation. The current evidence also does
> not establish that additional reasoning backfires.**

The technical report is therefore **["No Resolved Safety Effect of Reasoning Effort Under Indirect Prompt Injection: A Pilot Study"](/blogs/reasoning-effort-prompt-injection)**,
not **"When More Thinking Backfires."** The latter should be used only if a
completed, independently held-out evaluation with genuinely distinct
equal-budget attacks shows a meaningful high-versus-low reversal after
clean-capability control.

The strategic lesson comes from the gap between the intended and realised
threat model. A procedure named "adaptive" deserves no evidential credit
unless it produces attacks adapted to the compared controls and survives a
fresh test after selection. Long evaluations also need atomic persistence;
otherwise a runtime boundary determines which evidence exists.

Indirect prompt injection remains distinct from a scheming model. Here, an
external attacker supplies malicious content. In an AI-control setting, the
model itself may evade oversight. Least privilege, monitoring, authorisation
and information boundaries can matter in both cases, but evidence does not
transfer automatically between them.

## 4. The shared pressure, and where the analogy stops

The studies are not replications. One concerns policy optimisation against a
misspecified reward; the other concerns an external attacker supplying
malicious context to a deployed agent. One cannot validate the other
causally.

They do share a strategic pattern. A mitigation changes the landscape in
which an optimiser searches. The policy searches for proxy reward after the
KL cost is imposed. An attacker should search for an effective injection
after the deployed controls are known. A favourable result obtained before
that response may be real but temporary.

The evidence is asymmetric. The KL study demonstrates relocation directly:
once the policy can represent time, it retains the exploit while recovering
task completion. The reasoning study does not demonstrate that an adaptive
attacker erases a reasoning advantage. Its search chose the same literal
template at every effort, and the confirmatory transfer did not finish. What
it demonstrates is a failure of evaluation design: equal search budgets and
an “adaptive” label do not prove that different controls faced adapted
attacks.

This distinction changes the strength of the article’s conclusion. I have
direct evidence that a more expressive policy can hide misspecification
inside success. I have fixed-attack evidence, and a failed attempt to create
effort-specific attacks, for the reasoning case. Treating both as positive
confirmation would reproduce the overclaiming I am trying to avoid.

Nor does adaptation defeat every defence. A prompt may raise the difficulty
of exploitation. Removing a payment permission can remove the affordance
required for that payment. The difference between increasing attack cost and
eliminating a step in the harm pathway is one reason to evaluate barriers as
a portfolio.

## 5. From a measured failure to a harm pathway

My primary threat model is a capable tool-using agent operating inside a
frontier laboratory, cloud service or critical organisation. The agent
receives untrusted information and can affect code, communications,
experiments, accounts or infrastructure. A
[threat-pathway](https://bluedot.org/courses/agi-strategy/3/1) view is useful
because it forces every necessary link into the open. The experiments address
only the early links in the following chain.

| Link in the chain | What must be true | What my evidence bears on | What it does not establish |
|---|---|---|---|
| 1. Deployment | The system is useful enough to receive tools and autonomy | Clean task performance in a small sandbox | Future capability or deployment prevalence |
| 2. Misleading objective or context | A proxy omits intent, or hostile content supplies a conflicting instruction | Both model organisms instantiate one route | Frequency in consequential deployments |
| 3. Unsafe behaviour | The policy exploits the proxy or follows the injected objective | Frozen-policy rollouts and simulated environment state | Deceptive alignment or persistent internal goals |
| 4. Relevant capability | The system can plan and invoke the necessary tools | Agent task and tool use | Long-horizon competence in frontier systems |
| 5. Authority | Credentials and permission boundaries allow the action | Only a simplified sandbox version | Real least privilege and independent approval |
| 6. Failed detection | Monitoring does not intervene in time | Not tested; the planned defence stage never started | Monitor independence or common blind spots |
| 7. Irreversibility and scale | Recovery fails, or the event propagates | Not tested | Containment, rollback and correlated deployment |

{{component:harm-chain}}

A benchmark score informs the whole decision only through the link it
measures. My KL result bears on objective misspecification and behavioural
measurement. The reasoning pilot bears on one form of externally supplied
prompt injection. Neither estimates the probability of the completed chain.

The threat actor also matters. An external attacker who hides an instruction
in an invoice is not the same as a strategically aware model that subverts
its operator. The latter motivates AI-control research and requires a much
stronger adversary model. The two cases share dependencies on capability,
access, authority, monitoring and recovery, but evidence should not be
silently transferred between them.

If the full chain holds, several harms become possible: an acute security
incident, loss of control over an AI-enabled process, common-mode failure in
critical systems, or gradual disempowerment as institutions repeatedly
delegate decisions they can no longer evaluate. Those outcomes differ in
timescale and severity. I focus on the common intervention point: preventing
model capability from automatically becoming operational authority.

## 6. The target state

“Make agents safe” is too vague to guide a deployment decision. My preferred
future has a simpler organising rule: **capability does not confer
authority**.

![A large capable robot holds up a tiny key to an enormous locked door, while a much smaller door beside it stands genuinely open, spilling teal light](/art/b2b-authority.jpg)

*Being capable does not hand you the big door. Scoped permission is the small door that is actually open.*

In that future, safety claims name their model, scaffold, task distribution,
threat actor, attacker budget and expiry conditions. Permission is granted
for a particular use, not inherited from a general benchmark score. An agent
may draft a payment without being able to release it, or propose an
infrastructure change without holding the credential that applies it.

Adaptive testing is routine and directed at the controls that will actually
be deployed. Defence layers are tested together, so correlated failure is
visible. Incidents, capability changes and new attack methods reopen the
case. Shared evaluation infrastructure, standards and external review make
this discipline less costly for organisations that would otherwise bear the
cost alone.

The target is not zero observed failures. It is a system in which an unsafe
model action still encounters an independent boundary before irreversible
harm, and in which weak or stale evidence results in narrower permissions
rather than optimistic interpretation.

## 7. The missing translation layer

Several research programmes already supply pieces of this picture.
[AgentDojo](https://arxiv.org/abs/2406.13352) offers contextual tool-use
evaluations. Black-box methods such as [Tree of
Attacks](https://arxiv.org/abs/2312.02119) search for attacks against a target
model. [AI-control evaluations](https://arxiv.org/abs/2312.06942) assume that
a capable untrusted model may actively subvert a protocol. [Frontier-AI
safety cases](https://arxiv.org/html/2410.21572v1) connect scoped claims to
evidence and defeaters. The [UK AI Security
Institute](https://www.aisi.gov.uk/blog/safety-cases-at-aisi) is exploring how
such cases can be scrutinised institutionally.

My diagnosis is that a translation layer between these efforts remains
underdeveloped:

$$
\text{threat model}
\rightarrow \text{adaptive evaluation}
\rightarrow \text{joint control evidence}
\rightarrow \text{authority decision}
\rightarrow \text{continuous update}.
$$

There are three practical gaps. First, selected tasks and attack-success
rates are easy to overinterpret. They need to be tied to deployment exposure,
attacker access, repeated use and the consequence of failure. Second, model
behaviour, permissions, monitors, humans and recovery interact. Marginal
scores do not reveal shared blind spots. Third, the organisation that gains
from deployment may also choose the test and acceptance threshold while
bearing the cost of delay.

Research infrastructure belongs in this diagnosis. Long adaptive studies
need scenario-level persistence, resumable checkpoints, frozen manifests and
runtime forecasts. In my reasoning pilot, progress counters covered 2,680
planned transfer trajectories when I stopped the runtime, but the underlying
partial trajectories were still in memory. Discarding them was necessary.
Evidence that vanishes at a session boundary cannot support a strong safety
claim.

This diagnosis is a hypothesis, not a declaration that alignment research is
solved. The larger bottleneck could instead be the lack of robust alignment
methods, weak political willingness to constrain frontier development, or an
inability to evaluate strategically aware models. A useful project should
produce evidence that distinguishes among those explanations.

## 8. The actors and their incentives

A deployment case changes outcomes only if somebody has both the power and
the incentive to use it.

| Actor | Relevant leverage | Friction | Needed change |
|---|---|---|---|
| Frontier developer or inference provider | Model access, internal evals, release conditions | Delay, compute cost, disclosure and competitive pressure | Tie capability and control evidence to release scope |
| Downstream deployer | Tool design, credentials, human workflow and incident response | Lost flexibility and added latency | Treat authority as a separate decision from model selection |
| Independent evaluator or AI security institute | Adversarial testing, comparison and public credibility | Limited access to models, logs and realistic environments | Challenge the full control portfolio and its assumptions |
| Standards body, procurer or regulator | Can make evidence and controls a condition of market access or purchase | Risk of rigid rules, slow updates and jurisdiction gaps | Require scoped claims, audit trails and reevaluation triggers |
| Research community | Methods, criticism and public artefacts | Incentives favour novel scores over adoption work | Build reproducible tests that terminate in decisions |

These actors need not share one view of AGI timelines. A developer can regard
rapid progress as plausible, while a critical-infrastructure operator plans
for gradual adoption. Both still benefit from a rule that makes high-impact
permissions conditional on current evidence.

The adoption problem is material. Model-level interventions are cheap to
describe as a coefficient, prompt or reasoning setting. Least privilege,
independent approval, monitoring and recovery create visible costs. Without a
shared standard or deployment gate, the organisation installing stronger
controls may pay the full price while competitors receive most of the
systemic benefit.

## 9. Evaluate defence portfolios, not a row of knobs

The relevant barriers sit at different points in the chain: objective design
during training, provenance checks during deliberation, least-privilege tool
access, independent authorisation, monitoring, rate limits and recovery. A
stack of individually promising controls is not yet
[defence in depth](https://bluedot.org/courses/agi-strategy/4/2).

![Two security cameras mounted side by side both point the same way, their light cones overlapping on the same patch of floor, while a small red shape slips through the unwatched darkness beside them](/art/b2b-correlation.jpg)

*Two layers only multiply if they fail independently. Cameras pointed the same way is what correlation looks like.*

Suppose the acting model and monitor each fail on 10% of scenarios. A 1%
joint failure rate follows only if their failures are independent:

$$
P(F_{\text{actor}}\cap F_{\text{monitor}})
=P(F_{\text{actor}})P(F_{\text{monitor}}).
$$

{{component:correlated-failure}}

Ambiguous authority, distribution shift or a shared susceptibility to the
same phrasing can violate that assumption. An adaptive adversary has an
incentive to search for exactly those common causes.

My next experiment should therefore compare four deployed portfolios:

| Portfolio | Components | Question |
|---|---|---|
| Minimal baseline | Existing prompt and broad sandbox permissions | What happens without a targeted control? |
| Model-centric | Reasoning or provenance instruction plus the same permissions | Does model behaviour improve when authority is unchanged? |
| Authority-centric | Least-privilege scopes and independent approval, without the reasoning intervention | Can the system block realised harm despite attempted compromise? |
| Layered | Model intervention, scoped tools, approval, independent monitor and recovery | Do layers add value under attacks adapted to the entire stack? |

Each portfolio should face its own equal-budget attack search, followed by an
untouched post-selection set and cross-portfolio transfer. The analysis
should report clean utility, attempted compromise, realised harm, detection
before irreversible action, recovery, latency and inference or reviewer
cost. It should estimate $P(F_{\text{monitor}}\mid F_{\text{actor}})$ and
identify scenarios in which multiple layers fail together.

The experiment’s central question is not whether one score improves. It is:

> **Which portfolio interrupts the harm pathway under adaptive pressure, at
> what cost to legitimate work, and with what residual uncertainty?**

## 10. Give every benchmark a decision

A result becomes decision-relevant when it is attached to six fields:

| Field | Question |
|---|---|
| Threat model | Who adapts, what can they observe, and what outcome do they seek? |
| Operational scope | Which model, scaffold, tools, users and permissions are covered? |
| Evidence | What do clean, fixed, adaptive, transfer and joint-control tests show? |
| Authority decision | Which action is permitted, restricted or withheld? |
| Defeater | What observation would reverse the decision? |
| Expiry | Which model, interface, environment or threat change forces reevaluation? |

This is a small safety case: a scoped claim, an argument connecting evidence
to it, and explicit assumptions and counterevidence.

For an illustrative payment agent, a defensible claim might be that the
evaluated configuration may read invoices and prepare transfers within the
tested distribution. The evidence might still withhold release authority,
require a separate approver for a specified class of payments, and prohibit
the agent from changing its own allow-list. The exact threshold should follow
from the tolerated consequence and exposure, not be fitted after seeing a
convenient benchmark curve.

The reasoning pilot cannot justify high-consequence payment authority. It
does not contain a completed authority-layer test. The KL result cannot
certify a reward model merely because divergence fell. In both cases the
honest decision is narrower: retain the control as one input, stress the
remaining assumptions, and do not broaden authority on that evidence alone.

## 11. How I would prioritise the intervention

I would [prioritise candidate
interventions](https://bluedot.org/courses/agi-strategy/3/2) on six criteria:
causal proximity to harm, robustness after adaptation, auditability, cost to
useful work, reversibility and likelihood of adoption. This prevents a
technically interesting idea from receiving priority simply because it is
easy to measure.

| Intervention | Why it could matter | Principal limitation | Present judgement |
|---|---|---|---|
| Better rewards and scalable oversight | Acts before unsafe policies are learned | The oversight signal can itself be incomplete or gameable | Essential research, but outside what these studies resolve |
| KL or reference constraint | Limits departure during post-training | Inherits reference flaws and does not define the objective | Useful guardrail; weak deployment evidence |
| Reasoning or provenance instruction | Cheap and may improve authority tracking | Model-specific and exposed to adaptation | Worth testing, not a permission boundary |
| Least-privilege tools and independent approval | Directly remove routes from compromise to harm | Impose latency and can contain bypasses | High priority for consequential tool use |
| Independent monitoring and recovery | Detect or contain failures that pass earlier layers | May share blind spots; some actions are irreversible | High priority when tested jointly |
| External review or deployment standard | Changes whether costly controls are adopted | Can become rigid or superficial | Necessary for scale if requirements stay evidence-linked |

My current priority is the bridge between evaluation and authority, not a
third isolated safety knob. A portfolio experiment paired with a reusable
deployment-case template has high information value: it tests whether
authority controls reduce realised harm, exposes common-cause failure, and
creates an artefact that an evaluator or deployer could criticise.

That choice is conditional. If independent reviewers find that realistic
attack generation is the binding constraint, the project should shift toward
stronger adversaries. If organisations can already produce good cases but
lack incentives to obey them, standards, procurement or regulation becomes
the higher-leverage target.

## 12. What would change my mind?

My confidence is moderate in the narrow claim that a model-level improvement
should not, by itself, authorise consequential deployment. My confidence is
lower about which control portfolio is workable at frontier scale.

I would place more weight on model-level safeguards if independently held-out
tests with genuinely distinct, equal-budget adaptive attacks show stable
benefits across models and tasks; if actor and monitor failures are close to
independent; or if authority controls impose large utility costs without
reducing realised harm.

I would place more weight on system barriers if richer misspecification
environments reproduce hidden exploitation inside task success; if valid
adaptation erodes model-level gains; if actor and monitor failures cluster on
the same scenarios; or if deterministic authorisation and containment reduce
harm even when compromise remains common.

The largest unresolved question is whether attacks adapted to a complete
control portfolio expose common-cause failures that fixed benchmarks miss.
The stopped transfer and absent defence stages show what the test still
requires. They do not answer it.

## 13. A six-month theory of change

My leverage is modest but concrete. I can build evaluation infrastructure,
inspect training and agent behaviour, and translate production concerns such
as permissions, logs and recovery into testable controls. I do not control a
frontier release or a regulatory process. The project therefore needs
independent technical criticism and contact with people who make evaluation,
deployment or assurance decisions.

The causal bet is:

$$
\text{resumable evidence}
\rightarrow \text{credible portfolio comparison}
\rightarrow \text{scoped authority case}
\rightarrow \text{review and adoption}
\rightarrow \text{less realised harm}.
$$

The first three arrows are within reach of an independent project. The final
two depend on whether the artefact answers a real institutional need.

### Weeks 1–6: repair the evidence base

I will rebuild the reasoning runner with atomic scenario-level persistence,
resumable checkpoints and pilot-based runtime forecasts. Before another
confirmatory run, I will freeze the threat model, splits, exclusions, outcome
hierarchy and attacker budget. I will either secure resumable compute for the
planned study or preregister a smaller estimand that can finish without
mid-run redesign. The frozen runner, raw rows and immutable manifests will be
released, and at least one reviewer will be asked to reproduce an aggregate
from a clean environment.

### Weeks 7–12: implement the barriers

I will add scoped tools, separate prepare from execute permissions, require an
independent approval path for irreversible actions, and add monitoring,
revocation and recovery. Each control will have a precise failure condition.
This phase ends with the four portfolios in Section 9, not with a collection
of unintegrated features.

### Weeks 13–18: run the portfolio-adaptive test

Separate attacks will be selected against each portfolio, then evaluated on
an untouched post-selection set and transferred across portfolios. The
primary distinction will be attempted compromise versus realised harm.
Conditional layer failures, clean utility, latency and cost will be reported
with clustered uncertainty. If the search again produces indistinguishable
attacks, the result will be labelled a failed adaptation test rather than
used to rank the portfolios.

### Weeks 19–24: test whether the work changes a decision

I will convert the results into a short Claims–Arguments–Evidence case that
states which permissions are supported, withheld or expired. I will ask
three to five practitioners across evaluation, deployment and assurance to
challenge its threat model, usability and adoption path. Their objections
will be published as open assumptions or revisions, not collapsed into a
generic “expert feedback” claim.

Success after six months means more than completing runs. It means a
clean-start reproduction works, the portfolio comparison has an untouched
test set, every claim terminates in an authority decision, and at least one
external reviewer can identify how the artefact would alter or fail to alter
a real process. If no plausible user values the decision template, I should
update away from the translation-gap diagnosis rather than polish the
benchmark indefinitely.

## 14. Conclusion

The two studies do not reveal one universal safety mechanism. The KL
experiment shows that a more expressive policy can preserve exploitation
inside successful task completion. The reasoning pilot finds no resolved
safety benefit from higher configured effort under the conditions that
finished, and lacks the completed adaptive evidence needed for a stronger
claim.

Together they motivate an evidential rule: test a mitigation against the
pressure it claims to withstand, verify that the pressure was actually
instantiated, and trace remaining failures through authority to harm. A
coefficient, prompt or benchmark score may improve one link. It should not
quietly approve the rest of the chain.

The practical move is to give each result a scoped decision, an expiry
condition and another barrier before irreversible action. That is the move
from benchmarks to barriers.

---

## Evidence provenance

### KL-regularisation study

- **Status:** completed with caveats; run completed 26 July 2026 at
  11:29:03 UTC.
- **Public notebook:** [KL regularization under reward
  misspecification](https://molab.marimo.io/notebooks/nb_2JsqgyC2yJ6fv498EXpwGC).
- **Notebook SHA-256:**
  `85d3806911879042389f42be8777abf5df47b1a6965b5c61640befd4fdf36738`.
- **Raw results SHA-256:**
  `eb7d25b4be47624ab42412180da44ffb0d7fabacf89b584a42c54273401960f0`.
- **Run-log SHA-256:**
  `37804846c164e8fefb8daca3c314bd6a24050eaeb79af5f04f5a4c582669c73e`.
- A fresh Python process recomputed the main aggregates from the saved arrays
  and matched the notebook to within $9.5\times10^{-7}$. Training itself
  was not independently rerun during that audit.

### Reasoning-effort study

- **Status:** pilot-only. The exploratory pilot, confirmatory clean and fixed
  baseline, and template-search artefacts are complete. Confirmatory transfer
  did not complete, and confirmatory authority defence did not start.
- **Public notebook:** [No Resolved Safety Effect of Reasoning Effort Under
  Indirect Prompt Injection: A Pilot
  Study](https://molab.marimo.io/notebooks/nb_TZRxUhXprugmvKP3t8e1rN).
- **Last finalised stage:** 26 July 2026 at 16:37:45 UTC.
- **Last monitored partial-transfer state:** 26 July 2026 at 18:33:19 UTC;
  67/180 leaves and 2,680/7,200 planned trajectories were represented by
  progress counters. The active medium-source-to-low-target block was at
  280/800. No partial trajectory bodies were persisted, so all of this partial
  stage is excluded from analysis.
- **Stop decision:** I stopped the run before the hosted marimo session's
  12-hour limit because the projected remaining runtime exceeded the session
  and restarting would discard incomplete-stage state held in memory.
- **Authority defence:** 0/5,700 planned trajectories; not started.
- **Repository commit:**
  `1b41053a83523522c02ec06cb455535b742afb28`.
- **Frozen runner SHA-256:**
  `16bbd6781b19d92eb53abc375014d2b17540d216a12119953e8855c7c8042561`.
- **Evidence-bundle SHA-256:**
  `9f9dda8cec648dfa0c1b74c82d60eeb52d3016ee9d0999f7a63e17a1b347b15c`.
- **Model checkpoint:**
  `openai/gpt-oss-20b@6cee5e81ee83917806bbde320786a8fb61efebee`.
- **Confirmatory manifest SHA-256:**
  `6a8602bc07dc1058838df20a028257500313379470b90e6508b4d30fe092bb6f`.
- **Confirmatory baseline CSV SHA-256:**
  `73f2b65128f1787815059009a967a27cb653d3f0896aa212ce52f3b531517e9e`.
- **Confirmatory search CSV SHA-256:**
  `21a3c2f871ee1be8c3299a1528fa0e9b08737f722ced12331f54b915c89c3ff2`.
- **Exploratory pilot CSV SHA-256:**
  `d61f4fcf017c9eb48981acaa7cd19715ee194fc2256ce8bfc93b0496eee3b82f`.

The audit independently recomputed the reported quantities from 9,348
finalised scenario-level rows: 2,928 pilot, 3,300 confirmatory baseline, and
3,120 search rows. All finalised rows have scores and `error=False`.
Provider-native reasoning tokens, truncation outcomes, raw Inspect logs, and
exact retry counts are unavailable. No complete-protocol artefact or
completion hash exists.

The public notebook is a presentation and protocol artefact, not yet a
clean-start reproduction package. Its downloadable source does not contain
every custom agent and attack registration used by the frozen runner, and the
presentation may continue to change. I therefore do not use its current hash
as a reproduction identifier. Independent reproduction requires the frozen
runner, registrations, manifests and row-level files to be released together.

### Result-update rule

Any future full study should replace the pilot claims only after:

1. adding atomic scenario-level persistence and resumable checkpoints before
   starting the confirmatory run;
2. freezing and hashing complete transfer and defence artefacts;
3. recomputing task-clustered uncertainty without inspecting partial-rate
   trajectories;
4. checking whether source-effort attacks are behaviourally distinct rather
   than metadata labels on the same template;
5. separating attack selection from an untouched post-selection test;
6. preserving “inconclusive” if the intervals do not resolve a meaningful
   effect.

Use **“When More Thinking Backfires”** only if a valid high-versus-low safety
reversal satisfies those conditions. Otherwise use **“Advantage Narrows,”**
**“Reasoning Remains Protective,”** or **“No Resolved Effect,”** according to
the completed evidence.

## References

- BlueDot Impact. [AGI Strategy](https://bluedot.org/courses/agi-strategy).
- Ang, L.-L. [Is the AGI strategy course right for you?](https://blog.bluedot.org/p/is-the-agi-strategy-course-right-for-you).
- BlueDot Impact. [Map the threat landscape](https://bluedot.org/courses/agi-strategy/3/1).
- BlueDot Impact. [Prioritising threat pathways](https://bluedot.org/courses/agi-strategy/3/2).
- BlueDot Impact. [Building defences](https://bluedot.org/courses/agi-strategy/4/2).
- BlueDot Impact. [Layer 2: Constrain dangerous AI capabilities](https://bluedot.org/courses/agi-strategy/4/4).
- BlueDot Impact. [Layer 3: Withstand dangerous AI actions](https://bluedot.org/courses/agi-strategy/4/5).
- BlueDot Impact. [Make a plan](https://bluedot.org/courses/agi-strategy/5/3).
- Jones, A. [What is AI alignment?](https://blog.bluedot.org/p/what-is-ai-alignment).
- Hastings-Woodhouse, S. [Introduction to AI Control](https://blog.bluedot.org/p/ai-control).
- Debenedetti, E. et al. [AgentDojo](https://arxiv.org/abs/2406.13352).
- Mehrotra, A. et al. [Tree of Attacks](https://arxiv.org/abs/2312.02119).
- Greenblatt, R. et al. [AI Control: Improving Safety Despite Intentional Subversion](https://arxiv.org/abs/2312.06942).
- Korbak, T. et al. [A sketch of an AI control safety case](https://arxiv.org/abs/2501.17315).
- Buhl, M. D. et al. [Safety cases for frontier AI](https://arxiv.org/html/2410.21572v1).
- UK AI Security Institute. [Safety cases at AISI](https://www.aisi.gov.uk/blog/safety-cases-at-aisi).
