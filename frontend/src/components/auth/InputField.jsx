export default function InputField({ label, type, placeholder, value, onChange }) {
  return (
    <div className="field-wrap">
      <label>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}