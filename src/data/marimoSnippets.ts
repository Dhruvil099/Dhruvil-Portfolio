// Verbatim excerpts from the study's marimo notebook
// (experiment/gpu_run/notebook.py, sha256 85d38069…). Shown read-only.

export const trainingRunSnippet = `run_logger = _mk_logger()
run_logger.info("=== Corrected KL-regularization experiment ===")
run_logger.info(f"config: {json.dumps(cfg)}")

_conditions = {}
for _mode in cfg["policy_modes"]:          # ("stationary", "time_aware")
    for _alpha in cfg["entropy_alphas"]:   # (0.0, 0.02)
        _key = condition_key(_mode, _alpha)
        run_logger.info(f"START CONDITION {_key}")
        _conditions[_key] = train_vectorized(
            cfg, run_logger.info, _mode, _alpha, _train_seed, _eval_seed,
        )

run_logger.info("solving exact time-aware KL-regularized oracle (alpha=0)")
_oracle_probs_t = solve_soft_oracle(cfg, entropy_alpha=0.0)`;

// ── Reasoning-effort study ───────────────────────────────────────────────────
// Verbatim excerpts from the study's public molab notebook
// (https://molab.marimo.io/notebooks/nb_TZRxUhXprugmvKP3t8e1rN). Shown read-only.

export const effortContrastSnippet = `def _rr_contrast(_frame, _outcome, _a, _b, _draws=5000):
    _wide = _frame.dropna(subset=[_outcome]).pivot_table(
        index=["sample_id", "seed"],
        columns="effort",
        values=_outcome,
        aggfunc="mean",
    )
    if _a not in _wide or _b not in _wide:
        return {
            "outcome": _outcome,
            "contrast": f"{_a} - {_b}",
            "estimate": np.nan,
            "ci_low": np.nan,
            "ci_high": np.nan,
            "p_two_sided": np.nan,
            "scenario_clusters": 0,
        }
    _paired = _wide[[_a, _b]].dropna().reset_index()
    _differences = (
        _paired.assign(_difference=_paired[_a] - _paired[_b])
        .groupby("sample_id", observed=True)["_difference"]
        .mean()
        .to_numpy(dtype=float)
    )
    _rng = np.random.default_rng(20260726)
    _indices = _rng.integers(
        0, len(_differences), size=(_draws, len(_differences))
    )
    _boot = _differences[_indices].mean(axis=1)
    _p = min(
        1.0,
        2.0
        * min(float((_boot <= 0).mean()), float((_boot >= 0).mean())),
    )
    return {
        "outcome": _outcome,
        "contrast": f"{_a} - {_b}",
        "estimate": float(_differences.mean()),
        "ci_low": float(np.quantile(_boot, 0.025)),
        "ci_high": float(np.quantile(_boot, 0.975)),
        "p_two_sided": _p,
        "scenario_clusters": int(len(_differences)),
    }`;

export const effortConditionSnippet = `REASONING_EFFORTS = ("low", "medium", "high")

@dataclass(frozen=True)
class ConditionSpec:
    phase: str
    effort: str
    attacked: bool
    defense: str = "none"
    attack_template: str = "official_baseline"
    attack_source_effort: str | None = None

    @property
    def slug(self) -> str:
        source = self.attack_source_effort or "fixed"
        return (
            f"{self.phase}__effort-{self.effort}__attacked-{int(self.attacked)}"
            f"__defense-{self.defense}__attack-{self.attack_template}__source-{source}"
        ).replace("/", "_")`;

export const summarySnippet = `_m = METRIC_INDEX
_stat = results["conditions"][condition_key("stationary", 0.0)]["eval"]
_time = results["conditions"][condition_key("time_aware", 0.0)]["eval"]
_oracle = results["oracle"]["eval"]

summary_df = pd.DataFrame({
    "beta": results["betas"],
    "stationary_delivery": _stat[:, :, _m["delivery"]].mean(1).round(3),
    "stationary_excess": _stat[:, :, _m["proxy_excess_rate"]].mean(1).round(3),
    "time_delivery": _time[:, :, _m["delivery"]].mean(1).round(3),
    "time_excess": _time[:, :, _m["proxy_excess_rate"]].mean(1).round(3),
    "oracle_proxy": _oracle[:, _m["proxy"]].round(3),
})`;
