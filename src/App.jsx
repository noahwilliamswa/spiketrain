import React, { useEffect, useMemo, useRef, useState } from "react";

const ICONS = {
  more: "⋯",
  plus: "+",
  play: "⏵",
  pause: "⏸",
  stop: "◼",
  trash: "⌫",
  edit: "✎",
  export: "⇩",
  import: "⇧",
  close: "×",
};

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowDate = () => new Date();
const toDisplayDate = (iso) => {
  if (!iso) return "";
  const datePart = String(iso).includes("T") ? String(iso).slice(0, 10) : String(iso);
  const [y, m, d] = datePart.split("-");
  return `${m}/${d}/${y}`;
};
const parseDate = (iso) => new Date(`${iso}T12:00:00`);
const parseDateTime = (value) => {
  if (!value) return new Date(0);
  if (String(value).includes("T")) return new Date(value);
  return new Date(`${value}T00:00:00`);
};
const getSpikeTimestamp = (spike) => spike.createdAt || spike.timestamp || spike.date;
const formatElapsed = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};
const dateKey = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const roundUpToNextHour = (date) => {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  if (date.getMinutes() || date.getSeconds() || date.getMilliseconds()) next.setHours(next.getHours() + 1);
  return next;
};
const formatTimeTick = (date) => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const STORAGE_KEY = "spiketrain.workspace.v1";

const THEMES = {
  "street-ninja": {
    id: "street-ninja",
    name: "Street Ninja",
    description: "The original dark Spiketrain look with neon green signal accents.",
    mode: "dark",
    accent: "#10b981",
    accentSoft: "rgba(16, 185, 129, 0.22)",
    page: "#111111",
    panel: "#141414",
    panel2: "#171717",
    input: "#101010",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    border: "#27272a",
    hover: "#27272a",
    menu: "#191919",
    overlay: "rgba(0, 0, 0, 0.70)",
    accentText: "#ffffff",
    accentGlow: "rgba(16, 185, 129, 0.70)",
  },
  stark: {
    id: "stark",
    name: "Stark",
    description: "A colder dark interface with electric blue signal accents.",
    mode: "dark",
    accent: "#5AD7FF",
    accentSoft: "rgba(90, 215, 255, 0.22)",
    page: "#101216",
    panel: "#151922",
    panel2: "#181d27",
    input: "#0d1117",
    text: "#f4f8fb",
    muted: "#a8b3bd",
    border: "#2a313b",
    hover: "#222b37",
    menu: "#171d26",
    overlay: "rgba(0, 0, 0, 0.70)",
    accentText: "#071018",
    accentGlow: "rgba(90, 215, 255, 0.70)",
  },
  "walter-white": {
    id: "walter-white",
    name: "Walter White",
    description: "A light lab-notebook theme with sandy/gold accents.",
    mode: "light",
    accent: "#c4932f",
    accentSoft: "rgba(196, 147, 47, 0.20)",
    page: "#f3efe4",
    panel: "#fffaf0",
    panel2: "#f8f0dd",
    input: "#fffdf7",
    text: "#1f1b16",
    muted: "#6b6254",
    border: "#d8c8a8",
    hover: "#eadfca",
    menu: "#fffaf0",
    overlay: "rgba(52, 39, 18, 0.28)",
    accentText: "#1f1b16",
    accentGlow: "rgba(196, 147, 47, 0.60)",
  },
  "pencil": {
    id: "pencil",
    name: "Pencil",
    description: "An eggshell paper theme with graphite accents and notebook-like contrast.",
    mode: "light",
    accent: "#2f2f2c",
    accentSoft: "rgba(47, 47, 44, 0.14)",
    page: "#f5f1e7",
    panel: "#fffdf6",
    panel2: "#eee7d8",
    input: "#fffaf0",
    text: "#191816",
    muted: "#6f6a60",
    border: "#d2c8b6",
    hover: "#e7decd",
    menu: "#fffdf6",
    overlay: "rgba(25, 24, 22, 0.24)",
    accentText: "#fffdf6",
    accentGlow: "rgba(47, 47, 44, 0.35)",
  },
  
  "mossdeep-lab": {
    id: "mossdeep-lab",
    name: "Mossdeep Lab",
    description: "A bright coastal research-lab theme with seafoam, soft ocean blues, and clean scientific calm.",
    mode: "light",
    accent: "#3aa6a1",
    accentSoft: "rgba(58, 166, 161, 0.18)",
    page: "#eef8f7",
    panel: "#fbfffd",
    panel2: "#dcefed",
    input: "#f8fffd",
    text: "#102426",
    muted: "#5c7375",
    border: "#b8d9d6",
    hover: "#d1ebe8",
    menu: "#fbfffd",
    overlay: "rgba(16, 36, 38, 0.24)",
    accentText: "#ffffff",
    accentGlow: "rgba(58, 166, 161, 0.45)",
  },
  
  "blueprint": {
    id: "blueprint",
    name: "Blueprint",
    description: "A crisp engineering theme with cool paper blues and technical cyan accents.",
    mode: "light",
    accent: "#2f8fbf",
    accentSoft: "rgba(47, 143, 191, 0.17)",
    page: "#edf5fa",
    panel: "#f8fcff",
    panel2: "#e0edf5",
    input: "#fbfdff",
    text: "#12202a",
    muted: "#5e7180",
    border: "#bfd2df",
    hover: "#d7e8f2",
    menu: "#f8fcff",
    overlay: "rgba(18, 32, 42, 0.26)",
    accentText: "#ffffff",
    accentGlow: "rgba(47, 143, 191, 0.48)",
  },
    
    "assassins-creed": {
    id: "assassins-creed",
    name: "Assassin's Creed",
    description: "A clean hidden-order theme with bone-white panels, charcoal ink, muted crimson accents, and ancient manuscript energy.",
    mode: "light",
    accent: "#b21f2d",
    accentSoft: "rgba(178, 31, 45, 0.16)",
    page: "#eee7d8",
    panel: "#fffaf0",
    panel2: "#e4dac7",
    input: "#fffdf7",
    text: "#191613",
    muted: "#6d6257",
    border: "#cfc0aa",
    hover: "#e0d2bd",
    menu: "#fffaf0",
    overlay: "rgba(25, 22, 19, 0.26)",
    accentText: "#ffffff",
    accentGlow: "rgba(178, 31, 45, 0.42)",
  },
  
  "ghibli-field-notes": {
    id: "ghibli-field-notes",
    name: "Ghibli Field Notes",
    description: "A warm adventure-journal theme with cream paper, moss greens, sky blue hints, and soft brown structure.",
    mode: "light",
    accent: "#5f8f4e",
    accentSoft: "rgba(95, 143, 78, 0.18)",
    page: "#f4ecd9",
    panel: "#fff9ea",
    panel2: "#eadfc6",
    input: "#fffdf3",
    text: "#242015",
    muted: "#746b58",
    border: "#d6c7a8",
    hover: "#e9ddc2",
    menu: "#fff9ea",
    overlay: "rgba(36, 32, 21, 0.24)",
    accentText: "#ffffff",
    accentGlow: "rgba(95, 143, 78, 0.42)",
  },
  
  "fallout-terminal": {
    id: "fallout-terminal",
    name: "Fallout Terminal",
    description: "A retro monochrome vault-computer theme with hard black panels and glowing green signal text.",
    mode: "dark",
    accent: "#39ff14",
    accentSoft: "rgba(57, 255, 20, 0.14)",
    page: "#020602",
    panel: "#061006",
    panel2: "#0a180a",
    input: "#010401",
    text: "#d8ffd2",
    muted: "#78a672",
    border: "#1f3f1d",
    hover: "#102610",
    menu: "#071207",
    overlay: "rgba(0, 4, 0, 0.76)",
    accentText: "#020602",
    accentGlow: "rgba(57, 255, 20, 0.58)",
  },
    
  "clay": {
    id: "clay",
    name: "Clay",
    description: "A warm studio theme with terracotta accents, soft cream panels, and earthy contrast.",
    mode: "light",
    accent: "#b8613f",
    accentSoft: "rgba(184, 97, 63, 0.18)",
    page: "#f3eadf",
    panel: "#fff8ef",
    panel2: "#ead8c7",
    input: "#fffaf3",
    text: "#241812",
    muted: "#766356",
    border: "#d6bda9",
    hover: "#e5d0bd",
    menu: "#fff8ef",
    overlay: "rgba(36, 24, 18, 0.26)",
    accentText: "#ffffff",
    accentGlow: "rgba(184, 97, 63, 0.45)",
  },
  
  "lavender-terminal": {
    id: "lavender-terminal",
    name: "Lavender Terminal",
    description: "A muted dark theme with soft violet accents and calm late-night contrast.",
    mode: "dark",
    accent: "#b9a7ff",
    accentSoft: "rgba(185, 167, 255, 0.17)",
    page: "#171521",
    panel: "#201d2d",
    panel2: "#29253a",
    input: "#16131f",
    text: "#f4f0ff",
    muted: "#aaa1c4",
    border: "#3c3653",
    hover: "#302b44",
    menu: "#201d2d",
    overlay: "rgba(5, 4, 10, 0.58)",
    accentText: "#171521",
    accentGlow: "rgba(185, 167, 255, 0.55)",
  },
  
  "wasp": {
    id: "wasp",
    name: "Wasp",
    description: "A focused dark theme with charcoal panels and sharp yellow-orange warning accents.",
    mode: "dark",
    accent: "#f5c542",
    accentSoft: "rgba(245, 197, 66, 0.16)",
    page: "#10100d",
    panel: "#1a1913",
    panel2: "#242216",
    input: "#12110c",
    text: "#f7f1dc",
    muted: "#aaa18a",
    border: "#3b3623",
    hover: "#2d2919",
    menu: "#1a1913",
    overlay: "rgba(0, 0, 0, 0.62)",
    accentText: "#10100d",
    accentGlow: "rgba(245, 197, 66, 0.58)",
  },
};

const getTheme = (themeId) => THEMES[themeId] || THEMES["street-ninja"];
const safeReadWorkspace = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.projects || !data.tasks || !data.goals || !data.columns) return null;
    return data;
  } catch {
    return null;
  }
};

const sessionStartDateTime = (session) => {
  if (!session) return new Date(0);
  const date = session.date || todayISO();
  const time = session.startedAt || "00:00:00";
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? parseDateTime(date) : parsed;
};

const sortSessionsByStartDesc = (items) =>
  [...items].sort((a, b) => sessionStartDateTime(b).getTime() - sessionStartDateTime(a).getTime());

const shiftSessionSpikesToNewStart = (previousSession, nextSession) => {
  const previousStart = sessionStartDateTime(previousSession);
  const nextStart = sessionStartDateTime(nextSession);
  const changed = previousStart.getTime() !== nextStart.getTime();
  if (!changed) return nextSession;

  return {
    ...nextSession,
    spikes: (nextSession.spikes || []).map((spike) => {
      const original = parseDateTime(getSpikeTimestamp(spike));
      const offset = Number.isNaN(original.getTime()) ? 0 : original.getTime() - previousStart.getTime();
      const shifted = new Date(nextStart.getTime() + offset);
      return {
        ...spike,
        createdAt: shifted.toISOString(),
        timestamp: spike.timestamp ? shifted.toISOString() : spike.timestamp,
        date: shifted.toISOString().slice(0, 10),
      };
    }),
  };
};
function demoTimestamp(hoursAgo, minutesOffset = 0) {
  const date = addHours(nowDate(), -hoursAgo);
  date.setMinutes(Math.max(0, Math.min(59, minutesOffset)), 0, 0);
  return date.toISOString();
}

function demoSessionDate(hoursAgo) {
  return demoTimestamp(hoursAgo).slice(0, 10);
}

function demoSessionTime(hoursAgo, minutesOffset = 0) {
  const date = new Date(demoTimestamp(hoursAgo, minutesOffset));
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const initialWorkspace = {
  title: "Spiketrain Demo Workspace",
  columns: [
    { id: "backlog", title: "Backlog", contribution: 0, spikeWeight: 0 },
    { id: "progress", title: "In Progress", contribution: 50, spikeWeight: 15 },
    { id: "complete", title: "Complete", contribution: 100, spikeWeight: 45 },
  ],
  projects: [
    {
      id: "demo-project",
      title: "Demo Project",
      description:
        "Use this project as a guided tour of Spiketrain. Move through the tasks to learn the Work pane, Goals pane, Spike pane, Log pane, scratchpads, sessions, and export/import flow.",
    },
  ],
  goals: [
    {
      id: "goal-tour",
      title: "Learn Spiketrain",
      description: "Complete the guided onboarding flow: organize tasks, understand goal math, record a session, review spikes, and export your workspace.",
      createdAt: todayISO(),
      status: "Active",
      parentId: null,
    },
    {
      id: "goal-setup",
      title: "Set up the workspace",
      description: "Learn how projects, columns, task cards, editable fields, and task scratchpads work together in the Work pane.",
      createdAt: todayISO(),
      status: "Active",
      parentId: "goal-tour",
    },
    {
      id: "goal-progress",
      title: "Track progress signals",
      description: "Learn how task statuses contribute to goals, how sessions record work, and how status changes become spikes.",
      createdAt: todayISO(),
      status: "Active",
      parentId: "goal-tour",
    },
    {
      id: "goal-review",
      title: "Review and preserve work",
      description: "Use the Spike and Log panes to inspect recorded work, then export the workspace JSON to keep your data.",
      createdAt: todayISO(),
      status: "Active",
      parentId: "goal-tour",
    },
  ],
  tasks: [
    {
      id: "task-open-work",
      title: "1. Review the Work pane",
      richText:
        "Start here. The Work pane is the main Kanban board. Tasks live in columns, and each column has a goal contribution percentage and spike significance value.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-setup", "goal-tour"],
      scratchpad: "Try double-clicking the project title or description above to edit them inline.",
      fields: {},
    },
    {
      id: "task-columns",
      title: "2. Edit columns and status values",
      richText:
        "Double-click a column title, ◎ percentage, or ϟ spike value. The percentage contributes to goal progress. The spike value controls the visual height of recorded spikes.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-setup", "goal-progress"],
      scratchpad: "Backlog is 0%, In Progress is 50%, and Complete is 100% by default. Spike heights are 0px, 15px, and 45px by default.",
      fields: {},
    },
    {
      id: "task-move-task",
      title: "3. Move a task across columns",
      richText:
        "Drag this card into another column, or use the status selector in the right task panel. If no session is active, Spiketrain warns that the change will not be recorded as a spike.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-setup", "goal-progress"],
      scratchpad: "This task is a good one to move while testing the no-session warning.",
      fields: {},
    },
    {
      id: "task-scratchpads",
      title: "4. Try the scratchpads",
      richText:
        "The bottom-left scratchpad belongs to the selected task. The middle scratchpad belongs to the active session and stays locked until a session starts.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-setup", "goal-progress"],
      scratchpad: "Task notes stay with this task, even when another session is active.",
      fields: {},
    },
    {
      id: "task-start-session",
      title: "5. Start a session",
      richText:
        "Use the Session Tracker or Sessions menu to start a session. While a session is active, task status changes generate timestamped spikes.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-progress", "goal-review"],
      scratchpad: "After starting a session, move this task to In Progress or Complete to create a new spike.",
      fields: {},
    },
    {
      id: "task-goal-pane",
      title: "6. Open the Goal pane",
      richText:
        "Switch to ◎ Goal. Top-level goals split horizontal space, child goals descend underneath, and archived goals remain visible but stop contributing upward.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-progress", "goal-tour"],
      scratchpad: "Goal progress is calculated from tasks assigned to this goal and its active descendant goals. Child goal percentages do not directly contribute upward.",
      fields: {},
    },
    {
      id: "task-spike-pane",
      title: "7. Open the Spike pane",
      richText:
        "Switch to ϟ Spike. Toggle between Projects and Goals, adjust the date range, hover spikes to isolate sessions, and click a spike to inspect the session.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-review", "goal-progress"],
      scratchpad: "The Spike pane is the productivity signal view: when work happened and what it moved forward.",
      fields: {},
    },
    {
      id: "task-log-pane",
      title: "8. Open the Log pane",
      richText:
        "Switch to ☰ Log. The log keeps a readable history of recorded sessions, notes, durations, and the spikes produced during each run.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-review"],
      scratchpad: "The log is for memory: what happened, when, and during which work run.",
      fields: {},
    },
    {
      id: "task-export",
      title: "9. Export your workspace",
      richText:
        "Use File → Export Workspace to save a JSON file. This prototype does not use accounts or cloud storage, so exported workspace files are how users keep and move their data.",
      statusId: "backlog",
      projectId: "demo-project",
      goalIds: ["goal-review"],
      scratchpad: "Before creating a new workspace, export the current one if you want to keep it.",
      fields: {},
    },
  ],
  sessions: [
    {
      id: "session-demo-1",
      date: demoSessionDate(20),
      startedAt: demoSessionTime(20, 10),
      lengthSeconds: 1860,
      note: "Demo session: reviewed the Work pane, checked column settings, and created recent 24-hour spike data.",
      spikes: [
        {
          id: "sp-demo-1",
          taskId: "task-open-work",
          projectId: "demo-project",
          goalIds: ["goal-setup", "goal-tour"],
          createdAt: demoTimestamp(20, 18),
          date: demoSessionDate(20),
          weight: 15,
          fromStatusId: "backlog",
          fromStatusTitle: "Backlog",
          toStatusId: "progress",
          toStatusTitle: "In Progress",
          from: "backlog",
          to: "progress",
        },
        {
          id: "sp-demo-2",
          taskId: "task-columns",
          projectId: "demo-project",
          goalIds: ["goal-setup", "goal-progress"],
          createdAt: demoTimestamp(19, 42),
          date: demoSessionDate(19),
          weight: 15,
          fromStatusId: "backlog",
          fromStatusTitle: "Backlog",
          toStatusId: "progress",
          toStatusTitle: "In Progress",
          from: "backlog",
          to: "progress",
        },
      ],
    },
    {
      id: "session-demo-2",
      date: demoSessionDate(9),
      startedAt: demoSessionTime(9, 25),
      lengthSeconds: 2745,
      note: "Demo session: tested goal progress, session recording, and how spikes appear by project or goal.",
      spikes: [
        {
          id: "sp-demo-3",
          taskId: "task-start-session",
          projectId: "demo-project",
          goalIds: ["goal-progress", "goal-review"],
          createdAt: demoTimestamp(9, 34),
          date: demoSessionDate(9),
          weight: 15,
          fromStatusId: "backlog",
          fromStatusTitle: "Backlog",
          toStatusId: "progress",
          toStatusTitle: "In Progress",
          from: "backlog",
          to: "progress",
        },
        {
          id: "sp-demo-4",
          taskId: "task-goal-pane",
          projectId: "demo-project",
          goalIds: ["goal-progress", "goal-tour"],
          createdAt: demoTimestamp(8, 48),
          date: demoSessionDate(8),
          weight: 45,
          fromStatusId: "progress",
          fromStatusTitle: "In Progress",
          toStatusId: "complete",
          toStatusTitle: "Complete",
          from: "progress",
          to: "complete",
        },
      ],
    },
    {
      id: "session-demo-3",
      date: demoSessionDate(2),
      startedAt: demoSessionTime(2, 5),
      lengthSeconds: 3420,
      note: "Demo session: explored the Spike and Log panes and generated a recent completion spike.",
      spikes: [
        {
          id: "sp-demo-5",
          taskId: "task-spike-pane",
          projectId: "demo-project",
          goalIds: ["goal-review", "goal-progress"],
          createdAt: demoTimestamp(2, 16),
          date: demoSessionDate(2),
          weight: 15,
          fromStatusId: "backlog",
          fromStatusTitle: "Backlog",
          toStatusId: "progress",
          toStatusTitle: "In Progress",
          from: "backlog",
          to: "progress",
        },
        {
          id: "sp-demo-6",
          taskId: "task-log-pane",
          projectId: "demo-project",
          goalIds: ["goal-review"],
          createdAt: demoTimestamp(1, 50),
          date: demoSessionDate(1),
          weight: 45,
          fromStatusId: "progress",
          fromStatusTitle: "In Progress",
          toStatusId: "complete",
          toStatusTitle: "Complete",
          from: "progress",
          to: "complete",
        },
      ],
    },
  ],
};


const cloneColumns = (columns = initialWorkspace.columns) =>
  columns.map((column) => ({ ...column }));

const ensureBaseColumns = (columns = []) => {
  const next = cloneColumns(columns.length ? columns : initialWorkspace.columns);
  if (!next.some((column) => column.id === "backlog")) {
    next.unshift({ id: "backlog", title: "Backlog", contribution: 0, spikeWeight: 0 });
  }
  if (!next.some((column) => column.id === "complete")) {
    next.push({ id: "complete", title: "Complete", contribution: 100, spikeWeight: 45 });
  }
  return next;
};

const withProjectColumns = (projects = [], fallbackColumns = initialWorkspace.columns) =>
  projects.map((project) => ({
    ...project,
    columns: ensureBaseColumns(project.columns || fallbackColumns),
  }));

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Button({ children, active, className = "", onClick, icon, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "h-8 px-3 text-xs border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed",
        active && "bg-emerald-600 border-emerald-500 hover:bg-emerald-500",
        className
      )}
    >
      {icon ? <span className="text-sm leading-none">{icon}</span> : null}
      {children}
    </button>
  );
}

function TextInput({ label, value, onChange, textarea, children }) {
  const Input = textarea ? "textarea" : "input";
  return (
    <label className="block text-xs text-zinc-300">
      <span className="mb-1 block">{label}</span>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "w-full bg-[#101010] border border-zinc-800 px-2 py-2 text-xs outline-none focus:border-emerald-700",
          textarea && "min-h-[90px] resize-none"
        )}
      >
        {children}
      </Input>
    </label>
  );
}

function SelectInput({ label, value, onChange, children }) {
  return (
    <label className="block text-xs text-zinc-300">
      <span className="mb-1 block">{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full bg-[#101010] border border-zinc-800 px-2 h-8 text-xs outline-none focus:border-emerald-700">
        {children}
      </select>
    </label>
  );
}

function Panel({ title, action, children, className = "", ...props }) {
  return (
    <section {...props} className={cx("border border-zinc-800 bg-[#141414]", className)}>
      <div className="h-9 px-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm text-zinc-100 truncate">{title}</h3>
        {action || <span className="text-zinc-300 text-lg leading-none">{ICONS.more}</span>}
      </div>
      {children}
    </section>
  );
}

function Modal({ title, children, onClose, width = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className={cx("w-full border border-zinc-700 bg-[#151515] shadow-2xl", width)}>
        <div className="h-10 px-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm">{title}</h2>
          <button onClick={onClose} className="text-xl text-zinc-400 hover:text-white">{ICONS.close}</button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

function Menu({ label, items, disabled }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => {
        cancelClose();
        if (!disabled) setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cx(
          "h-full px-2 text-xs",
          disabled
            ? "text-zinc-600 cursor-not-allowed"
            : open
              ? "bg-zinc-800 text-zinc-100"
              : "hover:bg-zinc-800 text-zinc-200"
        )}
      >
        {label}
      </button>

      {open && !disabled && (
        <div
          className="absolute top-full left-0 z-40 pt-2"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="min-w-[210px] border border-zinc-800 bg-[#191919] shadow-xl py-1">
            {items.map((item, index) =>
              item.divider ? (
                <div key={index} className="h-px bg-zinc-800 my-1" />
              ) : (
                <button
                  key={index}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.action?.();
                  }}
                  className={cx(
                    "w-full h-8 px-3 text-left text-xs flex items-center justify-between gap-3",
                    item.disabled
                      ? "text-zinc-600 cursor-not-allowed"
                      : "hover:bg-zinc-800"
                  )}
                >
                  <span>{item.label}</span>
                  {item.hint ? (
                    <span className="text-zinc-500">{item.hint}</span>
                  ) : null}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel = "Confirm", requireCheck, onConfirm, onClose }) {
  const [checked, setChecked] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-zinc-200">{message}</p>
        {requireCheck && (
          <label className="flex items-start gap-2 text-xs text-zinc-300 border border-zinc-800 bg-zinc-950 p-2">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5" />
            <span>I understand this clears the current workspace data in this browser unless I export it first.</span>
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button active disabled={requireCheck && !checked} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}

function NoSessionWarningDialog({ onContinue, onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  return (
    <Modal title="No Active Session" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-zinc-200">
          This task status change will update the board, but it will not be recorded as a spike because no session is active. Start a session when you want work changes to appear in the Spike pane and session log.
        </p>
        <label className="flex items-start gap-2 text-xs text-zinc-300 border border-zinc-800 bg-zinc-950 p-2">
          <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="mt-0.5" />
          <span>Do not show this warning again.</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button active onClick={() => onContinue(dontShowAgain)}>Change Status Anyway</Button>
        </div>
      </div>
    </Modal>
  );
}

function WorkspaceTitleEditor({ value, onChange, editing, setEditing }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const clean = draft.trim();
    if (clean) onChange(clean);
    setEditing(false);
  };
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full bg-[#101010] border border-emerald-700 px-1 h-7 text-sm outline-none"
      />
    );
  }
  return (
    <button onDoubleClick={() => setEditing(true)} title="Double-click to rename workspace" className="w-full text-left truncate hover:text-emerald-300">
      {value}
    </button>
  );
}

function InlineEditor({ value, onSave, className = "", inputClassName = "", textarea, numeric, suffix = "", title = "Double-click to edit", children, onDragStart }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  useEffect(() => setDraft(String(value ?? "")), [value]);
  const commit = () => {
    const clean = draft.trim();
    if (clean !== "") onSave(numeric ? Number(clean) : clean);
    setEditing(false);
  };
  if (editing) {
    const Input = textarea ? "textarea" : "input";
    return (
      <Input
        autoFocus
        value={draft}
        type={numeric ? "number" : "text"}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !textarea) commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={cx("bg-[#101010] border border-emerald-700 px-1 py-0.5 outline-none text-inherit w-full", inputClassName, textarea && "min-h-[64px] resize-none")}
      />
    );
  }
  return (
    <span
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title={title}
      className={cx("inline-block hover:text-emerald-300", onDragStart && "cursor-grab active:cursor-grabbing", className)}
    >
      {children ?? `${value}${suffix}`}
    </span>
  );
}

export default function App() {
  const storedWorkspace = useMemo(() => safeReadWorkspace(), []);
  const initialData = storedWorkspace || initialWorkspace;
  const [workspaceTitle, setWorkspaceTitle] = useState(initialData.workspaceTitle || initialData.title);
  const [view, setView] = useState("work");
  const [projects, setProjects] = useState(withProjectColumns(initialData.projects, initialData.columns));
  const [columns, setColumns] = useState(initialData.columns);
  const [goals, setGoals] = useState(initialData.goals);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [sessions, setSessions] = useState(sortSessionsByStartDesc(initialData.sessions || []));
  const [selectedProjectId, setSelectedProjectId] = useState(initialData.selectedProjectId || initialData.projects?.[0]?.id || null);
  const [selectedTaskId, setSelectedTaskId] = useState(initialData.selectedTaskId || initialData.tasks?.[0]?.id || null);
  const [selectedGoalId, setSelectedGoalId] = useState(initialData.selectedGoalId || initialData.goals?.[0]?.id || null);
  const [selectedSessionId, setSelectedSessionId] = useState(initialData.selectedSessionId || initialData.sessions?.[0]?.id || null);
  const [activeSession, setActiveSession] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [bottomPanels, setBottomPanels] = useState(initialData.bottomPanels || ["task", "session", "tracker"]);
  const [hoveredSessionId, setHoveredSessionId] = useState(null);
  const [dateRange, setDateRange] = useState("1w");
  const [spikeMode, setSpikeMode] = useState("projects");
  const [customRange, setCustomRange] = useState({ start: dateKey(addDays(nowDate(), -6)), end: todayISO() });
  const [modal, setModal] = useState(null);
  const [workspaceTitleEditing, setWorkspaceTitleEditing] = useState(false);
  const [suppressNoSessionWarning, setSuppressNoSessionWarning] = useState(false);
  const [pendingTaskMove, setPendingTaskMove] = useState(null);
  const [themeId, setThemeId] = useState(initialData.themeId || "street-ninja");
  const theme = getTheme(themeId);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!activeSession || timerPaused) return;
    const id = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [activeSession, timerPaused]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const data = {
      workspaceTitle,
      projects,
      columns,
      goals,
      tasks,
      sessions,
      bottomPanels,
      selectedProjectId,
      selectedTaskId,
      selectedGoalId,
      selectedSessionId,
      themeId,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [workspaceTitle, projects, columns, goals, tasks, sessions, bottomPanels, selectedProjectId, selectedTaskId, selectedGoalId, selectedSessionId, themeId]);

  const allSessions = sortSessionsByStartDesc(activeSession ? [activeSession, ...sessions] : sessions);
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || goals[0];
  const selectedSession = allSessions.find((s) => s.id === selectedSessionId) || allSessions[0];
  const getColumnsForProject = (projectId) => projects.find((project) => project.id === projectId)?.columns || columns;
  const selectedProjectColumns = getColumnsForProject(selectedProject?.id);

  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === selectedProjectId), [tasks, selectedProjectId]);

  const getTaskContribution = (task) => getColumnsForProject(task.projectId).find((c) => c.id === task.statusId)?.contribution || 0;

  const getGoalAndDescendantIds = (goalId, seen = new Set()) => {
    if (!goalId || seen.has(goalId)) return [];

    seen.add(goalId);

    const childGoals = goals.filter(
      (goal) => goal.parentId === goalId && goal.status !== "Archived"
    );

    return [
      goalId,
      ...childGoals.flatMap((child) =>
        getGoalAndDescendantIds(child.id, new Set(seen))
      ),
    ];
  };

  const goalCompletion = (goalId) => {
    if (!goalId) return 0;

    const goalIds = new Set(getGoalAndDescendantIds(goalId));

    const contributingTasks = tasks.filter((task) =>
      (task.goalIds || []).some((id) => goalIds.has(id))
    );

    if (!contributingTasks.length) return 0;

    const total = contributingTasks.reduce(
      (sum, task) => sum + getTaskContribution(task),
      0
    );

    return Math.round(total / contributingTasks.length);
  };

  const rangeWindow = useMemo(() => {
    if (dateRange === "custom") {
      const start = parseDateTime(customRange.start || todayISO());
      const end = parseDateTime(customRange.end || todayISO());
      const orderedStart = start <= end ? start : end;
      const orderedEnd = start <= end ? end : start;
      return { start: orderedStart, end: orderedEnd, days: Math.max(1, Math.ceil((orderedEnd - orderedStart) / 86400000) + 1), label: "custom" };
    }

    if (dateRange === "all") {
      const allSpikeDates = allSessions.flatMap((s) => s.spikes.map((sp) => parseDateTime(getSpikeTimestamp(sp))));
      const start = allSpikeDates.length ? new Date(Math.min(...allSpikeDates.map((d) => d.getTime()))) : addDays(nowDate(), -6);
      const end = nowDate();
      return { start, end, days: Math.max(1, Math.ceil((end - start) / 86400000) + 1), label: "all" };
    }

    const map = { "24h": 1, "1w": 7, "2w": 14, "1m": 31, "3m": 92, "6m": 183 };
    const days = map[dateRange] || 7;
    if (dateRange === "24h") {
      const end = nowDate();
      const start = addHours(end, -24);
      return { start, end, days: 1, label: dateRange };
    }
    const end = nowDate();
    const start = addDays(end, -(days - 1));
    return { start, end, days: Math.max(1, Math.ceil(days)), label: dateRange };
  }, [dateRange, customRange, allSessions]);

  const workspaceExport = () => ({ workspaceTitle, projects, columns, goals, tasks, sessions, bottomPanels, selectedProjectId, selectedTaskId, selectedGoalId, selectedSessionId, themeId, exportedAt: new Date().toISOString() });

  const exportWorkspace = () => {
    const blob = new Blob([JSON.stringify(workspaceExport(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspaceTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-workspace.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWorkspace = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.projects || !data.tasks || !data.goals || !data.columns) throw new Error("Invalid workspace file");
        setWorkspaceTitle(data.workspaceTitle || "Imported Workspace");
        setProjects(withProjectColumns(data.projects, data.columns));
        setColumns(data.columns);
        setGoals(data.goals);
        setTasks(data.tasks);
        setSessions(sortSessionsByStartDesc(data.sessions || []));
        if (data.bottomPanels) setBottomPanels(data.bottomPanels);
        if (data.themeId) setThemeId(data.themeId);
        setSelectedProjectId(data.selectedProjectId || data.projects[0]?.id || null);
        setSelectedTaskId(data.selectedTaskId || data.tasks[0]?.id || null);
        setSelectedGoalId(data.selectedGoalId || data.goals[0]?.id || null);
        setSelectedSessionId(data.selectedSessionId || data.sessions?.[0]?.id || null);
        setView("work");
      } catch (error) {
        alert("Import failed. This does not look like a valid Spiketrain workspace export.");
      }
    };
    reader.readAsText(file);
  };

  const clearAndCreateWorkspace = () => {
    const p = { id: uid(), title: "New Project", description: "Describe the project...", columns: cloneColumns(initialWorkspace.columns) };
    const g = { id: uid(), title: "New Goal", description: "Describe the goal...", createdAt: todayISO(), status: "Active", parentId: null };
    setWorkspaceTitle("Untitled Workspace");
    setProjects([p]);
    setGoals([g]);
    setTasks([]);
    setSessions([]);
    setColumns(initialWorkspace.columns);
    setBottomPanels(["task", "session", "tracker"]);
    setSelectedProjectId(p.id);
    setSelectedGoalId(g.id);
    setSelectedTaskId(null);
    setSelectedSessionId(null);
    setActiveSession(null);
    setSessionNotes("");
    setTimerSeconds(0);
    setTimerPaused(false);
    setView("work");
    setModal(null);
  };

  const newWorkspace = () => setModal({ type: "newWorkspace" });

  const saveProject = (project) => {
    const normalizedProject = { ...project, columns: ensureBaseColumns(project.columns || columns) };
    setProjects((current) => current.some((p) => p.id === normalizedProject.id) ? current.map((p) => p.id === normalizedProject.id ? normalizedProject : p) : [...current, normalizedProject]);
    setSelectedProjectId(normalizedProject.id);
  };

  const updateProjectField = (projectId, field, value) => {
    setProjects((current) => current.map((project) => project.id === projectId ? { ...project, [field]: value } : project));
  };

  const performDeleteProject = (id = selectedProjectId) => {
    if (!id) return;
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    setTasks((current) => current.filter((task) => task.projectId !== id));
    setSelectedProjectId(remaining[0]?.id || null);
    setModal(null);
  };

  const deleteProject = (id = selectedProjectId) => {
    if (!id) return;
    setModal({ type: "confirmDelete", entity: "project", id });
  };

  const saveGoal = (goal) => {
    if (goal.parentId && goal.id === goal.parentId) {
      alert("A goal cannot be its own parent.");
      return;
    }
    if (goal.parentId && goalHasDescendant(goal.id, goal.parentId)) {
      alert("That would create a circular goal hierarchy.");
      return;
    }
    setGoals((current) => current.some((g) => g.id === goal.id) ? current.map((g) => g.id === goal.id ? goal : g) : [...current, goal]);
    setSelectedGoalId(goal.id);
  };

  const performDeleteGoal = (id = selectedGoalId) => {
    if (!id) return;
    setGoals((current) => current.filter((g) => g.id !== id).map((g) => g.parentId === id ? { ...g, parentId: null } : g));
    setTasks((current) => current.map((task) => ({ ...task, goalIds: task.goalIds.filter((goalId) => goalId !== id) })));
    setSelectedGoalId(goals.find((g) => g.id !== id)?.id || null);
    setModal(null);
  };

  const deleteGoal = (id = selectedGoalId) => {
    if (!id) return;
    setModal({ type: "confirmDelete", entity: "goal", id });
  };

  const saveTask = (task) => {
    setTasks((current) => current.some((t) => t.id === task.id) ? current.map((t) => t.id === task.id ? task : t) : [...current, task]);
    setSelectedTaskId(task.id);
  };

  const performDeleteTask = (id = selectedTaskId) => {
    if (!id) return;
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    setSelectedTaskId(remaining[0]?.id || null);
    setModal(null);
  };

  const deleteTask = (id = selectedTaskId) => {
    if (!id) return;
    setModal({ type: "confirmDelete", entity: "task", id });
  };


  const duplicateCurrentProject = () => {
    const source = projects.find((project) => project.id === selectedProjectId);
    if (!source) return;
    const newProjectId = uid();
    const copiedProject = {
      ...source,
      id: newProjectId,
      title: `${source.title} Copy`,
      columns: cloneColumns(source.columns || columns),
    };
    const copiedTasks = tasks
      .filter((task) => task.projectId === source.id)
      .map((task) => ({
        ...task,
        id: uid(),
        projectId: newProjectId,
        title: `${task.title} Copy`,
      }));
    setProjects((current) => [...current, copiedProject]);
    setTasks((current) => [...current, ...copiedTasks]);
    setSelectedProjectId(newProjectId);
    setSelectedTaskId(copiedTasks[0]?.id || null);
    setView("work");
  };

  const duplicateCurrentTask = () => {
    const source = tasks.find((task) => task.id === selectedTaskId);
    if (!source) return;
    const copiedTask = {
      ...source,
      id: uid(),
      title: `${source.title} Copy`,
    };
    setTasks((current) => [...current, copiedTask]);
    setSelectedTaskId(copiedTask.id);
    setSelectedProjectId(copiedTask.projectId);
    setView("work");
  };

  const saveColumn = (column) => {
    if (!selectedProjectId) return;
    setProjects((current) => current.map((project) => {
      if (project.id !== selectedProjectId) return project;
      const projectColumns = ensureBaseColumns(project.columns || columns);
      const nextColumn = { ...column };
      const nextColumns = projectColumns.some((c) => c.id === nextColumn.id)
        ? projectColumns.map((c) => c.id === nextColumn.id ? nextColumn : c)
        : [...projectColumns, nextColumn];
      return { ...project, columns: ensureBaseColumns(nextColumns) };
    }));
  };

  const updateColumnField = (columnId, field, value) => {
    if (!selectedProjectId) return;
    setProjects((current) => current.map((project) => {
      if (project.id !== selectedProjectId) return project;
      const projectColumns = ensureBaseColumns(project.columns || columns);
      return {
        ...project,
        columns: projectColumns.map((column) =>
          column.id === columnId
            ? { ...column, [field]: field === "title" ? value : Math.max(0, Number(value) || 0) }
            : column
        ),
      };
    }));
  };

  const deleteColumn = (id) => {
    if (["backlog", "complete"].includes(id)) return alert("Backlog and Complete are required board states. You can rename them, but they cannot be deleted.");
    if (!selectedProjectId) return;
    if (!window.confirm("Delete this column? This project's tasks in that column will move to Backlog.")) return;
    setProjects((current) => current.map((project) => {
      if (project.id !== selectedProjectId) return project;
      return { ...project, columns: ensureBaseColumns((project.columns || columns).filter((c) => c.id !== id)) };
    }));
    setTasks((current) => current.map((task) => task.projectId === selectedProjectId && task.statusId === id ? { ...task, statusId: "backlog" } : task));
  };

  const applyTaskMove = (taskId, statusId, targetTaskId = null) => {
    const previous = tasks.find((task) => task.id === taskId);
    if (!previous) return;
    const statusChanged = previous.statusId !== statusId;

    setTasks((current) => {
      const moving = current.find((task) => task.id === taskId);
      if (!moving) return current;
      const without = current.filter((task) => task.id !== taskId);
      const updated = { ...moving, statusId };
      if (!targetTaskId) return [...without, updated];
      const targetIndex = without.findIndex((task) => task.id === targetTaskId);
      if (targetIndex < 0) return [...without, updated];
      const next = [...without];
      next.splice(targetIndex, 0, updated);
      return next;
    });

    if (activeSession && statusChanged) {
      const projectColumns = getColumnsForProject(previous.projectId);
      const fromColumn = projectColumns.find((c) => c.id === previous.statusId);
      const toColumn = projectColumns.find((c) => c.id === statusId);
      const createdAt = new Date().toISOString();
      const newSpike = {
        id: uid(),
        taskId,
        projectId: previous.projectId,
        goalIds: previous.goalIds || [],
        createdAt,
        date: createdAt.slice(0, 10),
        weight: toColumn?.spikeWeight || 1,
        fromStatusId: previous.statusId,
        fromStatusTitle: fromColumn?.title || previous.statusId,
        toStatusId: statusId,
        toStatusTitle: toColumn?.title || statusId,
        from: previous.statusId,
        to: statusId,
      };
      setActiveSession((session) => ({ ...session, spikes: [...session.spikes, newSpike], note: sessionNotes }));
    }
  };

  const moveTask = (taskId, statusId, targetTaskId = null) => {
    const previous = tasks.find((task) => task.id === taskId);
    if (!previous) return;
    const statusChanged = previous.statusId !== statusId;
    if (statusChanged && !activeSession && !suppressNoSessionWarning) {
      setPendingTaskMove({ taskId, statusId, targetTaskId });
      setModal({ type: "noSessionWarning" });
      return;
    }
    applyTaskMove(taskId, statusId, targetTaskId);
  };

  const startSession = () => {
    const session = { id: uid(), date: todayISO(), startedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), lengthSeconds: 0, note: "", spikes: [] };
    setSessionNotes("");
    setActiveSession(session);
    setTimerSeconds(0);
    setTimerPaused(false);
    setSelectedSessionId(session.id);
  };

  const endSession = () => {
    if (!activeSession) return;
    const finished = { ...activeSession, note: sessionNotes, lengthSeconds: timerSeconds };
    setSessions((current) => sortSessionsByStartDesc([finished, ...current]));
    setSelectedSessionId(finished.id);
    setActiveSession(null);
    setSessionNotes("");
    setTimerSeconds(0);
    setTimerPaused(false);
  };

  const saveSession = (session) => {
    if (!session) return;
    if (activeSession?.id === session.id) {
      const shifted = shiftSessionSpikesToNewStart(activeSession, { ...activeSession, ...session });
      setActiveSession(shifted);
      setSessionNotes(shifted.note || "");
    } else {
      setSessions((current) => {
        const existing = current.find((item) => item.id === session.id);
        if (!existing) return sortSessionsByStartDesc([session, ...current]);
        return sortSessionsByStartDesc(current.map((item) => {
          if (item.id !== session.id) return item;
          return shiftSessionSpikesToNewStart(item, session);
        }));
      });
    }
    setSelectedSessionId(session.id);
    setModal(null);
  };

  const recordFromSession = (session) => {
    if (!session) return;
    const prepared = { ...session, spikes: session.spikes || [] };
    setSessions((current) => current.filter((item) => item.id !== prepared.id));
    setActiveSession(prepared);
    setSessionNotes(prepared.note || "");
    setTimerSeconds(Math.max(0, Number(prepared.lengthSeconds) || 0));
    setTimerPaused(false);
    setSelectedSessionId(prepared.id);
    setModal(null);
  };

  const deleteSession = (id = selectedSessionId) => {
    if (!id) return;
    setModal({ type: "confirmDelete", entity: "session", id });
  };

  const performDeleteSession = (id = selectedSessionId) => {
    if (!id) return;
    if (activeSession?.id === id) {
      setActiveSession(null);
      setSessionNotes("");
      setTimerSeconds(0);
      setTimerPaused(false);
    }
    const remaining = sessions.filter((session) => session.id !== id);
    setSessions(remaining);
    setSelectedSessionId(remaining[0]?.id || null);
    setModal(null);
  };

  const updateTaskScratch = (value) => {
    setTasks((current) => current.map((task) => task.id === selectedTaskId ? { ...task, scratchpad: value } : task));
  };

  const updateSessionScratch = (value) => {
    if (!activeSession) return;
    setSessionNotes(value);
    setActiveSession((session) => session ? { ...session, note: value } : session);
  };

  const reorderArrayById = (items, draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return items;
    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return items;
    const next = [...items];
    const [dragged] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, dragged);
    return next;
  };

  const reorderBottomPanel = (draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    setBottomPanels((current) => {
      const from = current.indexOf(draggedId);
      const to = current.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const reorderProjects = (draggedId, targetId) => setProjects((current) => reorderArrayById(current, draggedId, targetId));
  const reorderColumns = (draggedId, targetId) => setColumns((current) => reorderArrayById(current, draggedId, targetId));

  const goalHasDescendant = (goalId, possibleDescendantId) => {
    const children = goals.filter((goal) => goal.parentId === goalId);
    return children.some((child) => child.id === possibleDescendantId || goalHasDescendant(child.id, possibleDescendantId));
  };

  const setGoalParent = (goalId, parentId) => {
    if (!goalId || goalId === parentId) return;
    if (parentId && goalHasDescendant(goalId, parentId)) return alert("That would create a circular goal hierarchy.");
    setGoals((current) => current.map((goal) => goal.id === goalId ? { ...goal, parentId: parentId || null } : goal));
  };

  const menuItems = {
    file: [
      { label: "New Workspace", action: newWorkspace, hint: "blank" },
      { label: "Rename Workspace", action: () => setWorkspaceTitleEditing(true) },
      { divider: true },
      { label: "Import Workspace", action: () => fileInputRef.current?.click(), hint: ".json" },
      { label: "Export Workspace", action: exportWorkspace, hint: "json" },
      { label: "Save Workspace to Browser", action: () => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceExport())); alert("Workspace saved to this browser."); }, hint: "local" },
    ],
    projects: [
      { label: "New Project", action: () => setModal({ type: "project", mode: "new" }) },
      { label: "Edit Current Project", action: () => setModal({ type: "project", mode: "edit", id: selectedProjectId }), disabled: !selectedProjectId },
      { label: "Duplicate Current Project", action: duplicateCurrentProject, disabled: !selectedProjectId },
      { label: "Delete Current Project", action: () => deleteProject(), disabled: !selectedProjectId },
    ],
    tasks: [
      { label: "New Task", action: () => setModal({ type: "task", mode: "new" }) },
      { label: "Edit Current Task", action: () => setModal({ type: "task", mode: "edit", id: selectedTaskId }), disabled: !selectedTaskId },
      { label: "Duplicate Current Task", action: duplicateCurrentTask, disabled: !selectedTaskId },
      { label: "Delete Current Task", action: () => deleteTask(), disabled: !selectedTaskId },
    ],
    spikes: [
      { label: "View by Projects", action: () => { setSpikeMode("projects"); setView("spikes"); } },
      { label: "View by Goals", action: () => { setSpikeMode("goals"); setView("spikes"); } },
      { divider: true },
      { label: "Range: 24 hours", action: () => { setDateRange("24h"); setView("spikes"); } },
      { label: "Range: 1 week", action: () => { setDateRange("1w"); setView("spikes"); } },
      { label: "Range: All Time", action: () => { setDateRange("all"); setView("spikes"); } },
    ],
    sessions: [
      { label: "Start Session", action: startSession, disabled: !!activeSession },
      { label: "Create Empty Session", action: () => setModal({ type: "session", mode: "new" }) },
      { label: timerPaused ? "Resume Session" : "Pause Session", action: () => setTimerPaused((p) => !p), disabled: !activeSession },
      { label: "End Session", action: endSession, disabled: !activeSession },
      { divider: true },
      { label: "Edit Selected Session", action: () => setModal({ type: "session", mode: "edit", id: selectedSessionId }), disabled: !selectedSessionId },
      { label: "Delete Selected Session", action: () => deleteSession(), disabled: !selectedSessionId },
    ],
    goals: [
      { label: "New Goal", action: () => setModal({ type: "goal", mode: "new" }) },
      { label: "Edit Current Goal", action: () => setModal({ type: "goal", mode: "edit", id: selectedGoalId }), disabled: !selectedGoalId },
      { label: "Create Subgoal", action: () => setModal({ type: "goal", mode: "new", parentId: selectedGoalId }), disabled: !selectedGoalId },
      { label: "Delete Current Goal", action: () => deleteGoal(), disabled: !selectedGoalId },
    ],
    themes: [
      { label: "Themes...", action: () => setModal({ type: "themes" }) },
    ],
    license: [
      { label: "Local Prototype License", action: () => alert("Spiketrain prototype. Workspace data is saved in this browser automatically and can also be exported as JSON.") },
      { label: "About Spiketra.in", action: () => setModal({ type: "about" }) },
    ],
    help: [
      { label: "How Work Works", action: () => setModal({ type: "help", topic: "work" }) },
      { label: "How Goal Math Works", action: () => setModal({ type: "help", topic: "goals" }) },
      { label: "How Spikes Work", action: () => setModal({ type: "help", topic: "spikes" }) },
      { label: "How Sessions Work", action: () => setModal({ type: "help", topic: "sessions" }) },
      { label: "How the Log Works", action: () => setModal({ type: "help", topic: "log" }) },
    ],
  };

  return (
    <div className={`w-full min-h-screen bg-[#111111] text-zinc-100 font-sans text-sm overflow-hidden custom-scrollbars theme-${theme.mode}`} style={{ "--accent": theme.accent, "--accent-soft": theme.accentSoft, "--accent-text": theme.accentText, "--accent-glow": theme.accentGlow, "--page": theme.page, "--panel": theme.panel, "--panel-2": theme.panel2, "--input": theme.input, "--app-text": theme.text, "--muted-text": theme.muted, "--app-border": theme.border, "--hover": theme.hover, "--menu": theme.menu, "--overlay": theme.overlay }}>
      <style>{`
        .custom-scrollbars *::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbars *::-webkit-scrollbar-track { background: var(--page); }
        .custom-scrollbars *::-webkit-scrollbar-thumb { background: var(--app-border); border: 1px solid var(--panel); border-radius: 0; }
        .custom-scrollbars *::-webkit-scrollbar-thumb:hover { background: var(--muted-text); }
        .custom-scrollbars * { scrollbar-color: var(--app-border) var(--page); scrollbar-width: thin; }

        .custom-scrollbars { background: var(--page) !important; color: var(--app-text) !important; }
        .custom-scrollbars[class~="bg-[#111111]"], .custom-scrollbars [class~="bg-[#111111]"] { background: var(--page) !important; }
        .custom-scrollbars [class~="bg-[#141414]"], .custom-scrollbars [class~="bg-[#151515]"] { background: var(--panel) !important; }
        .custom-scrollbars [class~="bg-[#171717]"], .custom-scrollbars [class~="bg-[#191919]"], .custom-scrollbars [class~="bg-[#1a1a1a]"], .custom-scrollbars [class~="bg-[#1d1d1d]"] { background: var(--panel-2) !important; }
        .custom-scrollbars [class~="bg-[#101010]"], .custom-scrollbars [class~="bg-[#0d0d0d]"], .custom-scrollbars .bg-zinc-900, .custom-scrollbars .bg-zinc-950 { background: var(--input) !important; }
        .custom-scrollbars [class~="bg-black/70"] { background: var(--overlay) !important; }
        .custom-scrollbars .border-zinc-800, .custom-scrollbars .border-zinc-900, .custom-scrollbars .border-zinc-700 { border-color: var(--app-border) !important; }
        .custom-scrollbars .text-zinc-100, .custom-scrollbars .text-zinc-200, .custom-scrollbars .text-white { color: var(--app-text) !important; }
        .custom-scrollbars .text-zinc-300, .custom-scrollbars .text-zinc-400, .custom-scrollbars .text-zinc-500, .custom-scrollbars .text-zinc-600 { color: var(--muted-text) !important; }
        .custom-scrollbars .bg-emerald-600, .custom-scrollbars .bg-emerald-700, .custom-scrollbars .bg-emerald-400, .custom-scrollbars .bg-emerald-300, .custom-scrollbars .bg-emerald-200 { background: var(--accent) !important; color: var(--accent-text) !important; }
        .custom-scrollbars [class~="hover:bg-emerald-500"]:hover, .custom-scrollbars [class~="hover:bg-emerald-600"]:hover, .custom-scrollbars [class~="hover:bg-emerald-700"]:hover { background: color-mix(in srgb, var(--accent) 86%, black) !important; color: var(--accent-text) !important; }
        .custom-scrollbars .bg-emerald-950, .custom-scrollbars [class~="bg-emerald-950/40"] { background: var(--accent-soft) !important; }
        .custom-scrollbars .border-emerald-500, .custom-scrollbars .border-emerald-600, .custom-scrollbars .border-emerald-700, .custom-scrollbars .ring-emerald-300, .custom-scrollbars [class~="focus:border-emerald-700"]:focus, .custom-scrollbars [class~="hover:border-emerald-600"]:hover, .custom-scrollbars [class~="hover:border-emerald-700"]:hover { border-color: var(--accent) !important; --tw-ring-color: var(--accent) !important; }
        .custom-scrollbars [class~="text-emerald-100/70"], .custom-scrollbars .text-emerald-200, .custom-scrollbars .text-emerald-300, .custom-scrollbars .text-emerald-400, .custom-scrollbars [class~="hover:text-emerald-300"]:hover, .custom-scrollbars [class~="hover:text-emerald-400"]:hover { color: var(--accent) !important; }
        .custom-scrollbars input:focus, .custom-scrollbars textarea:focus, .custom-scrollbars select:focus { border-color: var(--accent) !important; outline: none; }
        .custom-scrollbars button:hover:not(:disabled) { border-color: var(--app-border); }
        .custom-scrollbars [class~="hover:bg-zinc-800"]:hover, .custom-scrollbars .bg-zinc-800 { background: var(--hover) !important; }
        .custom-scrollbars .bg-zinc-600 { background: color-mix(in srgb, var(--muted-text) 44%, transparent) !important; }
        .custom-scrollbars [class~="shadow-[0_0_12px_rgba(52,211,153,.7)]"], .custom-scrollbars [class~="shadow-[0_0_14px_rgba(52,211,153,.8)]"] { box-shadow: 0 0 12px var(--accent-glow) !important; }
        .theme-light select, .theme-light input, .theme-light textarea, .theme-light button { color: var(--app-text); }
        .theme-light .bg-emerald-600, .theme-light .bg-emerald-700, .theme-light .bg-emerald-400, .theme-light .bg-emerald-300, .theme-light .bg-emerald-200 { color: var(--accent-text) !important; }
        .theme-light [class~="disabled:bg-[#0d0d0d]"]:disabled { background: color-mix(in srgb, var(--input) 70%, var(--app-border)) !important; }
      `}</style>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => importWorkspace(e.target.files?.[0])} />
      <div className="h-screen grid grid-cols-[200px_1fr] grid-rows-[40px_1fr_280px]">
        <aside className="row-span-3 border-r border-zinc-800 bg-[#171717] flex flex-col">
          <div className="h-10 px-2 flex items-center border-b border-zinc-800 text-sm truncate">
            <WorkspaceTitleEditor value={workspaceTitle} onChange={setWorkspaceTitle} editing={workspaceTitleEditing} setEditing={setWorkspaceTitleEditing} />
          </div>
          <div className="flex-1 overflow-auto pb-2">
            {projects.map((project) => (
              <button
                key={project.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ type: "project", id: project.id }))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  try {
                    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                    if (data.type === "project") reorderProjects(data.id, project.id);
                  } catch {}
                }}
                onClick={() => setSelectedProjectId(project.id)}
                className={cx(
                  "w-full min-h-[30px] text-left px-2 border-b border-zinc-800 hover:bg-zinc-800 truncate",
                  selectedProjectId === project.id && "bg-emerald-600 hover:bg-emerald-600 text-white"
                )}
              >
                {project.title}
              </button>
            ))}
          </div>
          <div className="h-12 p-2 pb-3 grid grid-cols-3 gap-2">
            <Button onClick={() => setModal({ type: "project", mode: "new" })}>New</Button>
            <Button onClick={() => setModal({ type: "project", mode: "edit", id: selectedProjectId })}>Edit</Button>
            <Button onClick={() => deleteProject()}>Delete</Button>
          </div>
        </aside>

        <header className="col-start-2 border-b border-zinc-800 bg-[#151515] flex items-center justify-between">
          <nav className="h-full px-2 flex items-center text-xs text-zinc-200">
            <Menu label="File" items={menuItems.file} />
            <Menu label="Projects" items={menuItems.projects} disabled={view !== "work"} />
            <Menu label="Tasks" items={menuItems.tasks} disabled={view !== "work"} />
            <Menu label="Goals" items={menuItems.goals} disabled={view !== "goals"} />
            <Menu label="Spikes" items={menuItems.spikes} disabled={view !== "spikes"} />
            <Menu label="Sessions" items={menuItems.sessions} />
            <Menu label="Themes" items={menuItems.themes} />
            <Menu label="License" items={menuItems.license} />
            <Menu label="Help" items={menuItems.help} />
          </nav>
          <div className="h-full flex text-xs">
            {[["work", "▦ Work"], ["goals", "◎ Goal"], ["spikes", "ϟ Spike"], ["log", "☰ Log"]].map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} className={cx("h-full px-3 border-l border-zinc-800 hover:bg-zinc-800", view === id && "bg-zinc-800 text-white")}>{label}</button>
            ))}
          </div>
        </header>

        <main className="col-start-2 row-start-2 overflow-hidden grid grid-cols-[1fr_360px]">
          <div className="overflow-auto p-2">
            {view === "work" && <WorkView project={selectedProject} columns={selectedProjectColumns} tasks={projectTasks} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} onMoveTask={moveTask} onAddTask={(statusId) => setModal({ type: "task", mode: "new", statusId })} onEditColumn={(id) => setModal({ type: "column", mode: "edit", id })} onAddColumn={() => setModal({ type: "column", mode: "new" })} onReorderColumns={reorderColumns} onUpdateProjectField={updateProjectField} onUpdateColumnField={updateColumnField} />}
            {view === "goals" && <GoalsView goals={goals} selectedGoalId={selectedGoalId} setSelectedGoalId={setSelectedGoalId} completion={goalCompletion} onSetGoalParent={setGoalParent} onAddGoal={() => setModal({ type: "goal", mode: "new" })} />}
            {view === "spikes" && <SpikesView goals={goals} projects={projects} tasks={tasks} sessions={allSessions} selectedSessionId={selectedSessionId} hoveredSessionId={hoveredSessionId} setHoveredSessionId={setHoveredSessionId} setSelectedSessionId={setSelectedSessionId} dateRange={dateRange} setDateRange={setDateRange} customRange={customRange} setCustomRange={setCustomRange} rangeWindow={rangeWindow} spikeMode={spikeMode} setSpikeMode={setSpikeMode} />}
            {view === "log" && <LogView sessions={allSessions} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} />}
          </div>

          <DetailPane
            view={view}
            task={selectedTask}
            goal={selectedGoal}
            session={selectedSession}
            completion={goalCompletion(selectedGoal?.id)}
            columns={selectedTask ? getColumnsForProject(selectedTask.projectId) : selectedProjectColumns}
            projects={projects}
            goals={goals}
            tasks={tasks}
            onMoveTask={moveTask}
            onEditTask={() => setModal({ type: "task", mode: "edit", id: selectedTaskId })}
            onDeleteTask={() => deleteTask()}
            onEditGoal={() => setModal({ type: "goal", mode: "edit", id: selectedGoalId })}
            onCreateSubgoal={() => setModal({ type: "goal", mode: "new", parentId: selectedGoalId })}
            onDeleteGoal={() => deleteGoal()}
            onEditSession={() => setModal({ type: "session", mode: "edit", id: selectedSessionId })}
            onDeleteSession={() => deleteSession()}
          />
        </main>

        <footer className="col-start-2 row-start-3 border-t border-zinc-800 bg-[#141414] grid grid-cols-3 gap-2 p-2">
          {bottomPanels.map((panelId) => (
            <BottomPanelShell key={panelId} id={panelId} onReorder={reorderBottomPanel}>
              {panelId === "task" && <Scratchpad title={`Task Scratchpad · ${selectedTask?.title || "No task"}`} value={selectedTask?.scratchpad || ""} onChange={updateTaskScratch} placeholder="Select a task, then write task notes..." disabled={!selectedTask} />}
              {panelId === "session" && <Scratchpad title={activeSession ? `Session Scratchpad · Current Session` : "Session Scratchpad · No Current Session"} value={sessionNotes} onChange={updateSessionScratch} placeholder={activeSession ? "Enter notes for this recorded run..." : "Start a session to write session notes..."} disabled={!activeSession} />}
              {panelId === "tracker" && <SessionTracker sessions={allSessions} selectedSessionId={selectedSessionId} activeSession={activeSession} timerSeconds={timerSeconds} timerPaused={timerPaused} onStart={startSession} onCreate={() => setModal({ type: "session", mode: "new" })} onPause={() => setTimerPaused((p) => !p)} onEnd={endSession} onSelect={setSelectedSessionId} onEdit={() => setModal({ type: "session", mode: "edit", id: selectedSessionId })} onDelete={() => deleteSession()} />}
            </BottomPanelShell>
          ))}
        </footer>
      </div>

      {modal?.type === "project" && <ProjectDialog mode={modal.mode} project={modal.mode === "edit" ? selectedProject : null} onSave={(p) => { saveProject(p); setModal(null); }} onClose={() => setModal(null)} />}
      {modal?.type === "goal" && <GoalDialog mode={modal.mode} goal={modal.mode === "edit" ? selectedGoal : null} parentId={modal.parentId} goals={goals} onSave={(g) => { saveGoal(g); setModal(null); }} onClose={() => setModal(null)} />}
      {modal?.type === "task" && <TaskDialog mode={modal.mode} task={modal.mode === "edit" ? selectedTask : null} statusId={modal.statusId} projects={projects} goals={goals} columns={selectedProjectColumns} selectedProjectId={selectedProjectId} selectedGoalId={selectedGoalId} onSave={(t) => { saveTask(t); setModal(null); }} onClose={() => setModal(null)} />}
      {modal?.type === "column" && <ColumnDialog mode={modal.mode} column={modal.mode === "edit" ? selectedProjectColumns.find((c) => c.id === modal.id) : null} onSave={(c) => { saveColumn(c); setModal(null); }} onDelete={(id) => { deleteColumn(id); setModal(null); }} onClose={() => setModal(null)} />}
      {modal?.type === "session" && <SessionDialog mode={modal.mode} session={modal.mode === "edit" ? allSessions.find((session) => session.id === selectedSessionId) : null} tasks={tasks} projects={projects} goals={goals} getColumnsForProject={getColumnsForProject} onSave={saveSession} onRecordFromHere={recordFromSession} onClose={() => setModal(null)} />}
      {modal?.type === "help" && <HelpDialog topic={modal.topic} onClose={() => setModal(null)} />}
      {modal?.type === "about" && <AboutDialog onClose={() => setModal(null)} />}
      {modal?.type === "themes" && <ThemesDialog themeId={themeId} setThemeId={setThemeId} onClose={() => setModal(null)} />}
      {modal?.type === "noSessionWarning" && (
        <NoSessionWarningDialog
          onContinue={(dontShowAgain) => {
            if (dontShowAgain) setSuppressNoSessionWarning(true);
            if (pendingTaskMove) applyTaskMove(pendingTaskMove.taskId, pendingTaskMove.statusId, pendingTaskMove.targetTaskId);
            setPendingTaskMove(null);
            setModal(null);
          }}
          onClose={() => {
            setPendingTaskMove(null);
            setModal(null);
          }}
        />
      )}
      {modal?.type === "newWorkspace" && (
        <ConfirmDialog
          title="Create New Workspace"
          message="Creating a new workspace will clear your previous workspace from this browser. Because this prototype does not use accounts or cloud storage, please export your current workspace first if you want to keep it."
          confirmLabel="Clear and Create Workspace"
          requireCheck
          onConfirm={clearAndCreateWorkspace}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirmDelete" && modal.entity === "project" && (
        <ConfirmDialog
          title="Delete Project"
          message="Delete this project and all of its tasks? This cannot be undone unless you have exported a workspace file."
          confirmLabel="Delete Project"
          onConfirm={() => performDeleteProject(modal.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirmDelete" && modal.entity === "task" && (
        <ConfirmDialog
          title="Delete Task"
          message="Delete this task? Its scratchpad and goal assignments will also be removed."
          confirmLabel="Delete Task"
          onConfirm={() => performDeleteTask(modal.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirmDelete" && modal.entity === "goal" && (
        <ConfirmDialog
          title="Delete Goal"
          message="Delete this goal? Child goals will become top-level goals, and this goal will be removed from assigned tasks."
          confirmLabel="Delete Goal"
          onConfirm={() => performDeleteGoal(modal.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirmDelete" && modal.entity === "session" && (
        <ConfirmDialog
          title="Delete Session"
          message="Delete this session? Its scratchpad notes and recorded spikes will be removed."
          confirmLabel="Delete Session"
          onConfirm={() => performDeleteSession(modal.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function WorkView({ project, columns, tasks, selectedTaskId, onSelectTask, onMoveTask, onAddTask, onAddColumn, onEditColumn, onReorderColumns, onUpdateProjectField, onUpdateColumnField }) {
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="px-1 max-w-3xl">
        <h1 className="text-base mb-2">
          {project ? <InlineEditor value={project.title} onSave={(value) => onUpdateProjectField(project.id, "title", value)} /> : "No project"}
        </h1>
        <p className="text-xs leading-5 text-zinc-200">
          {project ? <InlineEditor textarea value={project.description} onSave={(value) => onUpdateProjectField(project.id, "description", value)} /> : "Create a project to begin."}
        </p>
      </div>
      <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(210px, 1fr)) minmax(150px, .45fr)` }}>
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.statusId === column.id);
          return (
            <Panel
              key={column.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                  if (data.type === "task") onMoveTask(data.id, column.id);
                  if (data.type === "column") onReorderColumns(data.id, column.id);
                } catch {}
              }}
              title={<InlineEditor value={column.title} onSave={(value) => onUpdateColumnField(column.id, "title", value)} onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify({ type: "column", id: column.id })); }} />}
              action={<div className="flex items-center gap-1 text-[10px] text-zinc-500 whitespace-nowrap"><InlineEditor numeric value={column.contribution} suffix="%" onSave={(value) => onUpdateColumnField(column.id, "contribution", clamp(value))} title="Double-click to edit goal contribution" className="whitespace-nowrap">◎ {column.contribution}%</InlineEditor><span>·</span><InlineEditor numeric value={column.spikeWeight} suffix="px" onSave={(value) => onUpdateColumnField(column.id, "spikeWeight", Math.max(0, Number(value) || 0))} title="Double-click to edit spike height/significance" className="whitespace-nowrap">ϟ {column.spikeWeight}px</InlineEditor><button onClick={() => onEditColumn(column.id)} className="text-zinc-300 text-lg leading-none">{ICONS.more}</button></div>}
              className="min-h-[450px] flex flex-col"
            >
              <div className="flex-1 p-2 space-y-1 overflow-auto">
                {columnTasks.map((task) => (
                  <button
                    key={task.id}
                    data-task-card="true"
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/plain", JSON.stringify({ type: "task", id: task.id }));
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                        if (data.type === "task") onMoveTask(data.id, column.id, task.id);
                      } catch {}
                    }}
                    onClick={() => onSelectTask(task.id)}
                    className={cx("group w-full min-h-6 px-2 py-1 border border-zinc-800 bg-[#1d1d1d] text-left hover:bg-zinc-800 flex items-center justify-between cursor-grab active:cursor-grabbing", selectedTaskId === task.id && "bg-emerald-600 border-emerald-500 hover:bg-emerald-600")}
                  >
                    <span className="truncate">{task.title}</span>
                    <select value={task.statusId} onClick={(e) => e.stopPropagation()} onChange={(e) => onMoveTask(task.id, e.target.value)} className="opacity-0 group-hover:opacity-100 bg-zinc-900 border border-zinc-700 text-[10px] outline-none">
                      {columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-zinc-800"><Button className="w-full" onClick={() => onAddTask(column.id)}>Add Task</Button></div>
            </Panel>
          );
        })}
        <button onClick={onAddColumn} className="border border-dashed border-zinc-800 hover:border-emerald-600 text-zinc-500 hover:text-emerald-400 min-h-[450px]">
          <div className="mx-auto mb-2 text-2xl leading-none">{ICONS.plus}</div>
          Add Column
        </button>
      </div>
    </div>
  );
}

function GoalsView({
  goals,
  selectedGoalId,
  setSelectedGoalId,
  completion,
  onSetGoalParent,
  onAddGoal,
}) {
  const GOAL_MIN_WIDTH = 150;
  const GOAL_GAP = 8;

  const getGoalTreeWidth = (goal, depth = 0) => {
    const children = goals.filter((g) => g.parentId === goal.id);

    if (children.length === 0) {
      return GOAL_MIN_WIDTH;
    }

    const childrenWidth =
      children.reduce((sum, child) => {
        return sum + getGoalTreeWidth(child, depth + 1);
      }, 0) + Math.max(0, children.length - 1) * GOAL_GAP;

    return Math.max(GOAL_MIN_WIDTH, childrenWidth);
  };

  const renderGoal = (goal, depth = 0) => {
    const children = goals.filter((g) => g.parentId === goal.id);
    const value = completion(goal.id);
    const archived = goal.status === "Archived";
    const treeWidth = getGoalTreeWidth(goal, depth);

    return (
      <div
        key={goal.id}
        className="flex flex-col gap-2"
        style={{
          flex: "1 1 0",
          minWidth: `${treeWidth}px`,
        }}
      >
        <button
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData(
              "text/plain",
              JSON.stringify({ type: "goal", id: goal.id })
            );
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
              const data = JSON.parse(e.dataTransfer.getData("text/plain"));

              if (data.type === "goal") {
                onSetGoalParent(data.id, goal.id);
              }
            } catch {}
          }}
          onClick={() => setSelectedGoalId(goal.id)}
          className={cx(
            "relative overflow-hidden rounded-lg border border-zinc-900 text-left flex items-end min-h-[110px] cursor-grab active:cursor-grabbing",
            archived ? "bg-zinc-900 opacity-60 grayscale" : "bg-emerald-950",
            depth === 0 && "min-h-[145px]",
            selectedGoalId === goal.id && "ring-1 ring-emerald-300"
          )}
          style={{
            width: "100%",
            minWidth: `${GOAL_MIN_WIDTH}px`,
          }}
        >
          <div
            className={cx(
              "absolute bottom-0 left-0 right-0",
              archived ? "bg-zinc-600" : "bg-emerald-600"
            )}
            style={{
              height: `${Math.max(10, value)}%`,
            }}
          />

          <div className="absolute top-2 left-2 text-[10px] text-emerald-100/70">
            {archived
              ? "archived"
              : depth === 0
                ? "top goal"
                : `child level ${depth}`}
          </div>

          <div className="relative z-10 w-full p-3 flex items-end justify-between gap-2">
            <div className="font-medium leading-4">{goal.title}</div>
            <div className="font-bold">{value}%</div>
          </div>
        </button>

        {children.length > 0 && (
          <div
            className="flex items-start w-full"
            style={{
              gap: `${GOAL_GAP}px`,
            }}
          >
            {children.map((child) => renderGoal(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const roots = goals.filter(
    (g) => !g.parentId || !goals.some((candidate) => candidate.id === g.parentId)
  );

  const totalRootWidth =
    roots.reduce((sum, root) => {
      return sum + getGoalTreeWidth(root, 0);
    }, 0) + Math.max(0, roots.length - 1) * GOAL_GAP;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 overflow-hidden">
      <div className="shrink-0 flex items-end justify-between px-1">
        <h1 className="text-base">Workspace Goals</h1>

        <div className="text-xs text-zinc-500">
          Top-level goals fill available space. Child goals split the full parent
          width equally while preserving minimum tree widths.
        </div>
      </div>

      <div
        className="shrink-0 h-10 border border-dashed border-zinc-800 hover:border-emerald-700 text-xs text-zinc-500 hover:text-emerald-300 flex items-center justify-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();

          try {
            const data = JSON.parse(e.dataTransfer.getData("text/plain"));

            if (data.type === "goal") {
              onSetGoalParent(data.id, null);
            }
          } catch {}
        }}
      >
        Drop goal here to make it top-level
      </div>

      <div
        className="flex-1 min-h-0 overflow-auto border border-zinc-900 bg-[#101010] p-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();

          try {
            const data = JSON.parse(e.dataTransfer.getData("text/plain"));

            if (data.type === "goal") {
              onSetGoalParent(data.id, null);
            }
          } catch {}
        }}
      >
        <div
          className="flex items-start min-h-full w-full"
          style={{
            gap: `${GOAL_GAP}px`,
            minWidth: `${totalRootWidth}px`,
          }}
        >
          {roots.map((goal) => renderGoal(goal, 0))}
        </div>
      </div>

      <button
        onClick={onAddGoal}
        className="shrink-0 w-full h-10 border border-dashed border-zinc-800 hover:border-emerald-600 text-zinc-500 hover:text-emerald-400 flex items-center justify-center gap-2 text-xs"
      >
        <span className="text-lg leading-none">{ICONS.plus}</span>
        Add Goal
      </button>
    </div>
  );
}

function SpikesView({ goals, projects, tasks, sessions, selectedSessionId, hoveredSessionId, setHoveredSessionId, setSelectedSessionId, dateRange, setDateRange, customRange, setCustomRange, rangeWindow, spikeMode, setSpikeMode }) {
  const rows = spikeMode === "goals"
    ? goals.map((g) => ({ id: g.id, title: g.title, type: "goal", archived: g.status === "Archived" }))
    : projects.map((p) => ({ id: p.id, title: p.title, type: "project" }));

  const allSpikes = sessions.flatMap((session) => session.spikes.map((spike) => ({ ...spike, sessionId: session.id, session })));
  const getGoalIds = (spike) => spike.goalIds || (spike.goalId ? [spike.goalId] : []);

  const inRange = (iso) => {
    const d = parseDateTime(iso);
    const isTimestamp = String(iso || "").includes("T");
    const endInclusive = isTimestamp || dateRange === "24h" ? rangeWindow.end : new Date(rangeWindow.end.getTime() + 24 * 60 * 60 * 1000 - 1);
    return d >= rangeWindow.start && d <= endInclusive;
  };

  const visibleSpikes = allSpikes.filter((spike) => inRange(getSpikeTimestamp(spike)));
  const completionSpikes = visibleSpikes.filter((spike) => spike.to === "complete");
  const activeSessionIds = new Set(visibleSpikes.map((spike) => spike.sessionId));
  const workSeconds = sessions.filter((session) => activeSessionIds.has(session.id)).reduce((sum, session) => sum + (session.lengthSeconds || 0), 0);
  const spikePoints = visibleSpikes.reduce((sum, spike) => sum + (Number(spike.weight) || 0), 0);

  const mostActiveProject = projects
    .map((project) => ({ project, points: visibleSpikes.filter((spike) => spike.projectId === project.id).reduce((sum, spike) => sum + (Number(spike.weight) || 0), 0) }))
    .sort((a, b) => b.points - a.points)[0];

  const mostAdvancedGoal = goals
    .map((goal) => ({ goal, points: visibleSpikes.filter((spike) => getGoalIds(spike).includes(goal.id)).reduce((sum, spike) => sum + (Number(spike.weight) || 0), 0) }))
    .sort((a, b) => b.points - a.points)[0];

  const ticks = dateRange === "24h"
    ? (() => {
        const axisEnd = roundUpToNextHour(rangeWindow.end);
        const axisStart = addHours(axisEnd, -24);
        return Array.from({ length: 9 }, (_, i) => {
          const tickDate = addHours(axisStart, i * 3);
          return { key: tickDate.toISOString(), label: formatTimeTick(tickDate) };
        });
      })()
    : Array.from({ length: Math.min(8, Math.max(2, rangeWindow.days)) }, (_, i) => {
        const tickCount = Math.min(8, Math.max(2, rangeWindow.days));
        const offset = Math.round((i / Math.max(1, tickCount - 1)) * Math.max(0, rangeWindow.days - 1));
        const tickDate = addDays(rangeWindow.start, offset);
        return { key: dateKey(tickDate), label: dateKey(tickDate).replaceAll("-", "_") };
      });

  const position = (iso) => {
    const d = parseDateTime(iso);
    const pct = ((d - rangeWindow.start) / Math.max(1, rangeWindow.end - rangeWindow.start)) * 100;
    return clamp(pct, 0, 100);
  };

  const setQuickRange = (range) => {
    setDateRange(range);
    if (range !== "custom" && range !== "all") {
      const map = { "24h": 1, "1w": 7, "2w": 14, "1m": 31, "3m": 92, "6m": 183 };
      const days = map[range] || 7;
      const end = range === "24h" ? nowDate() : nowDate();
      const start = range === "24h" ? addHours(end, -24) : addDays(end, -(days - 1));
      setCustomRange({ start: dateKey(start), end: dateKey(end) });
    }
  };

  const rowHasSpike = (row, spike) => row.type === "goal" ? getGoalIds(spike).includes(row.id) : spike.projectId === row.id;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-1 gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base">Workspace Spikes</h1>
          <div className="flex border border-zinc-800">
            <button onClick={() => setSpikeMode("projects")} className={cx("h-7 px-3 text-xs border-r border-zinc-800", spikeMode === "projects" ? "bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-800")}>Projects</button>
            <button onClick={() => setSpikeMode("goals")} className={cx("h-7 px-3 text-xs", spikeMode === "goals" ? "bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-800")}>Goals</button>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400 flex-wrap justify-end">
          <input type="date" value={customRange.start} onChange={(e) => { setCustomRange((r) => ({ ...r, start: e.target.value })); setDateRange("custom"); }} className="bg-zinc-900 border border-zinc-800 h-7 px-2 text-xs text-zinc-100 outline-none focus:border-emerald-700" />
          <span className="px-1">to</span>
          <input type="date" value={customRange.end} onChange={(e) => { setCustomRange((r) => ({ ...r, end: e.target.value })); setDateRange("custom"); }} className="bg-zinc-900 border border-zinc-800 h-7 px-2 text-xs text-zinc-100 outline-none focus:border-emerald-700" />
          <div className="flex flex-wrap gap-1 ml-1">
            {[["24h", "24h"], ["1w", "1w"], ["2w", "2w"], ["1m", "1m"], ["3m", "3m"], ["6m", "6m"], ["all", "all"]].map(([id, label]) => (
              <button key={id} onClick={() => setQuickRange(id)} className={cx("h-7 px-2 text-xs border border-zinc-800", dateRange === id ? "bg-emerald-700 border-emerald-600" : "bg-zinc-900 hover:bg-zinc-800")}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-6 gap-1 px-1">
        <StatCard label="Total Spikes" value={visibleSpikes.length} />
        <StatCard label="Action Potentials" value={spikePoints} />
        <StatCard label="Sessions" value={activeSessionIds.size} />
        <StatCard label="Work Time" value={formatElapsed(workSeconds)} />
        <StatCard label="Complete" value={completionSpikes.length} />
        <StatCard label={spikeMode === "goals" ? "Top Goal" : "Top Project"} value={spikeMode === "goals" ? (mostAdvancedGoal?.goal?.title || "—") : (mostActiveProject?.project?.title || "—")} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto border border-zinc-800 bg-[#151515] p-0 min-w-[850px]">
        {rows.map((row) => (
          <div key={`${row.type}-${row.id}`} className={cx("h-[58px] border-b border-zinc-800 relative", row.archived && "opacity-45 grayscale")}>
            <div className="absolute top-1 left-2 text-xs text-zinc-100 z-10 max-w-[210px] truncate">{row.title}</div>
            <div className="absolute inset-x-8 bottom-0 top-5">
              {visibleSpikes.filter((spike) => rowHasSpike(row, spike)).map((spike) => {
                const muted = hoveredSessionId && hoveredSessionId !== spike.sessionId;
                const task = tasks.find((t) => t.id === spike.taskId);
                const project = projects.find((p) => p.id === spike.projectId);
                return (
                  <button
                    key={`${row.id}-${spike.id}`}
                    onMouseEnter={() => setHoveredSessionId(spike.sessionId)}
                    onMouseLeave={() => setHoveredSessionId(null)}
                    onClick={() => setSelectedSessionId(spike.sessionId)}
                    title={`${toDisplayDate(getSpikeTimestamp(spike))} ${spike.session.startedAt}: ${task?.title || "Task"} · ${project?.title || "Project"} · ${spike.fromStatusTitle || spike.from} → ${spike.toStatusTitle || spike.to} · ϟ ${spike.weight}`}
                    className={cx("absolute bottom-0 w-[2px] bg-emerald-400 transition-all hover:w-[5px]", muted && "bg-zinc-600 opacity-40", hoveredSessionId === spike.sessionId && "bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,.7)]", selectedSessionId === spike.sessionId && "w-[4px] bg-emerald-200 shadow-[0_0_14px_rgba(52,211,153,.8)]")}
                    style={{ left: `${position(getSpikeTimestamp(spike))}%`, height: `${Math.max(1, spike.weight)}px` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="h-8 px-2 flex justify-between text-[10px] text-zinc-400 sticky bottom-0 bg-[#151515] border-t border-zinc-800">
          {ticks.map((tick) => <span key={tick.key}>{tick.label}</span>) }
        </div>
      </div>
      <div className="shrink-0 text-xs text-zinc-500 px-1">Hover a spike to foreground every spike from the same recorded session. Click a spike to inspect that session.</div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-zinc-800 bg-[#101010] px-2 py-1 min-w-0">
      <div className="text-[10px] text-zinc-500 truncate">{label}</div>
      <div className="text-xs text-zinc-100 truncate">{value}</div>
    </div>
  );
}

function LogView({ sessions, selectedSessionId, setSelectedSessionId }) {
  return (
    <div className="space-y-2">
      <h1 className="text-base px-1">Session Log</h1>
      {sessions.map((session) => (
        <button key={session.id} onClick={() => setSelectedSessionId(session.id)} className={cx("w-full border border-zinc-800 bg-[#171717] p-3 text-left hover:border-zinc-700", selectedSessionId === session.id && "border-emerald-500 bg-emerald-950/40")}>
          <div className="flex items-center justify-between"><div className="font-medium">{toDisplayDate(session.date)} · {session.startedAt}</div><div className="text-xs text-zinc-400">{formatElapsed(session.lengthSeconds || 0)}</div></div>
          <p className="mt-2 text-xs text-zinc-300">{session.note}</p>
          <div className="mt-2 text-xs text-emerald-400">{session.spikes.length} spikes recorded</div>
        </button>
      ))}
    </div>
  );
}

function DetailPane({ view, task, goal, session, completion, columns, projects, goals, tasks, onMoveTask, onEditTask, onDeleteTask, onEditGoal, onCreateSubgoal, onDeleteGoal, onEditSession, onDeleteSession }) {
  if (view === "goals") {
    return (
      <aside className="border-l border-zinc-800 bg-[#141414] p-2 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between"><h2 className="text-base">{goal?.title || "No goal"}</h2><button onClick={onEditGoal} className="text-zinc-300 hover:text-emerald-300 text-lg leading-none" title="Edit goal">{ICONS.more}</button></div>
          <p className="mt-3 text-xs leading-5 text-zinc-200">{goal?.description}</p>
          <div className="mt-4 h-3 bg-zinc-900 overflow-hidden rounded-sm border border-zinc-800"><div className={cx("h-full", goal?.status === "Archived" ? "bg-zinc-600" : "bg-emerald-600")} style={{ width: `${completion}%` }} /></div>
          <div className="mt-1 text-right text-[10px] text-zinc-300">{completion}%</div>
          <div className="mt-4 grid grid-cols-2 text-xs gap-2"><div>Created: {goal?.createdAt ? toDisplayDate(goal.createdAt) : ""}</div><div>Status: {goal?.status}</div></div>
          <div className="mt-4 text-xs text-zinc-400">Parent: {goals.find((g) => g.id === goal?.parentId)?.title || "Top-level"}</div>
        </div>
        <div className="grid grid-cols-3 gap-2"><Button onClick={onCreateSubgoal}>Subgoal</Button><Button onClick={onEditGoal}>Edit Goal</Button><Button onClick={onDeleteGoal}>Delete</Button></div>
      </aside>
    );
  }

  if (view === "spikes" || view === "log") {
    const spikeGoalIds = (spike) => spike.goalIds || (spike.goalId ? [spike.goalId] : []);
    return (
      <aside className="border-l border-zinc-800 bg-[#141414] p-2 flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="flex justify-between"><h2 className="text-base">{session?.date ? toDisplayDate(session.date) : "No session"}</h2><button onClick={onEditSession} disabled={!session} className="text-zinc-300 hover:text-emerald-300 text-lg leading-none disabled:opacity-40" title="Edit session">{ICONS.more}</button></div>
          <div className="text-xs text-zinc-400 mt-1">{formatElapsed(session?.lengthSeconds || 0)} · {session?.startedAt}</div>
          <p className="mt-4 text-xs leading-5 text-zinc-200 whitespace-pre-wrap">{session?.note || "No session notes."}</p>
          <div className="mt-4 text-xs text-emerald-400">{session?.spikes?.length || 0} spikes recorded</div>
          <div className="mt-3 space-y-1 text-xs">
            {session?.spikes?.map((spike) => {
              const taskName = tasks?.find?.((task) => task.id === spike.taskId)?.title || "Task";
              const projectName = projects?.find?.((project) => project.id === spike.projectId)?.title || "Project";
              const goalNames = spikeGoalIds(spike).map((id) => goals.find((goal) => goal.id === id)?.title).filter(Boolean).join(", ") || "No goal";
              return <div key={spike.id} className="border border-zinc-800 bg-zinc-950 p-2 leading-5"><div className="text-zinc-100">{taskName}</div><div className="text-zinc-400">{projectName}</div><div className="text-zinc-400">{goalNames}</div><div className="text-emerald-400">{toDisplayDate(getSpikeTimestamp(spike))} · {spike.fromStatusTitle || spike.from} → {spike.toStatusTitle || spike.to} · ϟ {spike.weight}px</div></div>;
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2"><Button icon={ICONS.edit} onClick={onEditSession} disabled={!session}>Edit Session</Button><Button icon={ICONS.trash} onClick={onDeleteSession} disabled={!session}>Delete Session</Button></div>
      </aside>
    );
  }

  return (
    <aside className="border-l border-zinc-800 bg-[#141414] p-2 flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="flex items-start justify-between gap-2"><div><h2 className="text-base">{task?.title || "No task"}</h2><div className="text-xs text-zinc-400">{projects.find((p) => p.id === task?.projectId)?.title}</div></div><button onClick={onEditTask} className="text-zinc-300 hover:text-emerald-300 text-lg leading-none" title="Edit task">{ICONS.more}</button></div>
        <p className="mt-4 text-xs leading-5 text-zinc-200 whitespace-pre-wrap">{task?.richText}</p>
        {task && <div className="mt-4"><div className="text-xs mb-1">Status</div><select value={task.statusId} onChange={(e) => onMoveTask(task.id, e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 h-8 px-2 text-xs">{columns.map((c) => <option key={c.id} value={c.id}>{c.title} · {c.contribution}%</option>)}</select></div>}
        <div className="mt-4 text-xs"><div className="mb-1">Goals</div><div className="space-y-1">{task?.goalIds.map((id) => <div key={id} className="border border-zinc-800 bg-zinc-950 p-2">{goals.find((g) => g.id === id)?.title}</div>)}</div></div>
        <div className="mt-4 text-xs"><div className="mb-1">Task Scratchpad (read only)</div><div className="border border-zinc-800 bg-zinc-950 p-2 text-zinc-300 whitespace-pre-wrap min-h-[48px]">{task?.scratchpad || "No task notes yet."}</div></div>
        
      </div>
      <div className="grid grid-cols-2 gap-2"><Button icon={ICONS.edit} onClick={onEditTask}>Edit Task</Button><Button icon={ICONS.trash} onClick={onDeleteTask}>Delete Task</Button></div>
    </aside>
  );
}

function BottomPanelShell({ id, children, onReorder }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ type: "bottom-panel", id }))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData("text/plain"));
          if (data.type === "bottom-panel") onReorder(data.id, id);
        } catch {}
      }}
      className="min-w-0 h-full min-h-0 cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
}

function Scratchpad({ title, value, onChange, placeholder, disabled }) {
  return <div className={cx("flex flex-col min-w-0 h-full", disabled && "opacity-45")}><div className="text-xs mb-1 flex items-center justify-between"><span>{title}</span>{disabled ? <span className="text-[10px] text-zinc-500">locked</span> : <span className="text-[10px] text-zinc-600">drag panel to reorder</span>}</div><textarea disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 resize-none bg-[#101010] border border-zinc-800 p-2 text-xs outline-none focus:border-emerald-700 placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:bg-[#0d0d0d]" /></div>;
}

function SessionTracker({ sessions, selectedSessionId, activeSession, timerSeconds, timerPaused, onStart, onCreate, onPause, onEnd, onSelect, onEdit, onDelete }) {
  return (
    <div className="flex flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between text-xs mb-1"><span>Session Tracker</span><span>{activeSession ? formatElapsed(timerSeconds) : "00:00:00"}</span></div>
      <div className="grid grid-cols-3 gap-2 mb-2"><Button onClick={onStart} disabled={!!activeSession} icon={ICONS.play}>Start Session</Button><Button onClick={onPause} disabled={!activeSession} icon={ICONS.pause}>{timerPaused ? "Resume" : "Pause"}</Button><Button onClick={onEnd} disabled={!activeSession} icon={ICONS.stop}>End Session</Button></div>
      <div className="border border-zinc-800 overflow-hidden flex-1 min-h-0"><div className="grid grid-cols-4 h-6 items-center px-2 bg-[#1a1a1a] text-xs text-zinc-300 border-b border-zinc-800"><span>Time</span><span>Date</span><span>Progress</span><span>Done</span></div><div className="overflow-auto h-[calc(100%-1.5rem)]">{sessions.map((session) => <button key={session.id} onClick={() => onSelect(session.id)} className={cx("grid grid-cols-4 w-full text-left h-5 px-2 text-xs hover:bg-zinc-800", selectedSessionId === session.id && "bg-emerald-700 hover:bg-emerald-700 text-white")}><span>{session.startedAt}</span><span>{toDisplayDate(session.date)}</span><span>{session.spikes.length}</span><span className="text-emerald-300">{session.spikes.filter((s) => s.to === "complete").length}</span></button>)}</div></div>
      <div className="grid grid-cols-3 gap-2 mt-2 shrink-0"><Button onClick={onCreate}>Create Session</Button><Button onClick={onEdit} disabled={!selectedSessionId}>Edit Session</Button><Button onClick={onDelete} disabled={!selectedSessionId}>Delete Session</Button></div>
    </div>
  );
}

function ProjectDialog({ mode, project, onSave, onClose }) {
  const [draft, setDraft] = useState(project || { id: uid(), title: "New Project", description: "" });
  return <Modal title={mode === "edit" ? "Edit Project" : "New Project"} onClose={onClose}><div className="space-y-3"><TextInput label="Project Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} /><TextInput textarea label="Project Description" value={draft.description} onChange={(description) => setDraft({ ...draft, description })} /><div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button active onClick={() => onSave(draft)}>Save Project</Button></div></div></Modal>;
}

function GoalDialog({ mode, goal, parentId, goals, onSave, onClose }) {
  const [draft, setDraft] = useState(goal || { id: uid(), title: "New Goal", description: "", createdAt: todayISO(), status: "Active", parentId: parentId || null });
  const hasDescendant = (goalId, possibleDescendantId) => {
    const children = goals.filter((item) => item.parentId === goalId);
    return children.some((child) => child.id === possibleDescendantId || hasDescendant(child.id, possibleDescendantId));
  };
  const parentOptions = goals.filter((g) => g.id !== draft.id && !hasDescendant(draft.id, g.id));
  return <Modal title={mode === "edit" ? "Edit Goal" : "New Goal"} onClose={onClose}><div className="space-y-3"><TextInput label="Goal Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} /><TextInput textarea label="Goal Description" value={draft.description} onChange={(description) => setDraft({ ...draft, description })} /><div className="grid grid-cols-2 gap-2"><SelectInput label="Status" value={draft.status} onChange={(status) => setDraft({ ...draft, status })}><option>Active</option><option>Complete</option><option>Archived</option></SelectInput><SelectInput label="Parent Goal" value={draft.parentId || ""} onChange={(parent) => setDraft({ ...draft, parentId: parent || null })}><option value="">Top-level</option>{parentOptions.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</SelectInput></div><div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button active onClick={() => onSave(draft)}>Save Goal</Button></div></div></Modal>;
}

function TaskDialog({ mode, task, statusId, projects, goals, columns, selectedProjectId, selectedGoalId, onSave, onClose }) {
  const [draft, setDraft] = useState(task || { id: uid(), title: "New Task", richText: "", statusId: statusId || "backlog", projectId: selectedProjectId, goalIds: selectedGoalId ? [selectedGoalId] : [], scratchpad: "", fields: {} });
  const toggleGoal = (id) => setDraft((d) => ({ ...d, goalIds: d.goalIds.includes(id) ? d.goalIds.filter((g) => g !== id) : [...d.goalIds, id] }));
  return <Modal title={mode === "edit" ? "Edit Task" : "New Task"} onClose={onClose} width="max-w-2xl"><div className="space-y-3"><TextInput label="Task Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} /><TextInput textarea label="Rich Text Field" value={draft.richText} onChange={(richText) => setDraft({ ...draft, richText })} /><div className="grid grid-cols-2 gap-2"><SelectInput label="Project" value={draft.projectId} onChange={(projectId) => setDraft({ ...draft, projectId })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</SelectInput><SelectInput label="Status" value={draft.statusId} onChange={(next) => setDraft({ ...draft, statusId: next })}>{columns.map((c) => <option key={c.id} value={c.id}>{c.title} · {c.contribution}%</option>)}</SelectInput></div><div><div className="text-xs text-zinc-300 mb-1">Assigned Goals</div><div className="grid grid-cols-2 gap-1 max-h-36 overflow-auto">{goals.map((g) => <button key={g.id} onClick={() => toggleGoal(g.id)} className={cx("text-left text-xs border border-zinc-800 p-2 hover:bg-zinc-800", draft.goalIds.includes(g.id) && "bg-emerald-700 border-emerald-500")}>{g.title}</button>)}</div></div><div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button active onClick={() => onSave(draft)}>Save Task</Button></div></div></Modal>;
}

function ColumnDialog({ mode, column, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(column || { id: uid(), title: "New Column", contribution: 25, spikeWeight: 1 });
  return <Modal title={mode === "edit" ? "Edit Column" : "New Column"} onClose={onClose}><div className="space-y-3"><TextInput label="Column Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} /><div className="grid grid-cols-2 gap-2"><TextInput label="Goal Contribution %" value={draft.contribution} onChange={(contribution) => setDraft({ ...draft, contribution: clamp(contribution) })} /><TextInput label="Spike Significance" value={draft.spikeWeight} onChange={(spikeWeight) => setDraft({ ...draft, spikeWeight: Math.max(0, Number(spikeWeight) || 0) })} /></div><div className="flex justify-between gap-2"><Button disabled={mode !== "edit"} onClick={() => onDelete(draft.id)}>Delete Column</Button><div className="flex gap-2"><Button onClick={onClose}>Cancel</Button><Button active onClick={() => onSave(draft)}>Save Column</Button></div></div></div></Modal>;
}

function SessionDialog({ mode = "edit", session, tasks, projects, goals, getColumnsForProject, onSave, onRecordFromHere, onClose }) {
  const [draft, setDraft] = useState(session || { id: uid(), date: todayISO(), startedAt: "00:00:00", lengthSeconds: 0, note: "", spikes: [] });
  const [spikeDraft, setSpikeDraft] = useState({
    taskId: tasks?.[0]?.id || "",
    fromStatusId: "backlog",
    toStatusId: "complete",
    createdAt: `${draft.date || todayISO()}T${draft.startedAt || "00:00:00"}`,
  });

  const spikeTask = tasks.find((task) => task.id === spikeDraft.taskId);
  const spikeColumns = getColumnsForProject?.(spikeTask?.projectId) || [];

  useEffect(() => {
    const task = tasks.find((item) => item.id === spikeDraft.taskId);
    const availableColumns = getColumnsForProject?.(task?.projectId) || [];
    if (!availableColumns.length) return;
    setSpikeDraft((current) => ({
      ...current,
      fromStatusId: availableColumns.some((column) => column.id === current.fromStatusId) ? current.fromStatusId : availableColumns[0].id,
      toStatusId: availableColumns.some((column) => column.id === current.toStatusId) ? current.toStatusId : (availableColumns.find((column) => column.id === "complete")?.id || availableColumns[0].id),
    }));
  }, [spikeDraft.taskId]);

  const addSpike = () => {
    const task = tasks.find((item) => item.id === spikeDraft.taskId);
    if (!task) return;
    const projectColumns = getColumnsForProject?.(task.projectId) || [];
    const fromColumn = projectColumns.find((column) => column.id === spikeDraft.fromStatusId);
    const toColumn = projectColumns.find((column) => column.id === spikeDraft.toStatusId);
    const createdAt = spikeDraft.createdAt || new Date().toISOString();
    const newSpike = {
      id: uid(),
      taskId: task.id,
      projectId: task.projectId,
      goalIds: task.goalIds || [],
      createdAt,
      date: createdAt.slice(0, 10),
      weight: toColumn?.spikeWeight || 1,
      fromStatusId: spikeDraft.fromStatusId,
      fromStatusTitle: fromColumn?.title || spikeDraft.fromStatusId,
      toStatusId: spikeDraft.toStatusId,
      toStatusTitle: toColumn?.title || spikeDraft.toStatusId,
      from: spikeDraft.fromStatusId,
      to: spikeDraft.toStatusId,
    };
    setDraft((current) => ({ ...current, spikes: [...(current.spikes || []), newSpike] }));
  };

  const removeSpike = (id) => setDraft((current) => ({ ...current, spikes: (current.spikes || []).filter((spike) => spike.id !== id) }));

  return (
    <Modal title={mode === "new" ? "Create Session" : "Edit Session"} onClose={onClose} width="max-w-4xl">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <TextInput label="Date" value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
          <TextInput label="Started At" value={draft.startedAt} onChange={(startedAt) => setDraft({ ...draft, startedAt })} />
          <TextInput label="Length Seconds" value={draft.lengthSeconds} onChange={(lengthSeconds) => setDraft({ ...draft, lengthSeconds: Math.max(0, Number(lengthSeconds) || 0) })} />
        </div>
        <TextInput textarea label="Session Notes" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} />

        <div className="border border-zinc-800 bg-zinc-950 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-zinc-100">Manual Spikes</div>
              <div className="text-[10px] text-zinc-500">Add a timestamped status movement to this session.</div>
            </div>
            <Button onClick={addSpike} disabled={!spikeTask}>Add Spike</Button>
          </div>
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2">
            <SelectInput label="Task" value={spikeDraft.taskId} onChange={(taskId) => setSpikeDraft({ ...spikeDraft, taskId })}>
              {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </SelectInput>
            <SelectInput label="From" value={spikeDraft.fromStatusId} onChange={(fromStatusId) => setSpikeDraft({ ...spikeDraft, fromStatusId })}>
              {spikeColumns.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
            </SelectInput>
            <SelectInput label="To" value={spikeDraft.toStatusId} onChange={(toStatusId) => setSpikeDraft({ ...spikeDraft, toStatusId })}>
              {spikeColumns.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
            </SelectInput>
            <TextInput label="Timestamp" value={spikeDraft.createdAt} onChange={(createdAt) => setSpikeDraft({ ...spikeDraft, createdAt })} />
          </div>
          <div className="max-h-40 overflow-auto space-y-1">
            {(draft.spikes || []).map((spike) => {
              const task = tasks.find((item) => item.id === spike.taskId);
              const project = projects.find((item) => item.id === spike.projectId);
              return (
                <div key={spike.id} className="grid grid-cols-[1fr_auto] gap-2 border border-zinc-800 bg-[#101010] p-2 text-xs">
                  <div className="min-w-0">
                    <div className="truncate text-zinc-100">{task?.title || "Task"}</div>
                    <div className="text-zinc-400 truncate">{project?.title || "Project"} · {spike.fromStatusTitle || spike.from} → {spike.toStatusTitle || spike.to} · {getSpikeTimestamp(spike)}</div>
                  </div>
                  <button onClick={() => removeSpike(spike.id)} className="text-zinc-400 hover:text-emerald-300">Remove</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button onClick={() => onRecordFromHere(draft)} disabled={!!session && session.id !== draft.id}>Record From Here</Button>
          <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button active onClick={() => onSave(draft)}>Save Session</Button></div>
        </div>
      </div>
    </Modal>
  );
}

function ThemesDialog({ themeId, setThemeId, onClose }) {
  return (
    <Modal title="Themes" onClose={onClose} width="max-w-2xl">
      <div className="space-y-3">
        <div>
          <div className="text-xs text-zinc-300 mb-2">Theme</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(THEMES).map((theme) => (
              <button
                key={theme.id}
                onClick={() => setThemeId(theme.id)}
                className={cx(
                  "border border-zinc-800 p-3 text-left hover:border-emerald-600",
                  themeId === theme.id && "border-emerald-500 bg-emerald-950/40"
                )}
              >
                <div className="h-10 border border-zinc-800 mb-2 flex overflow-hidden" style={{ background: theme.page }}>
                  <div className="w-1/3" style={{ background: theme.panel2 }} />
                  <div className="flex-1" style={{ background: theme.panel }} />
                  <div className="w-3" style={{ background: theme.accent }} />
                </div>
                <div className="text-sm text-zinc-100">{theme.name}</div>
                <div className="text-xs text-zinc-400 leading-5 mt-1">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-zinc-400 border border-zinc-800 bg-zinc-950 p-2">
          Theme selection is saved automatically with this browser workspace.
        </div>
        <div className="flex justify-end"><Button active onClick={onClose}>Done</Button></div>
      </div>
    </Modal>
  );
}

function HelpDialog({ topic, onClose }) {
  const copy = {
    sessions: "Sessions are recorded runs of work. Start a session when you want Spiketrain to remember what changed during a focused work period. While a session is active, task status changes become spikes, the timer records duration, and the session scratchpad stores notes for that run. Status changes made outside a session still update the board, but they do not appear as recorded productivity signals.",
    goals: "Goals calculate progress from both direct task assignments and non-archived child goals. A task contributes the percentage value of its current column: Backlog is 0%, In Progress is 50%, Complete is 100%, and custom columns can define their own values. A parent goal averages its direct task contributions with the completion values of active or complete child goals. Archived goals remain visible but no longer contribute upward.",
    spikes: "Spikes are timestamped task status-change events created during active sessions. Each spike remembers the task, project, assigned goals, previous status, new status, status titles at the time of change, and the destination column's spike significance. The Spike pane can show rows by project or by goal, with height representing significance and hover highlighting the entire session that produced the spike.",
    work: "The Work pane is the main Kanban board. Projects live in the left rail, tasks live in configurable columns, and each column defines both goal contribution and spike significance. Double-click project titles, project descriptions, column titles, percentages, or spike values to edit inline. Drag tasks between columns to reorder work or change status.",
    log: "The Log pane shows recorded sessions as a memory trail. Selecting a session reveals its duration, notes, and all spikes created during that run. Use the log to reconstruct what happened during past work periods, not just whether a task is currently done.",
  };
  return <Modal title="Help" onClose={onClose}><p className="text-sm leading-6 text-zinc-200">{copy[topic]}</p></Modal>;
}

function AboutDialog({ onClose }) {
  return <Modal title="About Spiketra.in" onClose={onClose}><p className="text-sm leading-6 text-zinc-200">Spiketrain is a local-first project management prototype for organizing work, tracking goals, and recording momentum.
Projects use a simple Kanban-style board. Tasks move through progress columns, goals summarize task progress, and sessions record meaningful task movement as “spikes.”
The idea is to make work easier to see: what moved, when it moved, and what it contributed to.</p></Modal>;
}
