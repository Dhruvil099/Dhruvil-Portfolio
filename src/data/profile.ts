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

  // Shown in the About section, multiple paragraphs.
  about: [
    "I come to AI safety from the capabilities side: data engineering in production, fine-tuning work, and a deep dive into reinforcement learning and post-training. That vantage point is the reason for my concern — the closer you look at how model behaviour is actually produced, the less the standard safeguards look like guarantees.",
    "My working style is experiment-first. I would rather build the smallest system where a failure mode is visible end to end, measure it properly — frozen evaluations, behavioural metrics, exact oracles where possible — and publish what breaks, including my own earlier conclusions.",
    "I have applied to BlueDot Impact's Technical AI Safety course and am building a portfolio of small, rigorous safety experiments. Two more are currently running.",
  ],

  focus: [
    "Reward hacking & specification gaming",
    "RLHF / post-training safety",
    "Evaluations that see past task success",
    "Agentic systems & LLM pipelines",
  ],

  currently: [
    "Running two follow-up safety experiments (write-ups coming soon)",
    "BlueDot Impact Technical AI Safety course — applicant",
    "Vizuara RL production course — all 4 phases",
  ],

  email: "contact.rezinix@gmail.com",
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
        "File-to-video encoding system with ML-based pixel clustering and Rust-powered processing. Winner, college Tech Expo (cybersecurity).",
      tech: ["Rust", "Python", "OpenCV", "Docker"],
    },
    {
      name: "EmotiSense",
      blurb:
        "Real-time visual + audio emotion tracking (CNN + RNN) with session-level behaviour analysis. Published in Library Progress International.",
      tech: ["TensorFlow", "Librosa", "Flask"],
    },
    {
      name: "FLAN-T5 StatGuide",
      blurb:
        "Statistical hypothesis-testing assistant: fine-tuned FLAN-T5 combined with classical test algorithms to work around embedding limitations.",
      tech: ["PyTorch", "Transformers", "React"],
    },
  ],
} as const;
