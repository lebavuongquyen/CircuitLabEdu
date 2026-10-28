import { validateCircuit } from "@circuitlabedu/core/solver";

export const lessons = [
  {
    id: "closed-loop", schemaVersion: 1, level: "primary", example: "simple",
    title: { vi: "1. Thắp sáng bóng đèn", en: "1. Light the bulb" },
    objective: { vi: "Tạo mạch kín từ pin qua công tắc và bóng đèn. Quan sát điều kiện để có dòng điện.", en: "Build a closed path through a battery, switch and bulb; observe when current can flow." },
    hints: { vi: ["Mạch cần một đường đi liên tục qua tải rồi trở về cực còn lại của pin.", "Đóng công tắc và nối đủ cả hai chân của từng linh kiện."], en: ["Current needs a complete path through the load and back to the other battery terminal.", "Close the switch and connect both terminals of every component."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "series-vs-parallel", schemaVersion: 1, level: "middle", example: "series",
    title: { vi: "So sánh nối tiếp và song song", en: "Compare series and parallel" },
    objective: { vi: "Chạy hai cấu hình nối tiếp/song song để so sánh dòng điện tổng.", en: "Run both series and parallel configurations and compare total current." },
    hints: { vi: ["Chạy lần lượt hai bài mẫu nối tiếp và song song.", "Hai bóng giống nhau mắc song song thường có điện trở tương đương thấp hơn."], en: ["Run both the series and parallel sample circuits.", "Two identical parallel bulbs usually have lower equivalent resistance."] },
    expected: { comparison: "series-parallel-current" }
  },
  {
    id: "ohms-law", schemaVersion: 1, level: "high", example: "resistor-series",
    title: { vi: "Định luật Ohm", en: "Ohm's law" },
    objective: { vi: "Dự đoán dòng điện theo I = U/R và kiểm tra bằng mô phỏng.", en: "Predict current using I = V/R and verify it in the simulation." },
    hints: { vi: ["Đọc điện áp nguồn và điện trở tổng.", "Giữ nguyên điện áp: tăng điện trở sẽ làm dòng điện giảm."], en: ["Read source voltage and total resistance.", "At fixed voltage, increasing resistance decreases current."] },
    expected: { relation: "ohms-law", tolerance: 0.01 }
  },
  {
    id: "primary-open-switch", schemaVersion: 1, level: "primary", example: "open-switch",
    title: { vi: "Công tắc đóng và mở", en: "Open and closed switch" },
    objective: { vi: "So sánh cùng một mạch khi công tắc đóng và mở.", en: "Compare the same circuit with the switch closed and open." },
    hints: { vi: ["Nhấp vào công tắc để đổi trạng thái.", "Khi công tắc mở, đường dẫn bị ngắt."], en: ["Click the switch to change its state.", "An open switch breaks the conducting path."] },
    expected: { componentTypes: ["battery", "switch", "lamp"] }
  },
  {
    id: "primary-conductors", schemaVersion: 1, level: "primary", example: "two-lamps-series",
    title: { vi: "Hai bóng đèn nối tiếp", en: "Two bulbs in series" },
    objective: { vi: "Quan sát hai bóng nằm trên cùng một đường dòng điện.", en: "Observe two bulbs on the same current path." },
    hints: { vi: ["Trong mạch nối tiếp, cùng một dòng điện đi qua mỗi linh kiện.", "Thêm tải nối tiếp làm tăng điện trở tổng."], en: ["The same current passes through each series component.", "Adding a series load increases total resistance."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-parallel", schemaVersion: 1, level: "primary", example: "parallel",
    title: { vi: "Hai nhánh đèn song song", en: "Two parallel bulb branches" },
    objective: { vi: "Nhận biết mạch phân nhánh và quan sát dòng tổng.", en: "Recognize a branched circuit and observe total current." },
    hints: { vi: ["Mỗi bóng nằm trên một nhánh riêng.", "Dòng tổng bằng tổng dòng điện qua các nhánh."], en: ["Each bulb sits on its own branch.", "Total current is the sum of branch currents."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-series-resistors", schemaVersion: 1, level: "middle", example: "resistor-series",
    title: { vi: "Điện trở mắc nối tiếp", en: "Resistors in series" },
    objective: { vi: "Kiểm tra điện trở tương đương bằng tổng các điện trở nối tiếp.", en: "Verify that series equivalent resistance is the sum of resistances." },
    hints: { vi: ["Chọn từng điện trở để xem giá trị.", "Điện trở tổng của nhánh nối tiếp tăng khi thêm điện trở."], en: ["Select each resistor to inspect its value.", "Adding a resistor in series increases total resistance."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-parallel-resistors", schemaVersion: 1, level: "middle", example: "parallel-resistors",
    title: { vi: "Điện trở mắc song song", en: "Resistors in parallel" },
    objective: { vi: "So sánh điện trở tương đương và dòng điện của các nhánh.", en: "Compare equivalent resistance and branch currents." },
    hints: { vi: ["Các điện trở song song cùng nối giữa hai nút.", "Điện trở tương đương nhỏ hơn điện trở nhánh nhỏ nhất."], en: ["Parallel resistors connect across the same two nodes.", "Equivalent resistance is lower than the smallest branch resistance."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-series-switches", schemaVersion: 1, level: "middle", example: "two-switch-series",
    title: { vi: "Hai công tắc nối tiếp", en: "Two series switches" },
    objective: { vi: "Tìm hiểu vì sao một công tắc mở có thể ngắt toàn bộ nhánh nối tiếp.", en: "Learn why one open switch can interrupt an entire series path." },
    hints: { vi: ["Thử mở từng công tắc rồi đóng lại.", "Dòng chỉ chạy khi cả hai công tắc đều đóng."], en: ["Open each switch in turn, then close it again.", "Current flows only when both switches are closed."] },
    expected: { componentTypes: ["battery", "switch", "lamp"] }
  },
  {
    id: "middle-parallel-switches", schemaVersion: 1, level: "middle", example: "parallel-switches",
    title: { vi: "Công tắc điều khiển từng nhánh", en: "Independent branch switches" },
    objective: { vi: "Mỗi công tắc điều khiển một nhánh đèn song song độc lập.", en: "Each switch controls an independent parallel bulb branch." },
    hints: { vi: ["Đóng hoặc mở một công tắc tại một thời điểm.", "Nhánh còn lại vẫn có thể dẫn dòng nếu đường của nó còn kín."], en: ["Toggle one switch at a time.", "The other branch can still conduct if its path remains closed."] },
    expected: { componentTypes: ["battery", "switch", "lamp"] }
  },
  {
    id: "middle-mixed-network", schemaVersion: 1, level: "middle", example: "mixed-network",
    title: { vi: "Mạch hỗn hợp", en: "Mixed series-parallel circuit" },
    objective: { vi: "Phân tích một điện trở nối tiếp với hai nhánh tải song song.", en: "Analyze a series resistor feeding two parallel load branches." },
    hints: { vi: ["Tìm phần nối tiếp trước, rồi xác định hai nhánh song song.", "Dòng qua điện trở chính bằng tổng dòng hai nhánh."], en: ["Identify the series section first, then the two parallel branches.", "Current through the main resistor equals the sum of branch currents."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-voltage-divider", schemaVersion: 1, level: "middle", example: "voltage-divider",
    title: { vi: "Bộ chia điện áp", en: "Voltage divider" },
    objective: { vi: "Quan sát điện áp trên hai điện trở nối tiếp.", en: "Observe voltage across two series resistors." },
    hints: { vi: ["Điện áp nguồn được chia giữa các điện trở theo giá trị của chúng.", "Tổng sụt áp xấp xỉ điện áp nguồn trong mô hình này."], en: ["Source voltage divides across series resistors according to their values.", "The sum of voltage drops is approximately the source voltage in this model."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "high-meter", schemaVersion: 1, level: "high", example: "meter-series",
    title: { vi: "Đo dòng điện bằng ampe kế", en: "Measure current with an ammeter" },
    objective: { vi: "Đặt ampe kế nối tiếp và xem ảnh hưởng của điện trở trong mô hình.", en: "Place an ammeter in series and inspect the modeled internal resistance." },
    hints: { vi: ["Ampe kế phải nằm trên đường dòng điện cần đo.", "Không mắc ampe kế song song trực tiếp với nguồn."], en: ["Place the ammeter in the path of the current being measured.", "Do not connect an ammeter directly in parallel across the source."] },
    expected: { componentTypes: ["battery", "ammeter", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "high-rc", schemaVersion: 1, level: "high", example: "rc",
    title: { vi: "Nạp tụ điện trong mạch RC", en: "RC capacitor charging" },
    objective: { vi: "Quan sát điện áp tụ tăng theo thời gian khi nối với nguồn DC.", en: "Observe capacitor voltage rising over time when connected to a DC source." },
    hints: { vi: ["Chạy mô phỏng quá độ để xem đồ thị.", "Tăng R hoặc C sẽ làm đáp ứng chậm hơn."], en: ["Run transient simulation to view the chart.", "Increasing R or C makes the response slower."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor"], transientMode: "rc" }
  },
  {
    id: "high-rl", schemaVersion: 1, level: "high", example: "rl",
    title: { vi: "Dòng điện trong mạch RL", en: "Current rise in an RL circuit" },
    objective: { vi: "Quan sát dòng điện tăng dần khi cuộn cảm được cấp nguồn.", en: "Observe current rising as an inductor is energized." },
    hints: { vi: ["Chạy mô phỏng quá độ.", "Cuộn cảm chống lại sự thay đổi đột ngột của dòng điện."], en: ["Run transient simulation.", "An inductor opposes abrupt changes in current."] },
    expected: { componentTypes: ["battery", "resistor", "inductor"], transientMode: "rl" }
  },
  {
    id: "high-rlc", schemaVersion: 1, level: "high", example: "rlc",
    title: { vi: "Mạch RLC", en: "RLC circuit" },
    objective: { vi: "Khảo sát đáp ứng quá độ của mạch có R, L và C.", en: "Explore the transient response of a circuit containing R, L and C." },
    hints: { vi: ["Quan sát đồ thị điện áp tụ hoặc dòng cuộn cảm.", "Thử thay đổi R để thấy đáp ứng thay đổi."], en: ["Observe capacitor voltage or inductor current on the chart.", "Change R to see how the response changes."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor", "inductor"], transientMode: "rlc" }
  },
  {
    id: "high-ac-resistor", schemaVersion: 1, level: "high", example: "ac-resistor",
    title: { vi: "Nguồn xoay chiều và điện trở", en: "AC source and resistor" },
    objective: { vi: "Quan sát điện áp và dòng điện đổi dấu theo chu kỳ của nguồn AC.", en: "Observe voltage and current reversing over an AC cycle." },
    hints: { vi: ["Chạy mô phỏng quá độ và xem đồ thị nguồn.", "Tăng tần số để quan sát nhiều chu kỳ trong cùng khoảng thời gian."], en: ["Run transient simulation and inspect the source waveform.", "Increase frequency to fit more cycles into the same duration."] },
    expected: { componentTypes: ["acSource", "resistor"], transientMode: "ac" }
  },
  {
    id: "high-ac-rc", schemaVersion: 1, level: "high", example: "ac-rc",
    title: { vi: "Mạch RC với nguồn AC", en: "AC-driven RC circuit" },
    objective: { vi: "Khảo sát điện áp trên tụ khi được kích thích bởi nguồn hình sin.", en: "Explore capacitor voltage under sinusoidal excitation." },
    hints: { vi: ["Chạy mô phỏng quá độ.", "Thử thay đổi tần số hoặc điện dung để so sánh đáp ứng."], en: ["Run transient simulation.", "Change frequency or capacitance to compare responses."] },
    expected: { componentTypes: ["acSource", "resistor", "capacitor"], transientMode: "ac-rc" }
  },
  {
    id: "high-parallel-branch", schemaVersion: 1, level: "high", example: "switch-branch",
    title: { vi: "Phân tích sự cố một nhánh", en: "One branch fault analysis" },
    objective: { vi: "Mở một nhánh tải và quan sát nhánh còn lại trong mạch song song.", en: "Open one load branch and observe the remaining parallel branch." },
    hints: { vi: ["Chỉ mở công tắc trên một nhánh.", "Đường dòng điện của nhánh còn lại phải vẫn kín."], en: ["Open only the switch on one branch.", "The other branch must still have a complete path."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "high-power", schemaVersion: 1, level: "high", example: "power-loads",
    title: { vi: "So sánh công suất tải", en: "Compare load power" },
    objective: { vi: "So sánh công suất tiêu thụ khi tải mắc theo cấu hình khác nhau.", en: "Compare load power in different circuit configurations." },
    hints: { vi: ["Chọn từng tải để xem điện áp, dòng điện và công suất.", "Công suất tải phụ thuộc cả dòng điện và điện áp trên tải."], en: ["Select each load to inspect voltage, current and power.", "Load power depends on both current and voltage across it."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  }
];

export function validateLesson(lesson) {
  if (!lesson || lesson.schemaVersion !== 1 || typeof lesson.id !== "string" || !/^[a-z0-9][a-z0-9-]{1,63}$/i.test(lesson.id) || !["primary", "middle", "high"].includes(lesson.level)) return { valid: false, reason: "invalid-metadata" };
  if (!lesson.title || typeof lesson.title.vi !== "string" || typeof lesson.title.en !== "string" || !lesson.title.vi.trim() || !lesson.title.en.trim()) return { valid: false, reason: "missing-localized-title" };
  if (!lesson.objective || typeof lesson.objective.vi !== "string" || typeof lesson.objective.en !== "string" || !lesson.objective.vi.trim() || !lesson.objective.en.trim()) return { valid: false, reason: "missing-localized-objective" };
  if (lesson.hints !== undefined && (!lesson.hints || !Array.isArray(lesson.hints.vi) || !Array.isArray(lesson.hints.en) || lesson.hints.vi.length > 10 || lesson.hints.en.length > 10 || [...lesson.hints.vi, ...lesson.hints.en].some(hint => typeof hint !== "string" || hint.length > 500))) return { valid: false, reason: "invalid-hints" };
  if (lesson.startingCircuit !== undefined) {
    const start = lesson.startingCircuit;
    if (!start || start.schemaVersion !== 1 || !Array.isArray(start.components) || !Array.isArray(start.wires) || (start.junctions !== undefined && !Array.isArray(start.junctions)) || start.components.length > 500 || start.wires.length > 2000 || (start.junctions || []).length > 1000) return { valid: false, reason: "invalid-starting-circuit" };
    if (start.components.some(c => !c || typeof c.id !== "string" || !["battery", "acSource", "lamp", "resistor", "switch", "ammeter", "voltmeter", "capacitor", "inductor"].includes(c.type) || !Number.isFinite(c.x) || !Number.isFinite(c.y) || c.x < 0 || c.x > 900 || c.y < 0 || c.y > 510)) return { valid: false, reason: "invalid-starting-component" };
    if ((start.junctions || []).some(j => !j || !Number.isFinite(j.x) || !Number.isFinite(j.y) || j.x < 0 || j.x > 900 || j.y < 0 || j.y > 510)) return { valid: false, reason: "invalid-starting-junction" };
    const circuitValidation = validateCircuit(start.components, start.wires, start.junctions || []);
    if (!circuitValidation.valid) return { valid: false, reason: "invalid-starting-topology" };
  }
  if (!lesson.expected || typeof lesson.expected !== "object" || Array.isArray(lesson.expected)) return { valid: false, reason: "missing-expectations" };
  const allowed = new Set(["componentTypes", "requireClosedCircuit", "relation", "tolerance", "minCurrent", "maxCurrent", "targetVoltage", "targetResistance", "comparison", "transientMode"]);
  if (Object.keys(lesson.expected).some(key => !allowed.has(key)) || Object.keys(lesson.expected).length === 0) return { valid: false, reason: "unsupported-expectation" };
  const e = lesson.expected;
  if (e.componentTypes !== undefined && (!Array.isArray(e.componentTypes) || e.componentTypes.length === 0 || e.componentTypes.some(type => !["battery", "acSource", "lamp", "resistor", "switch", "ammeter", "voltmeter", "capacitor", "inductor"].includes(type)))) return { valid: false, reason: "invalid-component-requirement" };
  if (e.requireClosedCircuit !== undefined && typeof e.requireClosedCircuit !== "boolean") return { valid: false, reason: "invalid-closed-circuit-rule" };
  if (e.relation !== undefined && e.relation !== "ohms-law") return { valid: false, reason: "unsupported-relation" };
  if (e.comparison !== undefined && e.comparison !== "series-parallel-current") return { valid: false, reason: "unsupported-comparison" };
  if (e.transientMode !== undefined && !["rc", "rl", "rlc", "ac", "ac-rc"].includes(e.transientMode)) return { valid: false, reason: "unsupported-transient-mode" };
  for (const key of ["tolerance", "minCurrent", "maxCurrent", "targetVoltage", "targetResistance"]) {
    if (e[key] !== undefined && (!Number.isFinite(e[key]) || e[key] < 0)) return { valid: false, reason: "invalid-numeric-expectation" };
  }
  if (e.minCurrent !== undefined && e.maxCurrent !== undefined && e.minCurrent > e.maxCurrent) return { valid: false, reason: "invalid-current-range" };
  if (!e.componentTypes && !e.requireClosedCircuit && !e.relation && !e.comparison && !e.transientMode && e.minCurrent === undefined && e.maxCurrent === undefined && e.targetVoltage === undefined && e.targetResistance === undefined) return { valid: false, reason: "empty-expectations" };
  return { valid: true };
}

export function assessCircuit(lesson, result, components = []) {
  const schema = validateLesson(lesson);
  if (!schema.valid) return { passed: false, reason: schema.reason };
  if (!result || !result.ok) return { passed: false, reason: "circuit-not-solved" };
  const expected = lesson.expected;
  if (expected.transientMode && result.mode !== expected.transientMode) return { passed: false, reason: "transient-mode-mismatch" };
  if (expected.comparison) return { passed: result.comparisonPassed === true, reason: result.comparisonPassed === true ? "passed" : "comparison-requires-two-scenarios" };
  if (expected.componentTypes && expected.componentTypes.some(type => !components.some(component => component.type === type))) return { passed: false, reason: "required-components-missing" };
  if (expected.requireClosedCircuit && result.reason !== "closed") return { passed: false, reason: "circuit-not-closed" };
  const r = result.readings;
  if (r?.summaryValid === false && (expected.relation || expected.minCurrent !== undefined || expected.maxCurrent !== undefined || expected.targetVoltage !== undefined || expected.targetResistance !== undefined)) return { passed: false, reason: "aggregate-measurement-undefined" };
  if (expected.relation === "ohms-law") {
    if (!r) return { passed: false, reason: "missing-readings" };
    const error = Math.abs(r.current * r.resistance - r.voltage);
    if (error > (expected.tolerance ?? 0.01)) return { passed: false, reason: "ohms-law-mismatch" };
  }
  if (r && expected.minCurrent !== undefined && r.current < expected.minCurrent) return { passed: false, reason: "current-below-target" };
  if (r && expected.maxCurrent !== undefined && r.current > expected.maxCurrent) return { passed: false, reason: "current-above-target" };
  if (r && expected.targetVoltage !== undefined && Math.abs(r.voltage - expected.targetVoltage) > (expected.tolerance ?? 0.01)) return { passed: false, reason: "voltage-mismatch" };
  if (r && expected.targetResistance !== undefined && Math.abs(r.resistance - expected.targetResistance) > (expected.tolerance ?? 0.01)) return { passed: false, reason: "resistance-mismatch" };
  return { passed: true, reason: "passed" };
}
