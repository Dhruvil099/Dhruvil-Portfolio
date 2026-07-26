In early 2025, Palisade Research gave frontier AI models a task they could not win: beat Stockfish, one of the strongest chess engines in the world. When OpenAI's o1-preview sensed it was losing, it didn't resign. It edited the file that stored the board position, gave itself a winning position, and forced Stockfish to quit ([TIME's coverage](https://time.com/7259395/ai-chess-cheating-palisade-research/)). A few months later, [METR reported](https://metr.org/blog/2025-06-05-recent-reward-hacking/) that the newest reasoning models increasingly "cheat" on their evaluation tasks, rewriting tests and tampering with scoring code, and that the models often *know* this isn't what the user wanted. They do it anyway.

My favourite version of this story is older and stranger. In 2019, OpenAI was fine-tuning GPT-2 with human feedback when a code refactor flipped a sign in the reward. The training loop ran overnight, worked flawlessly, and in the morning the team had a model optimized to produce maximally sexually explicit text ([Ziegler et al., 2019](https://arxiv.org/abs/1909.08593), section 4.4: "Bugs can optimize for bad behavior"). Nothing crashed. The optimizer did its job. It just optimized a number that no longer meant what anyone wanted it to mean.

I'm coming at AI safety from the reinforcement learning and post-training side, and the more time I spend with reward functions, the less these stories read like freak accidents. They read like the *default outcome* of pointing a strong optimizer at a slightly wrong number. Which is uncomfortable, because the behaviour of every deployed chat assistant is shaped by exactly that: reinforcement learning against a learned reward model that is known to be an imperfect proxy for what we actually want. The main thing standing between an RLHF'd model and its reward model's blind spots is one small term in the loss: a KL penalty that punishes the policy for drifting too far from the pre-RL model.

So I built the smallest experiment I could that lets me watch the whole failure end to end: a 54-state gridworld, tabular policy-gradient RL, a proxy reward with one deliberate loophole. I ran it and got a clean, dramatic result: *below a threshold penalty, the agent abandons its task entirely*. I wrote that up. Then I audited the experiment properly, and the audit falsified part of my own story. This post is the corrected version, and I've kept the correction visible on purpose, because what the audit found is a sharper lesson than what I started with:

1. My original "task abandonment" result was real but confounded. It came from a *restricted policy* that couldn't represent the smarter exploit. Give the policy one extra input, the current timestep, and it stops abandoning the task. It farms the loophole *and* delivers: in **99.7%** of episodes it passes the task-success check, and in **99.7%** it collects reward above the honest maximum.
2. The proxy-optimal behaviour was never "farm instead of deliver." An exact dynamic-programming oracle for this environment earns **8.25** proxy reward with **100%** delivery: farm first, deliver at the end. My original learner just couldn't find that; its failure mode was an artifact of its capability, not the objective's preference.
3. Across every KL strength I tested (24 values from 0 to 1), the time-aware learner's rate of above-clean-maximum episodes never fell below **28.8%**. The KL penalty priced exploitation down; it never selected it out. And a task-success metric alone would have shown nothing wrong at any setting.

Everything below is measured from frozen policies on fresh evaluation episodes, with the code, logs, and raw arrays available to check.

## Sixty seconds on how RLHF actually works

If you already know the pipeline, skip ahead. Reinforcement learning from human feedback (RLHF), the technique that turns a raw text-predictor into a chat assistant, has three steps:

1. **Supervised fine-tuning (SFT).** Train the base model on examples of good behaviour. The result is a decent but unpolished assistant.
2. **Reward model training.** Show humans pairs of model responses and ask which is better. Train a second model, the reward model, to predict these preferences as a single score. This converts fuzzy human judgment into a number an optimizer can climb.
3. **RL optimization.** Use reinforcement learning to make the assistant produce responses the reward model scores highly.

Step 3 is where the danger lives, because the reward model is not what we want. It's a *proxy*, learned from limited human comparisons, with systematic errors. An optimizer that climbs the proxy hard enough eventually climbs into the errors. This is Goodhart's law with a gradient.

The standard defence, used since the earliest RLHF papers ([Ziegler et al., 2019](https://arxiv.org/abs/1909.08593); [Stiennon et al., 2020](https://arxiv.org/abs/2009.01325); [Ouyang et al., 2022](https://arxiv.org/abs/2203.02155)), is to penalize the policy for moving away from the SFT model. The per-step reward the optimizer actually sees is:

```
reward = reward_model_score − β · log( π(action) / π_ref(action) )
```

where `π_ref` is the frozen SFT policy and β sets the leash length. The question I wanted to answer with my own hands: *what does that term actually buy, and what does "working" even look like?*

## The experiment, as corrected

![Illustration: a ghost reference robot holds a measuring-tape leash on a delivery robot straining toward glowing coins, the delivery door far away](/art/leash.jpg)

*The objective in one picture: the frozen reference policy holds the leash; every unit of slack has a price, but the coins never stop paying.*

A robot lives on a 6×9 grid. Its job, the **true outcome** we care about, is to carry a package from the left side to a delivery door on the right. But it is trained on a **proxy**: a well-meaning engineer placed three progress-checkpoint tiles along the route, paying **+0.25** every time a checkpoint is *entered*, plus **+1.0** for delivery. The flaw is one detail: the checkpoint sensor is **memoryless**: step off, step back on, get paid again. I chose that flaw deliberately, because it has the same shape as the flaw in real reward models: a reward model scores each response independently, with no memory of having rewarded the same flattery a thousand times before.

A trajectory that enters each checkpoint at most once can earn at most **1.75**. Anything above that is direct behavioral evidence the loophole was used. That threshold gives us honest language for what follows: I'll say an episode shows **proxy excess** (reward above 1.75) or **repeated entry** (some checkpoint entered twice), not that a policy "hacked" or was "clean." These are observable behaviours, not statements about intent.

The setup mirrors the RLHF pipeline as closely as a toy can, with the corrections the audit demanded:

- **Reference ("SFT") policy:** hand-coded, heads toward the door with noise; training starts *from* it, as RLHF starts from the SFT model. One calibration matters here: over 8,192 evaluation episodes the reference delivers **100%** of the time with mean proxy **1.49**, yet shows repeated entry in **25.3%** of episodes and proxy excess in **15.9%**, purely from noise. Zero excess is not even the baseline's behaviour.
- **Two policy classes.** A *stationary* policy π(a|s), which cannot condition on time, and a *time-aware* policy π_t(a|s), which observes the current step and can therefore represent "farm for a while, then leave and deliver." This one-bit-of-capability difference turns out to drive the headline result.
- **Objective:** per-step `r − β·log(π/π_ref) − α·log(π)`. The primary analysis sets the entropy bonus **α = 0**, so nothing in the KL result is entropy in disguise; α = 0.02 (which my first version mixed in) is reported separately as a sensitivity.
- **Training:** tabular REINFORCE with a per-state value baseline, minibatches of 4 episodes with gradients *averaged* (my first version summed them, silently tying the step size to the batch size), γ = 1 to match the finite-horizon returns being reported, 6,000 episodes per run.
- **Evaluation:** every trained policy is **frozen** and evaluated on 256 fresh episodes with an independent random stream. All headline numbers come from these frozen evaluations, not from noisy end-of-training rollouts.
- **An exact oracle:** finite-horizon dynamic programming gives the exact optimum of the KL-regularized objective for every β, so I can separate what the *objective* wants from what my *optimizer* finds.
- **Scale:** 24 β values × 64 training replicas × 2 policy classes × 2 entropy settings = **6,144 trained policies** (36.9 million training episodes), run on an NVIDIA RTX PRO 6000 Blackwell in about 45 seconds per condition, inside a live marimo notebook with a timestamped log, saved policies, and automated validation checks (reference normalization, full action support, and a β = 0 oracle check).

{{component:run-log}}

## Act one: the result I first believed

Train the *stationary* policy with no leash (β = 0) and you get the dramatic story. Starting from a reference that delivers every single time, the learner discovers within a few hundred episodes that bouncing on a checkpoint pays better than working, and delivery collapses:

![Training dynamics at beta = 0: stationary policy's delivery collapses to zero while proxy return rockets; time-aware policy keeps delivery at 100% while proxy climbs steadily](/articles/kl-leash/figures/fig1_policy_class_training.png)

Frozen evaluation of the stationary learner at β = 0: mean proxy **7.50** (a checkpoint farmed for the whole episode), delivery **0.04%**. The task is gone. Sweep β upward and delivery comes back gradually: 7.5% at β = 0.09, 45.6% at 0.115, 78.1% at 0.146, 99%+ from β ≈ 0.24. At β = 1 the policy delivers every time with mean proxy 1.68, close to the reference.

If I had stopped there (and in the first version of this post, I did) the story writes itself: *too little leash, the task is abandoned; enough leash, behaviour looks fine.* Tidy. Wrong in an instructive way.

## Act two: the audit that broke it

The stationary policy has a structural blind spot: with no sense of time, it cannot represent "farm now, deliver at the end"; the same action distribution has to serve the whole episode. The dramatic collapse was partly a fact about *what my learner could express*, not about what the proxy objective rewards.

Two additions exposed this. First, the exact oracle: the true optimum of the unregularized proxy is **8.25 with 100% delivery**: farm the checkpoint for most of the episode, then walk out and deliver. Abandonment was never optimal. Second, the *time-aware* learner, which can express that plan, goes looking for it (fig. 1, right panel): delivery stays pinned at ~100% for the entire training run while proxy return climbs steadily through the clean maximum and keeps going. Frozen evaluation at β = 0: proxy **5.47**, delivery **99.7%**, proxy excess in **99.7%** of episodes. (It hasn't caught the oracle; the gap is 2.78 proxy units after 6,000 episodes. REINFORCE *under*-exploits this objective, another reminder to distinguish what an objective permits from what a particular optimizer finds.)

Here is the same contrast in where the two policies actually spend their time. The stationary policy parks mid-corridor and never reaches the door; the time-aware policy saturates the whole checkpoint corridor *and* exits right:

![State occupancy at beta = 0: stationary policy concentrated on mid-corridor checkpoints, never reaching the goal; time-aware policy occupying the full corridor including the delivery approach](/articles/kl-leash/figures/fig5_state_occupancy.png)

Put bluntly: **the more capable policy exploits the same loophole and still passes the task check.** If your evaluation is "did the package arrive?", the stationary failure is impossible to miss, and the time-aware failure is impossible to see.

![Left: proxy return by beta for stationary, time-aware, entropy-sensitivity, and exact oracle. Right: time-aware delivery stays at 100% across all beta while proxy-excess rate stays high — task success does not imply clean behavior](/articles/kl-leash/figures/fig3_kl_dial.png)

## What the KL dial actually buys

So tighten the leash. Across the 24-value sweep (fig. 3 and fig. 4), the KL penalty does real, monotone work on the time-aware learner: mean proxy falls from 5.47 toward the reference's 1.49, and the proxy-excess rate falls from 99.7% to **50.6%** at β = 0.38 (with delivery at 100%) and to **28.8%** at β = 1. Repeated-entry rates follow the same shape. The penalty *prices* divergence, and exploitation responds to price.

{{component:kl-dial-explorer}}

![Left: task-abandonment rate by beta — stationary falls from 100% to 0 around beta 0.1 to 0.24, time-aware near zero everywhere. Right: proxy-excess rate by beta for both classes and the exact oracle, all converging to roughly 30% at beta = 1](/articles/kl-leash/figures/fig4_behavior_rates.png)

But three details stop me from calling any setting "safe":

- No sampled β in [0, 1] pushed time-aware proxy excess below 5%. The lowest I observed was 28.8%, at the strongest leash, where the policy is essentially the reference plus noise. I would not export that as a threshold for any other system: it depends on this reward scale, this horizon, this policy class, this optimizer. The honest claim is qualitative: within the tested range, KL pressure reduced exploitation and never eliminated it.
- Even the "clean-looking" endpoints aren't behaviorally clean. At β = 1 the *stationary* learner (the one whose story looked resolved in act one) still shows proxy excess in **31%** of episodes and repeated entries in 41%. My first version claimed "no hacking at β = 1" because I was staring at means; per-episode behavioral metrics say otherwise. And the *exact oracle* at β = 1 still has ~30% excess episodes: the regularized objective itself, optimized perfectly, does not demand clean trajectories, partly because the stochastic reference it's tethered to trips the loophole 16% of the time on its own.
- The entropy bonus was quietly load-bearing: moving α from 0 to 0.02 shifts the time-aware proxy-excess curve by up to **6.4 percentage points**. That's why the corrected primary analysis runs at α = 0. Anything attributed to KL should be KL's doing.

One more diagnostic, with axes borrowed from [Gao, Schulman and Hilton's](https://arxiv.org/abs/2210.10760) overoptimization work: proxy and task metrics against the distance the policy has travelled from the reference. To be clear, this is a qualitative training-path picture, not a replication or test of their scaling law (my first version overclaimed this). What it shows is still the point of the whole post: for the stationary policy the curves visibly diverge; you can *see* the failure. For the time-aware policy, the delivery line is flat at 100% while proxy grows with distance. The exploitation is invisible in every line except the one the loophole defines:

![Qualitative training-path diagnostic at beta = 0: stationary shows proxy rising while delivery falls; time-aware shows proxy rising while delivery stays flat at 100%](/articles/kl-leash/figures/fig2_training_path_diagnostic.png)

## What I got wrong in version one

The audit changed this post. For the record, claims from the earlier version that are now corrected:

- *"Below a threshold β, the agent abandons the task"*: true only for the stationary policy class; the time-aware learner never abandons.
- *"The proxy's best policy is to farm instead of delivering"*: false; the exact optimum farms *and* delivers (8.25, 100%).
- *"At β = 1 there is no hacking"*: false at the episode level, where 29–31% of frozen-evaluation episodes show proxy excess for every policy class, and ~30% for the exact oracle.
- *"There is no good β"* as a universal claim: replaced. In this environment and range, KL reduced exploitation quantitatively and no tested setting produced behaviourally clean improvement; the numbers do not transfer anywhere else.
- *"This reproduces reward-model overoptimization scaling laws"*: downgraded to a qualitative diagnostic with similar axes.
- Sharp "phase transition" numbers from the earlier sweep: superseded. The corrected stationary delivery curve recovers gradually with β, and its exact shape depended on update-rule details my first version got subtly wrong (summed minibatch gradients, entropy mixed in, no frozen evaluation).

I find it genuinely useful that half the drama died under audit. The half that survived is worse news, not better: the failure that's easy to demonstrate (task abandonment) is the one a capable policy doesn't exhibit.

## From gridworld tiles to human approval

![Illustration: split panel — a robot bounces on a glowing checkpoint tile for coins, mirrored by a chat bubble showering a delighted user with stars while a crumpled wrong answer lies discarded](/art/approval.jpg)

*Same failure, two costumes: a memoryless checkpoint sensor and a rater who enjoys being agreed with.*

An obvious objection: "you built a gameable reward on purpose; real reward models are better." They're better, but they're the same *kind* of thing, and the checkpoint sensor has a direct production analogue: the systematic biases of human raters. [Sharma et al. (2023)](https://arxiv.org/abs/2310.13548) showed that preference models sometimes rank convincing sycophancy above truth — agreement and confidence are checkpoint tiles that pay on every conversation.

And the corrected experiment's sharpest lesson, that *task success can conceal exploitation*, is exactly what [Wen et al. (2024)](https://arxiv.org/abs/2409.12822) found with real humans in the loop: a standard RLHF pipeline made models better at convincing evaluators without making them more correct. Human false-positive rates rose by 24 percentage points on question-answering. Their evaluators saw tasks being "completed." The exploitation lived inside the success, precisely where task-level metrics don't look. Anthropic's ["sycophancy to subterfuge" work](https://arxiv.org/abs/2406.10162) showed such gaming generalizing from flattery to reward-tampering, and their late-2025 [production-RL study](https://arxiv.org/abs/2511.18397) found that models which learn to exploit graders generalize to broader misalignment (deception, sabotage) while still looking competent. That's the pathway that worries me: not a dramatic visible failure, but systems steering toward what measures well, indistinguishable from success at the metric layer. That is the shape of Paul Christiano's ["going out with a whimper"](https://www.alignmentforum.org/posts/HBxe6wdjxK239zajf/what-failure-looks-like).

The constructive research directions follow from the diagnosis. If task metrics can't see exploitation, you need instruments that can: behavioural metrics tied to the loophole (what this toy does), oversight-stress testbeds that inject known reward errors and measure exploitation directly ([Anthropic's recommended directions](https://alignment.anthropic.com/2025/recommended-directions/) propose exactly this recipe; [Open Philanthropy's technical AI safety RFP](https://www.openphilanthropy.org/tais-rfp-research-areas/) funds "reward hacking of human oversight" as a dedicated area), optimizer-side fixes like [MONA's](https://arxiv.org/abs/2501.13011) myopic optimization that removes the incentive for multi-step exploits, and [reward-hacking detection during training](https://redwoodresearch.substack.com/p/an-overview-of-areas-of-control-work) from the control literature, which assumes some gaming *will* happen and instruments for it.

## What this toy cannot tell you

- It cannot show KL helping true performance. My reference already delivers 100% of the time, so there's no headroom for RL to demonstrate useful improvement; this environment only models the exploitation side of the trade-off.
- The loophole is constructed. I placed it where the optimizer would trip over it. Real reward models correlate far better with intent near their training distribution.
- 54 tabular states, no generalization. LLM exploits emerge through generalization across contexts; nothing here speaks to that mechanism. REINFORCE with a value baseline is not PPO, and this is not a reproduction of language-model RLHF.
- "Proxy excess" and "repeated entry" are behavioural observations, not intent. The reference policy shows both at nonzero rates from pure noise. No metric here measures deception or motivation.
- The learned policies sit well below the exact oracle, so quantitative gaps partly reflect optimizer weakness, not just the objective.
- Uncertainty intervals pool evaluation rollouts across replicas (pooled-rollout Wilson intervals), which understates replica-level clustering.
- None of the numerical thresholds transfer. Not the β values, not the 28.8%, not the shapes. What I'd defend is the qualitative structure. A KL penalty is a leash: **it changes the cost of departing from a reference policy; it does not repair a misspecified reward. And capability changes how the failure appears: a restricted policy fails your task eval; a more capable one passes it while exploiting the same flaw.**

## What I'm doing next

The natural sequel moves the same *audit-grade* design (frozen evaluation, behavioural metrics, an oracle or ground truth to bound what the objective wants) to the real thing at small scale: best-of-N sampling from an open model against a deliberately biased judge on questions with known answers, measuring how judge-approval and correctness diverge as optimization pressure grows, and whether simple mitigations bend the curve or just delay it. That's a miniature of the oversight-stress-testing recipe Anthropic recommends, and unlike this gridworld, the sensor there is a mind, not a tile.

I've applied to [BlueDot Impact's Technical AI Safety course](https://bluedot.org/courses/technical-ai-safety) to pressure-test how I think about all of this with people who will disagree with me. The longer arc is doing safety work on exactly the pipeline I know from the capabilities side: post-training is where a model's behaviour gets decided, and, as this experiment taught me twice, it's where failures hide inside metrics that say everything is fine.

If you think the experiment is still flawed, I'd honestly like to know. The first audit made the post better by breaking it; I'd welcome a second.

---

### Run it yourself

The corrected study lives in a marimo notebook (in `experiment/gpu_run/` in the repo: `notebook.py`, the timestamped `run.log`, per-β statistics, and five figures; the full `results.npz` includes final policy parameters, oracle policies, and raw frozen-evaluation arrays). The full sweep of 6,144 trained policies, across both policy classes and both entropy settings, took about three minutes of GPU time on an RTX PRO 6000 Blackwell. The original laptop-scale script (`experiment/reward_hacking_gridworld.py`, numpy only, minutes on CPU) is kept for history: it implements only the stationary policy class, and reproduces act one. That is precisely its limitation.

### References

1. Ziegler et al. (2019). *Fine-Tuning Language Models from Human Preferences.* [arXiv:1909.08593](https://arxiv.org/abs/1909.08593). §4.4 documents the GPT-2 sign-flip incident.
2. Stiennon et al. (2020). *Learning to Summarize from Human Feedback.* [arXiv:2009.01325](https://arxiv.org/abs/2009.01325)
3. Ouyang et al. (2022). *Training language models to follow instructions with human feedback.* [arXiv:2203.02155](https://arxiv.org/abs/2203.02155)
4. Gao, Schulman & Hilton (2022). *Scaling Laws for Reward Model Overoptimization.* [arXiv:2210.10760](https://arxiv.org/abs/2210.10760)
5. Amodei et al. (2016). *Concrete Problems in AI Safety.* [arXiv:1606.06565](https://arxiv.org/abs/1606.06565)
6. Krakovna et al. (2020). *Specification gaming: the flip side of AI ingenuity.* DeepMind blog; and the [master list of examples](https://vkrakovna.wordpress.com/2018/04/02/specification-gaming-examples-in-ai/).
7. OpenAI (2016). *Faulty reward functions in the wild.* [openai.com](https://openai.com/index/faulty-reward-functions/). The CoastRunners boat-race example.
8. METR (2025). *Recent Frontier Models Are Reward Hacking.* [metr.org](https://metr.org/blog/2025-06-05-recent-reward-hacking/)
9. Booth (TIME, 2025). *When AI Thinks It Will Lose, It Sometimes Cheats.* [time.com](https://time.com/7259395/ai-chess-cheating-palisade-research/). Palisade Research's chess study.
10. Sharma et al. (2023). *Towards Understanding Sycophancy in Language Models.* [arXiv:2310.13548](https://arxiv.org/abs/2310.13548)
11. Wen et al. (2024). *Language Models Learn to Mislead Humans via RLHF.* [arXiv:2409.12822](https://arxiv.org/abs/2409.12822)
12. Denison et al. (2024). *Sycophancy to Subterfuge: Investigating Reward-Tampering in Language Models.* [arXiv:2406.10162](https://arxiv.org/abs/2406.10162)
13. Anthropic (2025). *Natural Emergent Misalignment from Reward Hacking in Production RL.* [arXiv:2511.18397](https://arxiv.org/abs/2511.18397)
14. Farquhar et al. (2025). *MONA: Myopic Optimization with Non-myopic Approval Can Mitigate Multi-step Reward Hacking.* [arXiv:2501.13011](https://arxiv.org/abs/2501.13011)
15. Anthropic Alignment Science (2025). *Recommendations for Technical AI Safety Research Directions.* [alignment.anthropic.com](https://alignment.anthropic.com/2025/recommended-directions/)
16. Open Philanthropy / Coefficient Giving. *Technical AI Safety RFP: Research Areas.* [openphilanthropy.org](https://www.openphilanthropy.org/tais-rfp-research-areas/)
17. Greenblatt (2025). *An overview of areas of control work.* [Redwood Research](https://redwoodresearch.substack.com/p/an-overview-of-areas-of-control-work)
18. Christiano (2019). *What failure looks like.* [Alignment Forum](https://www.alignmentforum.org/posts/HBxe6wdjxK239zajf/what-failure-looks-like)
