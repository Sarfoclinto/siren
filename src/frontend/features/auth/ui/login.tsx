import { useState, useRef, useEffect } from "react";
import { BellRing } from "lucide-react";
import { useApi } from "@frontend/hooks/useApi";
import { useNavigate } from "react-router-dom";


function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { verifyPin } = useApi();
  const navigate = useNavigate();

  const onSuccess = () => {
    navigate("/dashboard");
  };


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || loading) return;

    setLoading(true);
    setError("");

    try {
      const ok = await verifyPin(pin);
      if (ok) {
        onSuccess();
      } else {
        setError("Incorrect PIN");
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        inputRef.current?.focus();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
    setPin(val);
    setError("");
  }

  // Number pad buttons
  function handlePad(digit: string) {
    if (digit === "⌫") {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 8) {
      setPin((p) => p + digit);
    }
    setError("");
  }

  const dots = Math.max(4, pin.length);

  return (
    <div className="login-root">
      <div className={`login-card ${shake ? "shake" : ""}`}>
        {/* Logo */}
        <div className="login-icon">
          <BellRing size={36} strokeWidth={1.5} />
        </div>

        <h1 className="login-title">School Siren</h1>
        <p className="login-subtitle">Enter your admin PIN</p>

        <form onSubmit={handleSubmit} className="login-form">
          {/* PIN dots */}
          <div className="pin-dots" aria-hidden="true">
            {Array.from({ length: dots }, (_, i) => (
              <span
                key={i}
                className={`pin-dot ${i < pin.length ? "filled" : ""}`}
              />
            ))}
          </div>

          {/* Hidden input captures keyboard */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={handleChange}
            className="pin-input-hidden"
            autoComplete="off"
            aria-label="PIN"
            disabled={loading}
          />

          {error && <p className="login-error">{error}</p>}

          {/* Number pad */}
          <div className="numpad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
              (k, i) =>
                k === "" ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type={k === "⌫" ? "button" : "button"}
                    className="numpad-key"
                    onClick={() => handlePad(k)}
                    disabled={loading}
                  >
                    {k}
                  </button>
                ),
            )}
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || pin.length === 0}
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>

        <p className="login-hint">Default PIN: 1234</p>
      </div>

      <style>{`
        .login-root {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: var(--color-bg-page);
        }
        .login-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 40px 36px;
          width: 340px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .login-card.shake {
          animation: shake 0.45s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
        .login-icon {
          color: var(--color-accent);
          margin-bottom: 8px;
        }
        .login-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .login-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .pin-dots {
          display: flex;
          gap: 10px;
          justify-content: center;
          height: 18px;
        }
        .pin-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid var(--color-border-strong);
          transition: background 0.12s, border-color 0.12s;
          display: inline-block;
        }
        .pin-dot.filled {
          background: var(--color-accent);
          border-color: var(--color-accent);
        }
        .pin-input-hidden {
          position: absolute;
          opacity: 0;
          width: 1px;
          height: 1px;
          pointer-events: none;
        }
        .login-error {
          font-size: 12px;
          color: var(--color-danger);
          height: 16px;
        }
        .numpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 200px;
        }
        .numpad-key {
          height: 44px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.1s;
        }
        .numpad-key:hover:not(:disabled) {
          background: var(--color-border);
        }
        .numpad-key:disabled { opacity: 0.4; cursor: not-allowed; }
        .login-btn {
          width: 100%;
          padding: 11px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--color-accent);
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .login-btn:hover:not(:disabled) { background: var(--color-accent-hover); }
        .login-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .login-hint {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 4px;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

export default Login
