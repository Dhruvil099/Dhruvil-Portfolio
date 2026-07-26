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
