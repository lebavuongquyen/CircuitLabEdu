import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CircuitCanvas } from '@circuitlabedu/react';
import { solveCircuit, simulateTransient } from '@circuitlabedu/core';
import { lessons as basicLessons, validateLesson, assessCircuit } from '@circuitlabedu/exercise-pack-basic';
import './styles.css';

const copy = {
  vi: { title: 'Phòng thử nghiệm React', subtitle: 'Giao diện thử nghiệm dùng core và exercise pack bên ngoài', lessons: 'Bài học nạp từ pack', circuit: 'Mạch điện', parts: 'Linh kiện', battery: 'Pin', resistor: 'Điện trở', lamp: 'Bóng đèn', switch: 'Công tắc', add: 'Thêm điện trở', reset: 'Đặt lại mạch', run: 'Chạy mô phỏng', status: 'Kết quả', current: 'Dòng điện', voltage: 'Điện áp nguồn', resistance: 'Điện trở tải', closed: 'Mạch kín', open: 'Mạch hở', selected: 'Bài đang chọn', import: 'Nạp pack JSON', importHelp: 'Chọn JSON chứa mảng lessons để thử pack bên ngoài.', valid: 'hợp lệ', invalid: 'không hợp lệ', switchOpen: 'Công tắc đang mở', switchClosed: 'Công tắc đang đóng', responsive: 'Canvas tự co giãn', source: 'Nguồn', noResult: 'Chưa chạy mô phỏng', badPack: 'Pack không hợp lệ hoặc không có bài học phù hợp.', external: 'Pack ngoài', loaded: 'Đã nạp pack ngoài' },
  en: { title: 'React UI Lab', subtitle: 'Test UI using the core and an external exercise pack', lessons: 'Lessons from pack', circuit: 'Circuit', parts: 'Components', battery: 'Battery', resistor: 'Resistor', lamp: 'Lamp', switch: 'Switch', add: 'Add resistor', reset: 'Reset circuit', run: 'Run simulation', status: 'Result', current: 'Current', voltage: 'Source voltage', resistance: 'Load resistance', closed: 'Closed circuit', open: 'Open circuit', selected: 'Selected lesson', import: 'Load JSON pack', importHelp: 'Choose JSON containing a lessons array to test an external pack.', valid: 'valid', invalid: 'invalid', switchOpen: 'Switch is open', switchClosed: 'Switch is closed', responsive: 'Responsive canvas', source: 'Source', noResult: 'Simulation not run yet', badPack: 'Invalid pack or no compatible lesson found.', external: 'External pack', loaded: 'External pack loaded' }
};

function buildLessonCircuit(lesson) {
  if (lesson?.startingCircuit) return JSON.parse(JSON.stringify(lesson.startingCircuit));
  const example = lesson?.example || 'simple';
  const components = [];
  const wires = [];
  const sourceType = example === 'ac-resistor' || example === 'ac-rc' ? 'acSource' : 'battery';
  const source = { id: 'source-1', type: sourceType, x: 100, y: 255, voltage: 9, amplitude: 5, frequency: 50, phase: 0, offset: 0, name: sourceType === 'battery' ? '9 V' : 'AC 5 V' };
  components.push(source);
  let seq = 0;
  const add = (type, x, y, props = {}) => {
    const defaults = { battery: { voltage: 9 }, acSource: { amplitude: 5, frequency: 50, phase: 0, offset: 0 }, switch: { closed: true }, resistor: { resistance: 100 }, lamp: { resistance: 6 }, capacitor: { capacitance: 0.00001, initialVoltage: 0 }, inductor: { inductance: 0.1, initialCurrent: 0 }, ammeter: {}, voltmeter: {} };
    const c = { id: type + '-' + (++seq), type, x, y, ...(defaults[type] || {}), ...props };
    components.push(c); return c;
  };
  const wire = (from, to) => wires.push({ id: 'wire-' + (wires.length + 1), from, to });
  const series = (types, props = []) => {
    const parts = types.map((type, i) => add(type, 290 + i * Math.min(150, 500 / Math.max(1, types.length)), 255, props[i] || {}));
    if (!parts.length) return;
    wire(source.id + ':a', parts[0].id + ':a');
    for (let i = 1; i < parts.length; i++) wire(parts[i - 1].id + ':b', parts[i].id + ':a');
    wire(parts[parts.length - 1].id + ':b', source.id + ':b');
  };
  if (['parallel', 'parallel-resistors', 'parallel-switches', 'switch-branch', 'mixed-network', 'power-loads'].includes(example)) {
    const mixed = example === 'mixed-network';
    const switched = example === 'parallel-switches' || example === 'switch-branch';
    const feed = mixed ? add('resistor', 280, 255, { resistance: 100, name: 'R1' }) : source;
    if (mixed) wire(source.id + ':a', feed.id + ':a');
    const types = example === 'parallel-resistors' ? ['resistor', 'resistor'] : example === 'power-loads' ? ['resistor', 'lamp'] : ['lamp', 'lamp'];
    [155, 355].forEach((y, i) => {
      const sw = switched ? add('switch', 430, y, { closed: true, name: 'S' + (i + 1) }) : null;
      const load = add(types[i], switched ? 620 : 500, y, { ...(types[i] === 'resistor' ? { resistance: i ? 200 : 100 } : {}), name: (types[i] === 'resistor' ? 'R' : 'L') + (i + 1) });
      const branchFrom = mixed ? feed.id + ':b' : source.id + ':a';
      if (sw) { wire(branchFrom, sw.id + ':a'); wire(sw.id + ':b', load.id + ':a'); }
      else wire(branchFrom, load.id + ':a');
      wire(load.id + ':b', source.id + ':b');
    });
  } else if (example === 'series' || example === 'two-lamps-series') series(['lamp', 'lamp'], [{ name: 'L1' }, { name: 'L2' }]);
  else if (example === 'two-switch-series') series(['switch', 'switch', 'lamp'], [{ name: 'S1' }, { name: 'S2' }, { name: 'L1' }]);
  else if (example === 'resistor-series' || example === 'voltage-divider') series(['resistor', 'resistor'], [{ resistance: 100, name: 'R1' }, { resistance: 200, name: 'R2' }]);
  else if (example === 'meter-series') series(['ammeter', 'resistor'], [{ name: 'A1' }, { resistance: 100, name: 'R1' }]);
  else if (example === 'rc') series(['resistor', 'capacitor'], [{ resistance: 1000 }, { capacitance: 0.00001, initialVoltage: 0 }]);
  else if (example === 'rl') series(['resistor', 'inductor'], [{ resistance: 100 }, { inductance: 0.1, initialCurrent: 0 }]);
  else if (example === 'rlc') series(['resistor', 'capacitor', 'inductor'], [{ resistance: 100 }, { capacitance: 0.00001, initialVoltage: 0 }, { inductance: 0.1, initialCurrent: 0 }]);
  else if (example === 'ac-resistor') series(['resistor'], [{ resistance: 100 }]);
  else if (example === 'ac-rc') series(['resistor', 'capacitor'], [{ resistance: 1000 }, { capacitance: 0.00001, initialVoltage: 0 }]);
  else series(['switch', 'lamp'], [{ closed: example !== 'open-switch', name: 'S1' }, { name: 'L1' }]);
  return { schemaVersion: 1, components, wires, junctions: [] };
}
function getLessonCircuit(lesson) {
  if (lesson?.startingCircuit) return JSON.parse(JSON.stringify(lesson.startingCircuit));
  return buildLessonCircuit(lesson);
}

function App() {
  const [language, setLanguage] = useState('vi');
  const t = copy[language];
  const [pack, setPack] = useState({ name: '@circuitlabedu/exercise-pack-basic', lessons: basicLessons });
  const [selectedId, setSelectedId] = useState(basicLessons[0]?.id ?? '');
  const [circuit, setCircuit] = useState(() => getLessonCircuit(basicLessons[0]));
  const [selectedComponentId, setSelectedComponentId] = useState(() => getLessonCircuit(basicLessons[0]).components.find(component => ['resistor', 'lamp'].includes(component.type))?.id ?? getLessonCircuit(basicLessons[0]).components[0]?.id ?? '');
  const [assessment, setAssessment] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const selectedLesson = pack.lessons.find(item => item.id === selectedId) ?? pack.lessons[0];
  const byId = Object.fromEntries(circuit.components.map(component => [component.id, component]));
  const selectedComponent = byId[selectedComponentId] ?? circuit.components[0];
  function selectLesson(id, currentPack = pack) { const lesson = currentPack.lessons.find(item => item.id === id) ?? currentPack.lessons[0]; if (!lesson) return; const next = getLessonCircuit(lesson); setSelectedId(lesson.id); setCircuit(next); setSelectedComponentId(next.components.find(component => ['resistor', 'lamp'].includes(component.type))?.id ?? next.components[0]?.id ?? ''); setResult(null); setAssessment(null); setMessage(''); }
  const validCount = useMemo(() => pack.lessons.filter(lesson => validateLesson(lesson).valid).length, [pack]);

  function updateComponent(id, patch) {
    setCircuit(previous => ({ ...previous, components: previous.components.map(item => item.id === id ? { ...item, ...patch } : item) }));
    setResult(null); setAssessment(null);
  }
  function runSimulation() {
    const solved = solveCircuit(circuit.components, circuit.wires, circuit.junctions || []);
    if (solved.reason === 'transient-required') {
      const transient = simulateTransient(circuit.components, circuit.wires, { duration: 0.1, step: 0.0001 }, circuit.junctions || []);
      const hasAc = circuit.components.some(component => component.type === 'acSource');
      const hasCapacitor = circuit.components.some(component => component.type === 'capacitor');
      const hasInductor = circuit.components.some(component => component.type === 'inductor');
      const mode = hasAc ? (hasCapacitor ? 'ac-rc' : 'ac') : (hasCapacitor && hasInductor ? 'rlc' : hasCapacitor ? 'rc' : 'rl');
      setResult(transient.ok ? { ...transient, mode, readings: { voltage: transient.samples?.at(-1)?.voltage ?? null, current: transient.samples?.at(-1)?.current ?? null, resistance: null } } : transient);
    } else setResult(solved);
    setAssessment(null);
  }
  function resetCircuit() {
    const next = getLessonCircuit(selectedLesson); setCircuit(next); setSelectedComponentId(next.components.find(component => ['resistor', 'lamp'].includes(component.type))?.id ?? next.components[0]?.id ?? '');
    setResult(null); setAssessment(null);
    setMessage('');
  }
  async function loadPack(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const items = Array.isArray(parsed) ? parsed : parsed?.lessons;
      if (!Array.isArray(items) || !items.length || items.some(item => !validateLesson(item).valid)) throw new Error('invalid pack');
      const ids = new Set(items.map(item => item.id));
      if (ids.size !== items.length) throw new Error('duplicate lesson ids');
      if (new Set(items.map(item => item.id)).size !== items.length) throw new Error('duplicate lesson ids');
      const nextPack = { name: file.name, lessons: items }; setPack(nextPack); selectLesson(items[0].id, nextPack);
      setMessage(t.loaded);
    } catch {
      setMessage(t.badPack);
    } finally {
      event.target.value = '';
    }
  }



  return <div className="app-shell">
    <header className="topbar">
      <div><div className="eyebrow">CIRCUITLABEDU · REACT</div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      <div className="top-actions"><button className="quiet" onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}>{language === 'vi' ? 'English' : 'Tiếng Việt'}</button><span className="status-chip" data-testid="pack-status">{pack.name}</span></div>
    </header>
    <main className="layout">
      <aside className="side-panel">
        <div className="section-heading"><div><span className="eyebrow">LEARNING CONTENT</span><h2>{t.lessons}</h2></div><span className="count">{validCount}/{pack.lessons.length}</span></div>
        <label className="field-label" htmlFor="lesson-select">{t.selected}</label>
        <select id="lesson-select" value={selectedId} onChange={event => selectLesson(event.target.value)}>
          {pack.lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title[language] || lesson.title.en || lesson.id}</option>)}
        </select>
        {selectedLesson && <article className="lesson-card" data-testid="lesson-card"><span className="level-pill">{selectedLesson.level}</span><h3>{selectedLesson.title[language] || selectedLesson.title.en}</h3><p>{selectedLesson.objective[language] || selectedLesson.objective.en}</p><div className="hint-label">{t.parts}</div><div className="tag-list">{(selectedLesson.expected?.componentTypes || []).map(type => <span key={type}>{type}</span>)}</div></article>}
        <div className="import-card"><label htmlFor="pack-file">{t.import}</label><input id="pack-file" type="file" accept="application/json,.json" onChange={loadPack}/><p>{t.importHelp}</p>{message && <div role="status" className="notice">{message}</div>}</div>
        <div className="architecture-note"><strong>Decoupled content</strong><p>Exercise content is loaded as data from a package or JSON file. The core does not define the learning sequence.</p></div>
      </aside>
      <section className="workspace">
        <div className="workspace-heading"><div><span className="eyebrow">INTERACTIVE PREVIEW</span><h2>{t.circuit}</h2></div><span className="responsive-tag"><span></span>{t.responsive}</span></div>
        <div className="canvas-frame" data-testid="canvas-frame">
          <CircuitCanvas className="circuit-canvas" options={{ width: 'auto', height: 'auto', minHeight: 300, aspectRatio: 900 / 510, maintainAspectRatio: true, responsive: true }} ariaLabel={t.circuit}>
            {({ width, height }) => {
              const terminalPoint = (component, side) => { const sign = side === 'a' ? -34 : 34; const angle = (component.rotation || 0) * Math.PI / 180; return { x: component.x + sign * Math.cos(angle), y: component.y + sign * Math.sin(angle) }; };
              const point = key => { const parts = key.split(':'); const c = byId[parts[0]]; if (c) return terminalPoint(c, parts[1]); const j = (circuit.junctions || []).find(item => item.id === parts[1]); return j ? { x: j.x, y: j.y } : null; };
              const wirePath = wire => { const a = point(wire.from), b = point(wire.to); if (!a || !b) return ''; const mid = (a.x + b.x) / 2; return a.x + ',' + a.y + ' ' + mid + ',' + a.y + ' ' + mid + ',' + b.y + ' ' + b.x + ',' + b.y; };
              const draw = c => { const selected = c.id === selectedComponentId; const sw = c.type === 'switch'; const label = c.name || c.id; const detail = c.type === 'battery' ? (c.voltage ?? 9) + ' V' : c.type === 'acSource' ? (c.amplitude ?? 5) + ' Vpk' : c.type === 'capacitor' ? ((c.capacitance ?? 0.00001) * 1e6) + ' µF' : c.type === 'inductor' ? ((c.inductance ?? 0.1) * 1000) + ' mH' : ['resistor','lamp'].includes(c.type) ? (c.resistance ?? 10) + ' Ω' : sw ? (c.closed ? 'ON' : 'OFF') : c.type.toUpperCase(); const shape = c.type === 'battery' ? <><circle r="24" fill="#fff" stroke="#2563eb" strokeWidth="3"/><text y="5" textAnchor="middle" fontSize="15" fill="#2563eb">±</text></> : c.type === 'acSource' ? <><circle r="24" fill="#fff" stroke="#2563eb" strokeWidth="3"/><path d="M-15 0 C-8 -15,0 -15,0 0 S8 15,15 0" fill="none" stroke="#2563eb" strokeWidth="2"/></> : sw ? <><circle r="21" fill="#fff" stroke="#cbd5e1" strokeWidth="2"/><path d={c.closed ? 'M-34 0 H34' : 'M-34 0 L22 -18'} stroke={c.closed ? '#16a34a' : '#dc2626'} strokeWidth="4"/></> : c.type === 'resistor' ? <rect x="-29" y="-14" width="58" height="28" rx="4" fill="#fff" stroke="#7c3aed" strokeWidth="3"/> : c.type === 'lamp' ? <><circle r="23" fill={result?.ok ? '#fef3c7' : '#fff'} stroke="#d97706" strokeWidth="3"/><path d="M-14 -14 L14 14 M-14 14 L14 -14" stroke="#d97706" strokeWidth="2"/></> : c.type === 'capacitor' ? <path d="M-8 -22 V22 M8 -22 V22" stroke="#0891b2" strokeWidth="4"/> : c.type === 'inductor' ? <path d="M-34 0 H-24 C-24 -20 -8 -20 -8 0 C-8 -20 8 -20 8 0 C8 -20 24 -20 24 0 H34" fill="none" stroke="#0f766e" strokeWidth="3"/> : <><circle r="22" fill="#fff" stroke="#64748b" strokeWidth="3"/><text y="6" textAnchor="middle" fontSize="16">{c.type === 'ammeter' ? 'A' : 'V'}</text></>; return <g key={c.id} transform={'translate(' + c.x + ' ' + c.y + ') rotate(' + (c.rotation || 0) + ')'} role="button" tabIndex="0" data-testid={c.type + '-symbol'} aria-label={sw ? (c.closed ? t.switchClosed : t.switchOpen) : label} className={'svg-control ' + (selected ? 'component-selected' : '')} onClick={() => sw ? updateComponent(c.id, { closed: !c.closed }) : setSelectedComponentId(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sw ? updateComponent(c.id, { closed: !c.closed }) : setSelectedComponentId(c.id); } }}><rect className="hit-area" x="-42" y="-32" width="84" height="64" fill="transparent"/><path d="M-35 0 H-27 M27 0 H35" stroke="#64748b" strokeWidth="3"/>{shape}<text y="43" textAnchor="middle" fontSize="12" fill="#334155">{label}</text><text y="58" textAnchor="middle" fontSize="11" fill="#64748b">{detail}</text></g>; };
              return <g transform={'scale(' + (width / 900) + ' ' + (height / 510) + ')'}><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dbe4ef"/></pattern></defs><rect width="900" height="510" fill="url(#grid)"/>
                  {circuit.wires.map(wire => <polyline key={wire.id} data-testid="wire" points={wirePath(wire)} fill="none" stroke="#64748b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>)}
                  {(circuit.junctions || []).map(j => <circle key={j.id} cx={j.x} cy={j.y} r="5" fill="#334155" data-testid="junction"/>)}
                  {circuit.components.map(draw)}
              </g>;
            }}
          </CircuitCanvas>
        </div>
        <div className="toolbar"><label className="resistance-control" htmlFor="resistance"><span data-testid="selected-component-label">{selectedComponent?.name || selectedComponent?.id || (language === 'vi' ? 'Chưa có linh kiện' : 'No component selected')}</span><input id="resistance" aria-label="Selected component value" type="range" min="1" max="1000" value={!selectedComponent ? 1 : selectedComponent.type === 'battery' ? selectedComponent.voltage ?? 9 : selectedComponent.type === 'acSource' ? selectedComponent.amplitude ?? 5 : selectedComponent.type === 'capacitor' ? Math.round((selectedComponent.capacitance ?? 0.00001) * 1e6) : selectedComponent.type === 'inductor' ? Math.round((selectedComponent.inductance ?? 0.1) * 1000) : selectedComponent.resistance ?? 10} disabled={!selectedComponent || !['resistor', 'lamp', 'battery', 'acSource', 'capacitor', 'inductor'].includes(selectedComponent.type)} onChange={event => { if (!selectedComponent) return; const value = Number(event.target.value); const patch = selectedComponent.type === 'battery' ? { voltage: value } : selectedComponent.type === 'acSource' ? { amplitude: value } : selectedComponent.type === 'capacitor' ? { capacitance: value / 1e6 } : selectedComponent.type === 'inductor' ? { inductance: value / 1000 } : { resistance: value }; updateComponent(selectedComponent.id, patch); }}/><output data-testid="resistance-value">{!selectedComponent ? '—' : selectedComponent.type === 'battery' ? selectedComponent.voltage + ' V' : selectedComponent.type === 'acSource' ? selectedComponent.amplitude + ' Vpk' : selectedComponent.type === 'capacitor' ? Math.round(selectedComponent.capacitance * 1e6) + ' µF' : selectedComponent.type === 'inductor' ? Math.round(selectedComponent.inductance * 1000) + ' mH' : selectedComponent.resistance ?? '—'} {selectedComponent && ['resistor', 'lamp'].includes(selectedComponent.type) ? 'Ω' : ''}</output></label><div className="toolbar-actions"><button className="quiet" onClick={resetCircuit}>{t.reset}</button><button className="primary" onClick={runSimulation}>{t.run}</button><button className="quiet" onClick={() => { const solved = result || solveCircuit(circuit.components, circuit.wires, circuit.junctions || []); setAssessment(assessCircuit(selectedLesson, solved, circuit.components)); }}>{language === 'vi' ? 'Kiểm tra yêu cầu' : 'Assess lesson'}</button></div></div>
        <section className="result-panel" aria-live="polite" data-testid="result-panel"><div className="section-heading"><div><span className="eyebrow">CORE SOLVER</span><h2>{t.status}</h2></div><span className={`result-pill ${result?.ok ? 'success' : ''}`} data-testid="solve-status">{result ? (result.reason === 'closed' ? t.closed : result.reason === 'open' ? t.open : result.reason) : '—'}</span></div>
          {!result ? <p className="muted" data-testid="result-empty">{t.noResult}</p> : result.ok ? <div className="metrics"><div><span>{t.voltage}</span><strong>{Number.isFinite(result.readings?.voltage) ? result.readings.voltage.toFixed(2) : '—'} V</strong></div><div><span>{t.current}</span><strong data-testid="current-value">{Number.isFinite(result.readings?.current) ? result.readings.current.toFixed(3) : '—'} A</strong></div><div><span>{t.resistance}</span><strong>{Number.isFinite(result.readings?.resistance) ? result.readings.resistance.toFixed(2) : '—'} Ω</strong></div></div> : <p className="error-text">{result.message || result.reason}</p>}
          {assessment && <p className={assessment.passed ? 'notice' : 'error-text'} data-testid="assessment-result">{assessment.passed ? (language === 'vi' ? 'Đạt yêu cầu bài học' : 'Lesson requirements met') : (language === 'vi' ? 'Chưa đạt: ' : 'Not yet: ') + assessment.reason}</p>}
        </section>
      </section>
    </main>
    <footer>React UI lab · Uses <code>@circuitlabedu/core</code> and <code>@circuitlabedu/exercise-pack-basic</code> · Not a production CAD tool</footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
