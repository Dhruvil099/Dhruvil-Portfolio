// ─────────────────────────────────────────────────────────────────────────────
// ✏️ PROFILE — single source of truth for everything personal on the site.
// When your polished profile is ready, edit ONLY this file; every section of
// the site (hero, about, experience, projects, contact, metadata) reads from it.
// ─────────────────────────────────────────────────────────────────────────────

export const profile = {
  name: "Dhruvil Shah",
  shortRole: "Empirical AI safety · Control & monitoring · RL and post-training",
  role: "Independent empirical AI safety: model organisms of reward hacking, agent security, and what an evaluation can actually authorise. Data engineer at Rezinix.",
  tagline:
    "Empirical AI safety research: model organisms of reward hacking, agent security under prompt injection, and evaluations reported with the findings that did not survive.",

  // Shown in the hero, one paragraph.
  intro:
    "The failure I care about is the one where a system passes every check we know how to run and still should not be given more autonomy. Both of my experiments are small model organisms of it. One is a gridworld with a deliberately gameable reward, 6,144 policies over 36.9 million episodes, asking whether a KL penalty suppresses reward hacking or only hides it; my first answer was an artefact of the policy class I had chosen, so I rebuilt the study and published both versions. The other asks whether raising a tool-using agent's reasoning effort makes it harder to hijack with an injected instruction. Across four AgentDojo domains, every completed comparison's interval crossed zero. I want to work on control evaluations, monitorability and trusted monitoring next, and I am learning mechanistic interpretability, because behavioural evidence has already fooled me once.",

  // Shown in the About section, one paragraph each. `*text*` renders italic.
  about: [
    "The risk I work on is loss of control arriving through ordinary deployment rather than through a dramatic failure. An agent is given real permissions over code, communications and money. It is scored on a proxy for what we actually wanted. The proxy keeps looking healthy after the behaviour underneath it has stopped matching, and by the time anyone checks, the system holds enough autonomy that checking is expensive. That chain is measurable today at small scale, which is where I work: empirical control and evaluation, monitoring and oversight protocols, and the RL and post-training dynamics that produce reward-seeking in the first place.",
    "Two experiments so far, both built as small model organisms rather than benchmarks. The first trained 6,144 tabular policies over 36.86 million episodes to ask whether a KL penalty to a reference policy suppresses reward hacking under a deliberately misspecified reward. I published a tidy answer, then audited my own experiment and broke it: the effect was confounded with the policy class I had chosen. The rebuilt version uses a time-aware policy and an exact oracle, and both versions are on this site. The second is a 9,348-row Inspect and AgentDojo pilot asking whether a model's reasoning effort changes how well it resists indirect prompt injection. Across four domains no completed comparison resolved an effect, and the confirmatory transfer run was lost to a persistence bug in my own runner. I wrote both harnesses, the statistics and the retraction. *From Benchmarks to Barriers* is where I argue what evidence like this can and cannot authorise.",
    "I have since come to distrust that null result for a specific reason. My attack search settled on a single injection template and ran it against every condition, and work on attack selection in agentic control evaluations finds that how hard the red team searches materially changes the safety you measure. A fixed template cannot separate a defence that holds from one that was never properly tested. Rebuilding that pilot with an adaptive attacker is the piece of work I most want to finish, and it is the clearest thing I know about my own limits as an evaluator.",
    "I am partway through Vizuara's six-month RL in Production bootcamp, covering RLHF, reward modelling, verifier-based RL, preference optimisation and world models, because the failures I care about are produced by that machinery and I would rather build it than describe it. What I want next is the kind of control and monitoring research Redwood, Apollo and the UK AI Security Institute do: trusted monitoring protocols, chain-of-thought monitorability while that property lasts, and evaluations that state which deployment they are licensing. I am learning mechanistic interpretability alongside it, because both of my results turned on the limits of behavioural evidence and I would like a second source. I want to do this full-time, owning the cycle from threat model to publication.",
  ],

  focus: [
    "Reward hacking & specification gaming",
    "RLHF / post-training safety",
    "Evaluations that see past task success",
    "Agentic systems & LLM pipelines",
  ],


  email: "shahdhruvil1310@gmail.com",
  github: "https://github.com/Dhruvil099",
  // ✏️ EDIT ME — add when ready (leave "" to hide the link):
  linkedin: "https://www.linkedin.com/in/dhruvil-shah-70a117241",
  twitter: "",

  experience: [
    {
      org: "Rezinix",
      role: "Data Engineer",
      period: "Feb 2026 — present",
      points: [
        "Lead-like cross-functional role across projects: system design, technical execution, client-facing discussions.",
        "Designed and led development of a self-hostable custom form-OCR platform.",
        "Integrated an AI response pipeline for FleekAI and contributed to JewelTech's 3D model generation pipeline.",
      ],
    },
    {
      org: "NotSoHuman.ai",
      role: "Machine Learning Intern",
      period: "Internship",
      points: [
        "Explored fine-tuning methods and hyperparameters for FLUX image-generation models.",
        "Cloud fine-tuning, ComfyUI, FLUX Dev & Schnell.",
      ],
    },
  ],

  projects: [
    {
      name: "Secure Data Transmission",
      blurb:
        "Final-year project I originated and led: arbitrary files travel through an ordinary-looking video and come back with their metadata intact. I framed the carrier-embedding stage as a clustering and assignment problem and built that layer myself.",
      tech: ["Rust", "Python", "OpenCV", "MiniBatch K-Means", "Hungarian algorithm"],
      href: "/blogs/video-steganography-optimization",
    },
    {
      name: "EmotiSense",
      blurb:
        "Multimodal emotion tracking from face and voice, published in Library Progress International. Two candidate models scored higher than the two we shipped; the write-up is about why the higher scores were the wrong ones.",
      tech: ["TensorFlow", "Librosa", "OpenCV", "Chart.js"],
      href: "/blogs/emotisense",
    },
    {
      name: "FLAN-T5 StatGuide",
      blurb:
        "A hypothesis-testing assistant where the fine-tuned model only reads: it extracts the numbers from a word problem and scipy computes the test, so the arithmetic cannot be hallucinated. Written up with the failed approaches and the evaluation bug that hid for a month.",
      tech: ["flan-t5-large", "Transformers", "scipy", "Flask"],
      href: "/blogs/flan-t5-statguide",
    },
  ],
} as const;
