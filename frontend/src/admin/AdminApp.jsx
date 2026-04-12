import { useState } from "react";
import { C, rgba } from "./theme.js";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  return (
    <div style={{ fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input:focus{outline:none}::selection{background:${rgba(C.red, 0.15)}}
      `}</style>
      {authed ? <Dashboard /> : <Login onLogin={() => setAuthed(true)} />}
    </div>
  );
}
