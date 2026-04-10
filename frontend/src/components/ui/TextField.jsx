export default function TextField({ label, hint, ...props }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <input className="field-input" {...props} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
