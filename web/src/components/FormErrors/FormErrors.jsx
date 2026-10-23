import React from "react";
import "./FormErrors.css";

export default function FormErrors({ errors }) {
  const errorList = Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .filter(Boolean);

  if (errorList.length === 0) return null;

  return (
    <div className="form-errors">
      <h4>Помилки в формі:</h4>
      <ul>
        {errorList.map((err, idx) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    </div>
  );
}
