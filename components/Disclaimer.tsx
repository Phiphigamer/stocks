export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="disclaimer">
      <span aria-hidden>⚠️</span>
      <div>
        {compact ? (
          <>
            <b>Not financial advice.</b> Forecasts are probabilistic,
            model-generated estimates for educational purposes only. Markets are
            inherently unpredictable.
          </>
        ) : (
          <>
            <b>For educational and informational purposes only — not financial
            advice.</b>{" "}
            Every forecast on this page is a probabilistic, model-generated
            estimate, expressed as scenarios and probabilities precisely because
            markets cannot be predicted with certainty. Nothing here is a
            recommendation to buy or sell any security. Do your own research and
            consult a licensed professional before investing.
          </>
        )}
      </div>
    </div>
  );
}
