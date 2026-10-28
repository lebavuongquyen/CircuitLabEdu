import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CircuitCanvas } from '@circuitlabedu/react';
import { solveCircuit } from '@circuitlabedu/core';
import { lessons as basicLessons, validateLesson } from '@circuitlabedu/exercise-pack-basic';
import './react-workbench.css';

const copy = {
  vi: { title: 'Phòng thử nghiệm React', subtitle: 'Giao diện thử nghiệm dùng core và exercise pack bên ngoài', lessons: 'Bài học nạp từ pack', circuit: 'Mạch điện', parts: 'Linh kiện', battery: 'Pin', resistor: 'Điện trở', lamp: 'Bóng đèn', switch: 'Công tắc', add: 'Thêm điện trở', reset: 'Đặt lại mạch', run: 'Chạy mô phỏng', status: 'Kết quả', current: 'Dòng điện', voltage: 'Điện áp nguồn', resistance: 'Điện trở tải', closed: 'Mạch kín', open: 'Mạch hở', selected: 'Bài đang chọn', import: 'Nạp pack JSON', importHelp: 'Chọn JSON chứa mảng lessons để thử pack bên ngoài.', valid: 'hợp lệ', invalid: 'không hợp lệ', switchOpen: 'Công tắc đang mở', switchClosed: 'Công tắc đang đóng', responsive: 'Canvas tự co giãn', source: 'Nguồn', noResult: 'Chưa chạy mô phỏng', badPack: 'Pack không hợp lệ hoặc không có bài học phù hợp.', external: 'Pack ngoài', loaded: 'Đã nạp pack ngoài' },
  en: { title: 'React UI Lab', subtitle: 'Test UI using the core and an external exercise pack', lessons: 'Lessons from pack', circuit: 'Circuit', parts: 'Components', battery: 'Battery', resistor: 'Resistor', lamp: 'Lamp', switch: 'Switch', add: 'Add resistor', reset: 'Reset circuit', run: 'Run simulation', status: 'Result', current: 'Current', voltage: 'Source voltage', resistance: 'Load resistance', closed: 'Closed circuit', open: 'Open circuit', selected: 'Selected lesson', import: 'Load JSON pack', importHelp: 'Choose JSON containing a lessons array to test an external pack.', valid: 'valid', invalid: 'invalid', switchOpen: 'Switch is open', switchClosed: 'Switch is closed', responsive: 'Responsive canvas', source: 'Source', noResult: 'Simulation not run yet', badPack: 'Invalid pack or no compatible lesson found.', external: 'External pack', loaded: 'External pack loaded' }
};

function makeCircuit(resistance = 10) {
  return {
    components: [
      { id: 'battery-1', type: 'battery', voltage: 9, x: 100, y: 200, name: '9 V' },
      { id: 'switch-1', type: 'switch', closed: true, x: 280, y: 200, name: 'S1' },
      { id: 'resistor-1', type: 'resistor', resistance, x: 460, y: 200, name: 'R1' },
      { id: 'lamp-1', type: 'lamp', resistance: 10, x: 640, y: 200, name: 'L1' }
    ],
    wires: [
      { id: 'w1', from: 'battery-1:a', to: 'switch-1:a' },
      { id: 'w2', from: 'switch-1:b', to: 'resistor-1:a' },
      { id: 'w3', from: 'resistor-1:b', to: 'lamp-1:a' },
      { id: 'w4', from: 'lamp-1:b', to: 'battery-1:b' }
    ]
  };
}

function App() {
  const [language, setLanguage] = useState('vi');
  const t = copy[language];
  const [pack, setPack] = useState({ name: '@circuitlabedu/exercise-pack-basic', lessons: basicLessons });
  const [selectedId, setSelectedId] = useState(basicLessons[0]?.id ?? '');
  const [circuit, setCircuit] = useState(() => makeCircuit());
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const selectedLesson = pack.lessons.find(item => item.id === selectedId) ?? pack.lessons[0];
  const validCount = useMemo(() => pack.lessons.filter(lesson => validateLesson(lesson).valid).length, [pack]);

  function updateComponent(id, patch) {
    setCircuit(previous => ({ ...previous, components: previous.components.map(item => item.id === id ? { ...item, ...patch } : item) }));
    setResult(null);
  }
  function runSimulation() {
    const solved = solveCircuit(circuit.components, circuit.wires);
    setResult(solved);
  }
  function resetCircuit() {
    setCircuit(makeCircuit());
    setResult(null);
    setMessage('');
  }
  async function loadPack(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const items = Array.isArray(parsed) ? parsed : parsed.lessons;
      if (!Array.isArray(items) || !items.length || items.some(item => !validateLesson(item).valid)) throw new Error('invalid pack');
      setPack({ name: file.name, lessons: items });
      setSelectedId(items[0].id);
      setMessage(t.loaded);
    } catch {
      setMessage(t.badPack);
    } finally {
      event.target.value = '';
    }
  }

  const byId = Object.fromEntries(circuit.components.map(component => [component.id, component]));
  const coords = { 'battery-1': [90, 195], 'switch-1': [280, 195], 'resistor-1': [470, 195], 'lamp-1': [660, 195] };
  const terminal = (id, side) => {
    const [x, y] = coords[id];
    return `${x + (side === 'a' ? -34 : 34)},${y}`;
  };
  const wirePath = wire => {
    const [fromId] = wire.from.split(':');
    const [toId] = wire.to.split(':');
    if (wire.id === 'w4') return `${terminal(fromId, 'b')} 750,195 750,335 90,335 ${terminal(toId, 'a')}`;
    return `${terminal(fromId, wire.from.endsWith(':a') ? 'a' : 'b')} ${terminal(toId, wire.to.endsWith(':a') ? 'a' : 'b')}`;
  };

  return <div className="app-shell">
    <header className="topbar">
      <div><div className="eyebrow">CIRCUITLABEDU · REACT</div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      <div className="top-actions"><button className="quiet" onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}>{language === 'vi' ? 'English' : 'Tiếng Việt'}</button><span className="status-chip" data-testid="pack-status">{pack.name}</span></div>
    </header>
    <main className="layout">
      <aside className="side-panel">
        <div className="section-heading"><div><span className="eyebrow">LEARNING CONTENT</span><h2>{t.lessons}</h2></div><span className="count">{validCount}/{pack.lessons.length}</span></div>
        <label className="field-label" htmlFor="lesson-select">{t.selected}</label>
        <select id="lesson-select" value={selectedId} onChange={event => setSelectedId(event.target.value)}>
          {pack.lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title[language] || lesson.title.en || lesson.id}</option>)}
        </select>
        {selectedLesson && <article className="lesson-card" data-testid="lesson-card"><span className="level-pill">{selectedLesson.level}</span><h3>{selectedLesson.title[language] || selectedLesson.title.en}</h3><p>{selectedLesson.objective[language] || selectedLesson.objective.en}</p><div className="hint-label">{t.parts}</div><div className="tag-list">{(selectedLesson.expected?.componentTypes || []).map(type => <span key={type}>{type}</span>)}</div></article>}
        <div className="import-card"><label htmlFor="pack-file">{t.import}</label><input id="pack-file" type="file" accept="application/json,.json" onChange={loadPack}/><p>{t.importHelp}</p>{message && <div role="status" className="notice">{message}</div>}</div>
        <div className="architecture-note"><strong>Decoupled content</strong><p>Exercise content is loaded as data from a package or JSON file. The core does not define the learning sequence.</p></div>
      </aside>
      <section className="workspace">
        <div className="workspace-heading"><div><span className="eyebrow">INTERACTIVE PREVIEW</span><h2>{t.circuit}</h2></div><span className="responsive-tag"><span></span>{t.responsive}</span></div>
        <div className="canvas-frame" data-testid="canvas-frame">
          <CircuitCanvas className="circuit-canvas" options={{ width: 'auto', height: 'auto', minHeight: 300, aspectRatio: 1.9, maintainAspectRatio: true, responsive: true }} ariaLabel={t.circuit}>
            {({ width, height }) => {
              const sx = width / 800; const sy = height / 420;
              const px = x => x * sx; const py = y => y * sy;
              return <g transform={`translate(0 0)`}>
                <defs><pattern id="grid" width={px(20)} height={py(20)} patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dbe4ef"/></pattern></defs>
                <rect width={width} height={height} fill="url(#grid)" />
                <g transform={`scale(${sx} ${sy})`}>
                  {circuit.wires.map(wire => <polyline key={wire.id} data-testid="wire" points={wirePath(wire)} fill="none" stroke="#64748b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>)}
                  <g transform="translate(90 195)"><circle r="24" fill="#fff" stroke="#2563eb" strokeWidth="3"/><text y="-4" textAnchor="middle" fontSize="11" fill="#1d4ed8">+</text><text y="13" textAnchor="middle" fontSize="17" fill="#1d4ed8">−</text><text y="48" textAnchor="middle" fontSize="12" fill="#475569">{t.source} 9V</text></g>
                  <g data-testid="switch-symbol" role="button" tabIndex="0" aria-label={byId['switch-1'].closed ? t.switchClosed : t.switchOpen} onClick={() => updateComponent('switch-1', { closed: !byId['switch-1'].closed })} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); updateComponent('switch-1', { closed: !byId['switch-1'].closed }); } }} className="svg-control" transform="translate(280 195)"><circle r="21" fill="#fff" stroke="#cbd5e1" strokeWidth="2"/><path d={byId['switch-1'].closed ? 'M-34 0 H34' : 'M-34 0 L22 -18'} stroke={byId['switch-1'].closed ? '#16a34a' : '#dc2626'} strokeWidth="4" strokeLinecap="round"/><text y="45" textAnchor="middle" fontSize="12" fill="#475569">S1 · {byId['switch-1'].closed ? 'ON' : 'OFF'}</text></g>
                  <g transform="translate(470 195)"><rect x="-35" y="-15" width="70" height="30" rx="4" fill="#fff" stroke="#7c3aed" strokeWidth="3"/><text y="5" textAnchor="middle" fontSize="12" fill="#6d28d9">{byId['resistor-1'].resistance}Ω</text><text y="45" textAnchor="middle" fontSize="12" fill="#475569">R1</text></g>
                  <g transform="translate(660 195)"><circle r="24" fill={result?.ok && byId['switch-1'].closed ? '#fef3c7' : '#fff'} stroke="#d97706" strokeWidth="3"/><path d="M-15 -15 L15 15 M-15 15 L15 -15" stroke="#d97706" strokeWidth="2"/><text y="45" textAnchor="middle" fontSize="12" fill="#475569">L1 · 10Ω</text></g>
                  <text x="400" y="390" textAnchor="middle" fontSize="12" fill="#64748b">Click switch to toggle · Resize the browser or panel to test canvas behavior</text>
                </g>
              </g>;
            }}
          </CircuitCanvas>
        </div>
        <div className="toolbar"><label className="resistance-control" htmlFor="resistance"><span>R1</span><input id="resistance" type="range" min="1" max="100" value={byId['resistor-1'].resistance} onChange={event => updateComponent('resistor-1', { resistance: Number(event.target.value) })}/><output data-testid="resistance-value">{byId['resistor-1'].resistance} Ω</output></label><div className="toolbar-actions"><button className="quiet" onClick={resetCircuit}>{t.reset}</button><button className="primary" onClick={runSimulation}>{t.run}</button></div></div>
        <section className="result-panel" aria-live="polite" data-testid="result-panel"><div className="section-heading"><div><span className="eyebrow">CORE SOLVER</span><h2>{t.status}</h2></div><span className={`result-pill ${result?.ok ? 'success' : ''}`} data-testid="solve-status">{result ? (result.reason === 'closed' ? t.closed : result.reason === 'open' ? t.open : result.reason) : '—'}</span></div>
          {!result ? <p className="muted" data-testid="result-empty">{t.noResult}</p> : result.ok ? <div className="metrics"><div><span>{t.voltage}</span><strong>{result.readings.voltage.toFixed(2)} V</strong></div><div><span>{t.current}</span><strong data-testid="current-value">{result.readings.current.toFixed(3)} A</strong></div><div><span>{t.resistance}</span><strong>{result.readings.resistance.toFixed(2)} Ω</strong></div></div> : <p className="error-text">{result.message || result.reason}</p>}
        </section>
      </section>
    </main>
    <footer>React UI lab · Uses <code>@circuitlabedu/core</code> and <code>@circuitlabedu/exercise-pack-basic</code> · Not a production CAD tool</footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
