// ─────────────────────────────────────────────────────────────────────────────
// ✏️ PROFILE — single source of truth for everything personal on the site.
// When your polished profile is ready, edit ONLY this file; every section of
// the site (hero, about, experience, projects, contact, metadata) reads from it.
// ─────────────────────────────────────────────────────────────────────────────

export const profile = {
  name: "Dhruvil Shah",
  shortRole: "AI Safety · RL · Post-training",
  role: "Data Engineer exploring technical AI safety through the RL and post-training stack",
  tagline:
    "I build small, auditable experiments about how reward optimization goes wrong — and write them up honestly, corrections included.",

  // Shown in the hero, one paragraph.
  intro:
    "I work with the pipeline that decides how modern AI models behave — reinforcement learning and post-training — and I am moving my career toward making that pipeline safe. My current focus: reward hacking, specification gaming, and what task-success metrics fail to see.",

  // Shown in the About section, one paragraph each. `*text*` renders italic.
  about: [
    "I am building my career around technical AI safety. As models gain longer-horizon autonomy, more test-time compute and access to code, communications and external tools, the central problem is shifting from whether they can complete a task to whether humans can reliably monitor, constrain and interrupt them when objectives diverge or adversaries adapt. My intended specialisation is empirical AI control, post-training safety and evaluations for these systems.",
    "My public work already targets parts of this problem. I ran a 36.86-million-episode study of KL regularisation under reward misspecification, identified a policy-class confound and rebuilt the experiment around a time-aware policy and exact oracle. I also developed a 9,348-row Inspect/AgentDojo pilot studying whether reasoning effort changes indirect prompt-injection safety. Its completed conditions produced no statistically resolved effect, and I reported the unfinished confirmatory stages without inflating the conclusion. *From Benchmarks to Barriers* connects this evidence to least-privilege access, independent monitoring, human approval and deployment authorisation.",
    "Also, I am currently a part of Vizuara's six-month RL in Production Bootcamp, strengthening the technical base behind my safety work through RLHF, reward modelling, verifier-based RL, preference optimisation and world models.",
    "My next research agenda centres on effort-adaptive agent evaluations, chain-of-thought monitorability, trusted monitoring, scalable oversight and safety cases for consequential deployments. I want to pursue this work full-time in an AI-safety research group, owning the full research cycle: threat modelling, experiment design, implementation, statistical analysis and publication.",
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
  linkedin: "",
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
      href: "/blogs/emotisense-100-percent",
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
