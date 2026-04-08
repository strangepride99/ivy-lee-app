import { useState, useEffect, useRef, useCallback } from "react";

const MAX_TASKS = 6;
const STORAGE_KEY = "ivy-lee-tasks";
const DATE_KEY = "ivy-lee-date";

const todayLabel = () =>
  new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
const todayISO = () => new Date().toISOString().split("T")[0];

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
];

const p = {
  sage: "#7D9B76", sageMid: "#A8BFA3", sagePale: "#E8F0E6", sageDeep: "#4F6B4A",
  earth: "#8B7355", earthPale: "#F2EDE6", earthMid: "#C4A882",
  clay: "#C17F5A", clayPale: "#F5EBE3",
  stone: "#9E9488", stonePale: "#F0EDE8", stoneDeep: "#5C574F",
  cream: "#FAF8F4", linen: "#F3EFE9",
  text: "#3A3530", textMid: "#6B6560", textLight: "#9E9890",
  border: "rgba(125,107,85,0.15)", borderMid: "rgba(125,107,85,0.28)",
};

const rankColors = [
  { bg: p.sagePale, text: p.sageDeep, dot: p.sage },
  { bg: "#EEF4EC", text: "#4F6B4A", dot: "#7D9B76" },
  { bg: p.earthPale, text: "#5C4A2A", dot: p.earthMid },
  { bg: p.clayPale, text: "#7A4530", dot: p.clay },
  { bg: p.stonePale, text: p.stoneDeep, dot: p.stone },
  { bg: p.stonePale, text: p.stoneDeep, dot: p.stone },
];

const MODES = [
  { key: "work",  label: "Focus",      mins: 25, color: p.sage },
  { key: "break", label: "Break",      mins: 5,  color: p.earthMid },
  { key: "long",  label: "Long break", mins: 25, color: p.clay },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Serif+Display:ital@0;1&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.wrap{max-width:700px;margin:0 auto;padding:2rem 1.25rem 4rem;font-family:'DM Sans',sans-serif;color:${p.text};}
.header-label{font-size:10px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${p.sage};margin-bottom:5px;}
.header-date{font-family:'DM Serif Display',serif;font-size:21px;color:${p.text};margin-bottom:3px;font-weight:400;}
.header-sub{font-size:12px;color:${p.textLight};margin-bottom:1.25rem;}
.progress-bar-bg{height:3px;background:${p.border};border-radius:99px;margin-bottom:1.25rem;overflow:hidden;}
.progress-bar-fill{height:100%;background:linear-gradient(90deg,${p.sage},${p.sageMid});border-radius:99px;transition:width 0.5s ease;}
.quote-card{padding:12px 15px;background:#fff;border:1px solid ${p.border};border-radius:12px;margin-bottom:1.25rem;display:flex;gap:10px;align-items:flex-start;}
.quote-mark{font-family:'DM Serif Display',serif;font-size:28px;line-height:1;color:${p.sageMid};margin-top:-3px;flex-shrink:0;}
.quote-text{font-family:'DM Serif Display',serif;font-style:italic;font-size:12.5px;line-height:1.55;color:${p.text};}
.quote-author{font-size:10.5px;color:${p.textLight};margin-top:3px;}
.main-cols{display:grid;grid-template-columns:200px 1fr;gap:14px;align-items:start;}
.pomo-card{background:#fff;border:1px solid ${p.border};border-radius:12px;padding:14px 12px;display:flex;flex-direction:column;align-items:center;gap:0;position:sticky;top:1rem;}
.pomo-title{font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${p.textLight};margin-bottom:10px;align-self:flex-start;}
.mode-tabs{display:flex;gap:3px;margin-bottom:12px;width:100%;}
.mode-tab{flex:1;font-size:9.5px;font-family:'DM Sans',sans-serif;padding:4px 3px;border-radius:6px;border:1px solid transparent;cursor:pointer;background:transparent;color:${p.textLight};transition:all 0.2s;text-align:center;}
.mode-tab.active{color:#fff;border-color:transparent;}
.timer-ring{position:relative;width:110px;height:110px;margin-bottom:10px;}
.timer-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;}
.timer-digits{font-size:22px;font-weight:500;letter-spacing:0.02em;color:${p.text};line-height:1;}
.timer-mode-lbl{font-size:9px;color:${p.textLight};letter-spacing:0.08em;text-transform:uppercase;}
.pomo-btns{display:flex;gap:6px;margin-bottom:10px;}
.pb{font-size:11.5px;font-family:'DM Sans',sans-serif;padding:5px 12px;border-radius:7px;border:1px solid ${p.border};background:transparent;color:${p.textMid};cursor:pointer;transition:all 0.2s;}
.pb.primary{color:#fff;border-color:transparent;}
.pb:hover{border-color:${p.borderMid};}
.session-dots{display:flex;gap:5px;}
.sdot{width:5px;height:5px;border-radius:50%;background:${p.border};transition:background 0.3s;}
.sdot.filled{background:${p.sage};}
.tasks-col{}
.tasks-label{font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${p.textLight};margin-bottom:10px;}
.task-row{display:flex;align-items:flex-start;gap:8px;padding:9px 11px;margin-bottom:5px;background:#fff;border:1px solid ${p.border};border-radius:9px;transition:border-color 0.2s,opacity 0.3s;}
.task-row.active{border-color:${p.sageMid};}
.task-row.done{opacity:0.5;background:${p.linen};}
.task-row:hover{border-color:${p.borderMid};}
.check-btn{width:17px;height:17px;border-radius:50%;border:1.5px solid ${p.sageMid};background:transparent;cursor:pointer;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:background 0.2s,border-color 0.2s;}
.check-btn.checked{background:${p.sage};border-color:${p.sage};}
.task-text{flex:1;font-size:13.5px;line-height:1.5;color:${p.text};word-break:break-word;cursor:text;}
.task-text.done{text-decoration:line-through;color:${p.textLight};}
.task-edit-input{width:100%;font-size:13.5px;font-family:'DM Sans',sans-serif;padding:1px 6px;border-radius:5px;border:1px solid ${p.sageMid};background:${p.sagePale};color:${p.text};outline:none;}
.rank-badge{display:flex;align-items:center;gap:4px;padding:2px 7px 2px 5px;border-radius:99px;font-size:10.5px;font-weight:500;flex-shrink:0;}
.leaf{display:inline-block;width:6px;height:6px;border-radius:50%;}
.move-btn{background:none;border:none;cursor:pointer;font-size:9px;color:${p.textLight};padding:1px;line-height:1;transition:color 0.15s;}
.move-btn:hover{color:${p.sageDeep};}
.move-btn:disabled{opacity:0.2;cursor:default;}
.del-btn{background:none;border:none;cursor:pointer;font-size:15px;color:${p.textLight};padding:0 1px;line-height:1;opacity:0.45;transition:opacity 0.15s;}
.del-btn:hover{opacity:1;color:${p.clay};}
.add-row{display:flex;gap:7px;margin-top:.9rem;}
.add-input{flex:1;font-size:13.5px;font-family:'DM Sans',sans-serif;padding:8px 12px;border-radius:9px;border:1px solid ${p.border};background:#fff;color:${p.text};outline:none;transition:border-color 0.2s;}
.add-input:focus{border-color:${p.sageMid};}
.add-input::placeholder{color:${p.textLight};}
.add-btn{padding:8px 16px;border-radius:9px;border:none;background:${p.sage};color:#fff;font-size:13px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:background 0.2s,opacity 0.2s;}
.add-btn:hover{background:${p.sageDeep};}
.add-btn:disabled{opacity:0.35;cursor:default;background:${p.sage};}
.full-msg{padding:10px 13px;background:${p.sagePale};border:1px solid rgba(125,155,118,0.25);border-radius:9px;font-size:12.5px;color:${p.sageDeep};margin-top:.9rem;}
.focus-strip{margin-top:1.25rem;padding:11px 14px;background:${p.earthPale};border-left:3px solid ${p.earthMid};border-radius:0 9px 9px 0;}
.focus-label{font-size:9.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;color:${p.earth};margin-bottom:4px;}
.focus-text{font-size:13px;color:${p.text};line-height:1.5;}
.divider{height:1px;background:${p.border};margin:1.5rem 0;}
.footer-btns{display:flex;gap:7px;justify-content:flex-end;}
.ghost-btn{font-size:11.5px;font-family:'DM Sans',sans-serif;color:${p.textMid};background:none;border:1px solid ${p.border};border-radius:7px;padding:5px 12px;cursor:pointer;transition:border-color 0.2s,color 0.2s;}
.ghost-btn:hover{border-color:${p.borderMid};color:${p.text};}
@media(max-width:520px){.main-cols{grid-template-columns:1fr;}}
`;

const Tomato = ({ angle }) => (
  <svg viewBox="0 0 32 32" width="22" height="22"
    style={{ display: "block", transform: `rotate(${angle}deg)` }}>
    <ellipse cx="16" cy="18" rx="11" ry="10" fill="#C0392B"/>
    <ellipse cx="16" cy="17" rx="10" ry="9" fill="#E74C3C"/>
    <ellipse cx="13" cy="13" rx="2.5" ry="4" fill="#C0392B" opacity="0.3" transform="rotate(-20 13 13)"/>
    <path d="M16 9 Q17 5 21 4 Q19 8 16 9Z" fill="#4F6B4A"/>
    <path d="M16 9 Q15 5 11 5 Q13 8 16 9Z" fill="#7D9B76"/>
    <path d="M16 9 Q18 7 16 5" stroke="#4F6B4A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
  </svg>
);

function PomodoroTimer() {
  const [modeIdx, setModeIdx] = useState(0);
  const [secsLeft, setSecsLeft] = useState(MODES[0].mins * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [angle, setAngle] = useState(0);
  const intervalRef = useRef(null);
  const mode = MODES[modeIdx];
  const total = mode.mins * 60;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (modeIdx === 0) setSessions(n => n + 1);
            return 0;
          }
          return s - 1;
        });
        setAngle(a => a + 6);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, modeIdx]);

  function switchMode(idx) {
    setModeIdx(idx);
    clearInterval(intervalRef.current);
    setRunning(false);
    setSecsLeft(MODES[idx].mins * 60);
    setAngle(0);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSecsLeft(mode.mins * 60);
    setAngle(0);
  }

  const mins = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const secs = String(secsLeft % 60).padStart(2, "0");
  const pct = 1 - secsLeft / total;
  const r = 46;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="pomo-card">
      <p className="pomo-title">Pomodoro</p>
      <div className="mode-tabs">
        {MODES.map((m, i) => (
          <button key={m.key} className={`mode-tab${modeIdx === i ? " active" : ""}`}
            style={modeIdx === i ? { background: m.color } : {}}
            onClick={() => switchMode(i)}>{m.label}</button>
        ))}
      </div>
      <div className="timer-ring">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} fill="none" stroke={p.border} strokeWidth="5"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke={mode.color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 55 55)" style={{ transition: "stroke-dasharray 0.6s ease" }}/>
        </svg>
        <div className="timer-face">
          <Tomato angle={angle} />
          <span className="timer-digits">{mins}:{secs}</span>
          <span className="timer-mode-lbl">{mode.label}</span>
        </div>
      </div>
      <div className="pomo-btns">
        <button className="pb primary" style={{ background: mode.color, borderColor: mode.color }}
          onClick={() => setRunning(r => !r)}>
          {running ? "Pause" : secsLeft < total ? "Resume" : "Start"}
        </button>
        <button className="pb" onClick={reset}>Reset</button>
      </div>
      <div className="session-dots">
        {[0,1,2,3].map(i => <div key={i} className={`sdot${i < sessions % 4 ? " filled" : ""}`}/>)}
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const savedDate = localStorage.getItem(DATE_KEY);
      const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (savedDate !== todayISO()) {
        const rolled = savedTasks
          .filter(t => !t.done)
          .slice(0, MAX_TASKS)
          .map((t, i) => ({ ...t, rank: i + 1 }));
        localStorage.setItem(DATE_KEY, todayISO());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rolled));
        return rolled;
      }
      return savedTasks;
    } catch { return []; }
  });

  const [input, setInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef();
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  function save(updated) {
    setTasks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(DATE_KEY, todayISO());
    } catch {}
  }

  function addTask() {
    const text = input.trim();
    if (!text || tasks.length >= MAX_TASKS) return;
    save([...tasks, { id: Date.now(), text, done: false, rank: tasks.length + 1 }]);
    setInput("");
    inputRef.current?.focus();
  }

  function toggleDone(id) { save(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTask(id) { save(tasks.filter(t => t.id !== id).map((t, i) => ({ ...t, rank: i + 1 }))); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= tasks.length) return;
    const u = [...tasks]; [u[i], u[j]] = [u[j], u[i]];
    save(u.map((t, k) => ({ ...t, rank: k + 1 })));
  }
  function startEdit(t) { setEditId(t.id); setEditText(t.text); }
  function saveEdit(id) {
    const text = editText.trim();
    if (text) save(tasks.map(t => t.id === id ? { ...t, text } : t));
    setEditId(null);
  }

  const done = tasks.filter(t => t.done).length;
  const currentTask = tasks.find(t => !t.done);
  const canAdd = tasks.length < MAX_TASKS;
  const pct = tasks.length > 0 ? (done / tasks.length) * 100 : 0;

  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <p className="header-label">Ivy Lee Method</p>
        <p className="header-date">{todayLabel()}</p>
        <p className="header-sub">
          {done === tasks.length && tasks.length > 0
            ? "All tasks complete — exceptional focus today."
            : `${done} of ${tasks.length} complete · ${MAX_TASKS - tasks.length} slot${MAX_TASKS - tasks.length !== 1 ? "s" : ""} remaining`}
        </p>

        {tasks.length > 0 && (
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }}/>
          </div>
        )}

        <div className="quote-card">
          <span className="quote-mark">"</span>
          <div>
            <p className="quote-text">{quote.text}</p>
            <p className="quote-author">— {quote.author}</p>
          </div>
        </div>

        <div className="main-cols">
          <PomodoroTimer />
          <div className="tasks-col">
            <p className="tasks-label">Today's tasks</p>
            {tasks.length === 0 && (
              <p style={{ fontSize: 13, color: p.textLight, padding: "6px 0" }}>
                No tasks yet — add up to 6 below.
              </p>
            )}
            {tasks.map((t, i) => {
              const rc = rankColors[i] || rankColors[5];
              return (
                <div key={t.id} className={`task-row${t.done ? " done" : currentTask?.id === t.id ? " active" : ""}`}>
                  <button className={`check-btn${t.done ? " checked" : ""}`} onClick={() => toggleDone(t.id)}>
                    {t.done && (
                      <svg width="9" height="7" viewBox="0 0 10 8">
                        <polyline points="1,4 3.5,6.5 9,1" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editId === t.id
                      ? <input autoFocus className="task-edit-input" value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onBlur={() => saveEdit(t.id)}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(t.id); if (e.key === "Escape") setEditId(null); }}/>
                      : <span className={`task-text${t.done ? " done" : ""}`}
                          onDoubleClick={() => !t.done && startEdit(t)}>{t.text}</span>
                    }
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <span className="rank-badge" style={{ background: rc.bg, color: rc.text }}>
                      <span className="leaf" style={{ background: rc.dot }}/>{t.rank}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <button className="move-btn" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
                      <button className="move-btn" onClick={() => move(i, 1)} disabled={i === tasks.length - 1}>▼</button>
                    </div>
                    <button className="del-btn" onClick={() => deleteTask(t.id)}>×</button>
                  </div>
                </div>
              );
            })}

            {canAdd ? (
              <div className="add-row">
                <input ref={inputRef} className="add-input" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  placeholder={tasks.length === 0 ? "What's your most important task today?" : "Add next task…"}/>
                <button className="add-btn" onClick={addTask} disabled={!input.trim()}>Add</button>
              </div>
            ) : (
              <p className="full-msg">Your 6 tasks are set. Begin with task #1 — move nothing until it's done.</p>
            )}

            {currentTask && (
              <div className="focus-strip">
                <p className="focus-label">Now — task {currentTask.rank}</p>
                <p className="focus-text">{currentTask.text}</p>
              </div>
            )}
          </div>
        </div>

        {tasks.length > 0 && (
          <>
            <div className="divider"/>
            <div className="footer-btns">
              <button className="ghost-btn" onClick={() => {
                const r = tasks.filter(t => !t.done).slice(0, MAX_TASKS).map((t, i) => ({ ...t, rank: i + 1 }));
                save(r);
              }}>Roll over incomplete</button>
              <button className="ghost-btn" onClick={() => save([])}>Clear all</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
