import React, { useEffect, useState } from "react";

const Switch = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <label className="ui-switch">
      <input
        type="checkbox"
        checked={dark}
        onChange={() => setDark((v) => !v)}
        aria-label="Activer le mode sombre"
      />
      <div className="slider">
        <div className="circle" />
      </div>
    </label>
  );
};

export default Switch;
