export const highLessons = [
  {
    id: "ohms-law",
    schemaVersion: 1,
    level: "high",
    example: "resistor-series",
    title: { vi: "Định luật Ohm", en: "Ohm's law" },
    objective: { vi: "Dự đoán dòng điện theo I = U/R và kiểm tra bằng mô phỏng.", en: "Predict current using I = V/R and verify it in the simulation." },
    hints: { vi: ["Đọc điện áp nguồn và điện trở tổng.", "Giữ nguyên điện áp: tăng điện trở sẽ làm dòng điện giảm."], en: ["Read source voltage and total resistance.", "At fixed voltage, increasing resistance decreases current."] },
    expected: { relation: "ohms-law", tolerance: 0.01 }
  },
  {
    id: "high-meter",
    schemaVersion: 1,
    level: "high",
    example: "meter-series",
    title: { vi: "Đo dòng điện bằng ampe kế", en: "Measure current with an ammeter" },
    objective: { vi: "Đặt ampe kế nối tiếp và xem ảnh hưởng của điện trở trong mô hình.", en: "Place an ammeter in series and inspect the modeled internal resistance." },
    hints: { vi: ["Ampe kế phải nằm trên đường dòng điện cần đo.", "Không mắc ampe kế song song trực tiếp với nguồn."], en: ["Place the ammeter in the path of the current being measured.", "Do not connect an ammeter directly in parallel across the source."] },
    expected: { componentTypes: ["battery", "ammeter", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "high-rc",
    schemaVersion: 1,
    level: "high",
    example: "rc",
    title: { vi: "Nạp tụ điện trong mạch RC", en: "RC capacitor charging" },
    objective: { vi: "Quan sát điện áp tụ tăng theo thời gian khi nối với nguồn DC.", en: "Observe capacitor voltage rising over time when connected to a DC source." },
    hints: { vi: ["Chạy mô phỏng quá độ để xem đồ thị.", "Tăng R hoặc C sẽ làm đáp ứng chậm hơn."], en: ["Run transient simulation to view the chart.", "Increasing R or C makes the response slower."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor"], transientMode: "rc" }
  },
  {
    id: "high-rl",
    schemaVersion: 1,
    level: "high",
    example: "rl",
    title: { vi: "Dòng điện trong mạch RL", en: "Current rise in an RL circuit" },
    objective: { vi: "Quan sát dòng điện tăng dần khi cuộn cảm được cấp nguồn.", en: "Observe current rising as an inductor is energized." },
    hints: { vi: ["Chạy mô phỏng quá độ.", "Cuộn cảm chống lại sự thay đổi đột ngột của dòng điện."], en: ["Run transient simulation.", "An inductor opposes abrupt changes in current."] },
    expected: { componentTypes: ["battery", "resistor", "inductor"], transientMode: "rl" }
  },
  {
    id: "high-rlc",
    schemaVersion: 1,
    level: "high",
    example: "rlc",
    title: { vi: "Mạch RLC", en: "RLC circuit" },
    objective: { vi: "Khảo sát đáp ứng quá độ của mạch có R, L và C.", en: "Explore the transient response of a circuit containing R, L and C." },
    hints: { vi: ["Quan sát đồ thị điện áp tụ hoặc dòng cuộn cảm.", "Thử thay đổi R để thấy đáp ứng thay đổi."], en: ["Observe capacitor voltage or inductor current on the chart.", "Change R to see how the response changes."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor", "inductor"], transientMode: "rlc" }
  },
  {
    id: "high-ac-resistor",
    schemaVersion: 1,
    level: "high",
    example: "ac-resistor",
    title: { vi: "Nguồn xoay chiều và điện trở", en: "AC source and resistor" },
    objective: { vi: "Quan sát điện áp và dòng điện đổi dấu theo chu kỳ của nguồn AC.", en: "Observe voltage and current reversing over an AC cycle." },
    hints: { vi: ["Chạy mô phỏng quá độ và xem đồ thị nguồn.", "Tăng tần số để quan sát nhiều chu kỳ trong cùng khoảng thời gian."], en: ["Run transient simulation and inspect the source waveform.", "Increase frequency to fit more cycles into the same duration."] },
    expected: { componentTypes: ["acSource", "resistor"], transientMode: "ac" }
  },
  {
    id: "high-ac-rc",
    schemaVersion: 1,
    level: "high",
    example: "ac-rc",
    title: { vi: "Mạch RC với nguồn AC", en: "AC-driven RC circuit" },
    objective: { vi: "Khảo sát điện áp trên tụ khi được kích thích bởi nguồn hình sin.", en: "Explore capacitor voltage under sinusoidal excitation." },
    hints: { vi: ["Chạy mô phỏng quá độ.", "Thử thay đổi tần số hoặc điện dung để so sánh đáp ứng."], en: ["Run transient simulation.", "Change frequency or capacitance to compare responses."] },
    expected: { componentTypes: ["acSource", "resistor", "capacitor"], transientMode: "ac-rc" }
  },
  {
    id: "high-parallel-branch",
    schemaVersion: 1,
    level: "high",
    example: "switch-branch",
    title: { vi: "Phân tích sự cố một nhánh", en: "One branch fault analysis" },
    objective: { vi: "Mở một nhánh tải và quan sát nhánh còn lại trong mạch song song.", en: "Open one load branch and observe the remaining parallel branch." },
    hints: { vi: ["Chỉ mở công tắc trên một nhánh.", "Đường dòng điện của nhánh còn lại phải vẫn kín."], en: ["Open only the switch on one branch.", "The other branch must still have a complete path."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "high-power",
    schemaVersion: 1,
    level: "high",
    example: "power-loads",
    title: { vi: "So sánh công suất tải", en: "Compare load power" },
    objective: { vi: "So sánh công suất tiêu thụ khi tải mắc theo cấu hình khác nhau.", en: "Compare load power in different circuit configurations." },
    hints: { vi: ["Chọn từng tải để xem điện áp, dòng điện và công suất.", "Công suất tải phụ thuộc cả dòng điện và điện áp trên tải."], en: ["Select each load to inspect voltage, current and power.", "Load power depends on both current and voltage across it."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "high-rc-time-constant",
    schemaVersion: 1,
    level: "high",
    example: "rc",
    title: { vi: "Hằng số thời gian RC", en: "RC time constant" },
    objective: { vi: "Khảo sát ý nghĩa vật lý của hằng số thời gian tau = R * C trong quá trình nạp tụ.", en: "Investigate physical significance of time constant tau = R * C during capacitor charging." },
    hints: { vi: ["Hằng số tau đặc trưng cho tốc độ biến thiên điện áp trên tụ điện.", "Sau thời gian t = tau, điện áp trên tụ đạt khoảng 63% điện áp nguồn."], en: ["The constant tau characterizes the rate of voltage change across the capacitor.", "At t = tau, capacitor voltage reaches approximately 63% of source voltage."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor"], transientMode: "rc" }
  },
  {
    id: "high-rl-time-constant",
    schemaVersion: 1,
    level: "high",
    example: "rl",
    title: { vi: "Hằng số thời gian RL", en: "RL time constant" },
    objective: { vi: "Khảo sát hằng số thời gian tau = L / R và hiện tượng tự cảm trong cuộn dây.", en: "Investigate time constant tau = L / R and self-induction in the inductor." },
    hints: { vi: ["Hiện tượng tự cảm sinh ra suất điện động chống lại sự tăng của dòng điện.", "Hằng số thời gian tau = L/R xác định thời gian để dòng đạt 63% giá trị cực đại."], en: ["Self-induction produces an emf opposing the increase in current.", "Time constant tau = L/R determines time to reach 63% of maximum current."] },
    expected: { componentTypes: ["battery", "resistor", "inductor"], transientMode: "rl" }
  },
  {
    id: "high-rlc-damping",
    schemaVersion: 1,
    level: "high",
    example: "rlc",
    title: { vi: "Sự tắt dần dao động trong mạch RLC", en: "Damping in RLC circuits" },
    objective: { vi: "Khảo sát ảnh hưởng của điện trở R đến mức độ tiêu tán năng lượng trong dao động RLC.", en: "Explore the effect of resistance R on energy dissipation in RLC oscillations." },
    hints: { vi: ["Điện trở tiêu hao năng lượng điện từ dưới dạng nhiệt lượng Joule.", "R càng lớn thì biên độ dao động suy giảm càng nhanh."], en: ["The resistor dissipates electromagnetic energy as Joule heat.", "A larger R causes oscillations to decay more rapidly."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor", "inductor"], transientMode: "rlc" }
  },
  {
    id: "high-rlc-energy-exchange",
    schemaVersion: 1,
    level: "high",
    example: "rlc",
    title: { vi: "Trao đổi năng lượng điện từ trong RLC", en: "Electromagnetic energy exchange in RLC" },
    objective: { vi: "Quan sát sự chuyển hóa tuần hoàn giữa năng lượng điện trường và từ trường.", en: "Observe cyclic conversion between electric and magnetic field energies." },
    hints: { vi: ["Năng lượng điện trường tập trung ở tụ điện: Wc = 0.5 * C * U^2.", "Năng lượng từ trường tập trung ở cuộn cảm: Wl = 0.5 * L * I^2."], en: ["Electric field energy resides in the capacitor: Wc = 0.5 * C * V^2.", "Magnetic field energy resides in the inductor: Wl = 0.5 * L * I^2."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor", "inductor"], transientMode: "rlc" }
  },
  {
    id: "high-ac-frequency",
    schemaVersion: 1,
    level: "high",
    example: "ac-resistor",
    title: { vi: "Tần số của dòng điện xoay chiều", en: "AC sinusoidal frequency" },
    objective: { vi: "Khảo sát số chu kỳ dao động trong một giây của nguồn xoay chiều.", en: "Investigate the number of cycles per second of an alternating source." },
    hints: { vi: ["Nguồn xoay chiều f = 50 Hz có chu kỳ T = 1/50 = 0.02 giây.", "Chạy mô phỏng quá độ để quan sát đồ thị điện áp hình sin theo thời gian."], en: ["A 50 Hz AC source has period T = 1/50 = 0.02 seconds.", "Run transient simulation to observe the sinusoidal voltage waveform."] },
    expected: { componentTypes: ["acSource", "resistor"], transientMode: "ac" }
  },
  {
    id: "high-ac-period",
    schemaVersion: 1,
    level: "high",
    example: "ac-resistor",
    title: { vi: "Chu kỳ và pha ban đầu của nguồn AC", en: "Period and initial phase of AC source" },
    objective: { vi: "Khảo sát biểu thức u = U0 * cos(omega * t + phi) của nguồn xoay chiều.", en: "Explore the expression v = V0 * cos(omega * t + phi) of an AC voltage source." },
    hints: { vi: ["Tần số góc omega = 2 * pi * f.", "Điện áp tức thời biến thiên điều hòa theo thời gian giữa -U0 và +U0."], en: ["Angular frequency omega = 2 * pi * f.", "Instantaneous voltage alternates harmonically between -V0 and +V0."] },
    expected: { componentTypes: ["acSource", "resistor"], transientMode: "ac" }
  },
  {
    id: "high-ac-amplitude",
    schemaVersion: 1,
    level: "high",
    example: "ac-resistor",
    title: { vi: "Biên độ đỉnh của điện áp xoay chiều", en: "Peak amplitude of AC voltage" },
    objective: { vi: "Phân biệt giá trị biên độ cực đại U0 và giá trị hiệu dụng U = U0 / sqrt(2).", en: "Distinguish peak amplitude V0 from root-mean-square value Vrms = V0 / sqrt(2)." },
    hints: { vi: ["Biên độ đỉnh là giá trị điện áp lớn nhất mà nguồn đạt được trong chu kỳ.", "Hiệu dụng phản ánh tác dụng nhiệt tương đương của dòng xoay chiều so với DC."], en: ["Peak amplitude is the maximum voltage magnitude achieved in a cycle.", "RMS reflects equivalent heating effect compared to direct current."] },
    expected: { componentTypes: ["acSource", "resistor"], transientMode: "ac" }
  },
  {
    id: "high-ac-rc-reactance",
    schemaVersion: 1,
    level: "high",
    example: "ac-rc",
    title: { vi: "Dung kháng của tụ điện trong mạch AC", en: "Capacitive reactance in AC circuit" },
    objective: { vi: "Khảo sát dung kháng Zc = 1 / (omega * C) cản trở dòng xoay chiều.", en: "Explore capacitive reactance Xc = 1 / (omega * C) opposing AC current." },
    hints: { vi: ["Tần số càng cao thì dung kháng Zc càng nhỏ, tụ dẫn dòng xoay chiều càng tốt.", "Quan sát biên độ điện áp trên tụ khi thay đổi tần số nguồn."], en: ["Higher frequencies yield lower reactance Xc, allowing easier AC passage.", "Observe capacitor voltage amplitude under varying source frequencies."] },
    expected: { componentTypes: ["acSource", "resistor", "capacitor"], transientMode: "ac-rc" }
  },
  {
    id: "high-ac-rc-phase-shift",
    schemaVersion: 1,
    level: "high",
    example: "ac-rc",
    title: { vi: "Độ lệch pha trong mạch AC-RC", en: "Phase shift in AC-RC circuit" },
    objective: { vi: "Khảo sát hiện tượng dòng điện sớm pha hơn điện áp trên tụ điện một góc pi/2.", en: "Investigate current leading capacitor voltage by a phase angle of pi/2." },
    hints: { vi: ["Tụ điện cần thời gian nạp điện tích nên điện áp trên tụ biến thiên chậm pha hơn dòng điện.", "So sánh thời điểm đạt đỉnh của dạng sóng nguồn và điện áp tụ."], en: ["Charge accumulation takes time, causing capacitor voltage to lag current.", "Compare the peak timings of the source waveform and capacitor voltage."] },
    expected: { componentTypes: ["acSource", "resistor", "capacitor"], transientMode: "ac-rc" }
  },
  {
    id: "high-rc-charging-curve",
    schemaVersion: 1,
    level: "high",
    example: "rc",
    title: { vi: "Đường cong nạp điện của tụ", en: "Capacitor charging curve" },
    objective: { vi: "Khảo sát biểu thức hàm mũ uC(t) = E * (1 - e^(-t / RC)) khi nạp điện từ nguồn DC.", en: "Explore exponential function vC(t) = E * (1 - e^(-t / RC)) during DC charging." },
    hints: { vi: ["Ở thời điểm t = 0, điện áp trên tụ bằng 0.", "Khi t tiến đến vô cùng, điện áp tụ tiệm cận điện áp nguồn 9V."], en: ["At t = 0, capacitor voltage is zero.", "As t approaches infinity, capacitor voltage asymptotically approaches 9V."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor"], transientMode: "rc" }
  },
  {
    id: "high-rl-current-ramp",
    schemaVersion: 1,
    level: "high",
    example: "rl",
    title: { vi: "Đường cong tăng dòng trong mạch RL", en: "Inductor current ramp curve" },
    objective: { vi: "Khảo sát biểu thức hàm mũ i(t) = (E/R) * (1 - e^(-t * R / L)) khi đóng mạch RL.", en: "Explore exponential function i(t) = (E/R) * (1 - e^(-t * R / L)) upon RL switch closure." },
    hints: { vi: ["Dòng điện không thể biến thiên đột ngột qua cuộn cảm do quán tính từ.", "Dòng điện tăng dần từ 0 đến giá trị bão hòa E/R."], en: ["Current cannot change abruptly through an inductor due to magnetic inertia.", "Current ramps smoothly from zero toward saturation level E/R."] },
    expected: { componentTypes: ["battery", "resistor", "inductor"], transientMode: "rl" }
  },
  {
    id: "high-energy-conservation-dc",
    schemaVersion: 1,
    level: "high",
    example: "resistor-series",
    title: { vi: "Bảo toàn công suất trong mạch điện một chiều", en: "DC power balance conservation" },
    objective: { vi: "Xác nhận công suất phát từ nguồn bằng tổng công suất tiêu thụ trên mọi phần tử tải.", en: "Confirm source delivered power equals total power dissipated across all loads." },
    hints: { vi: ["P_nguồn = E * I_tổng.", "Tổng P_tải = sum(U_k * I_k). Hai giá trị này phải cân bằng nhau."], en: ["P_source = E * I_total.", "Total load power equals sum(V_k * I_k). Both values must balance."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "high-wheatstone-bridge",
    schemaVersion: 1,
    level: "high",
    example: "resistor-series",
    title: { vi: "Nguyên lý cầu đo Wheatstone", en: "Wheatstone bridge principle" },
    objective: { vi: "Khảo sát điều kiện cân bằng cầu điện trở để đo lường chính xác.", en: "Investigate bridge balance conditions for precision electrical measurements." },
    hints: { vi: ["Cầu cân bằng khi tỷ số các cặp điện trở đối xứng bằng nhau.", "Khi đó hiệu điện thế giữa hai nút chéo bằng 0."], en: ["The bridge is balanced when opposite resistor ratios match.", "Under balance, voltage difference between cross nodes is zero."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "high-meter-loading-effect",
    schemaVersion: 1,
    level: "high",
    example: "meter-series",
    title: { vi: "Ảnh hưởng của thiết bị đo lên mạch", en: "Meter loading effect on circuits" },
    objective: { vi: "Khảo sát sai số do nội trở hữu hạn của ampe kế đưa vào mạch đo.", en: "Investigate errors introduced by finite ammeter internal resistance." },
    hints: { vi: ["Một ampe kế thực tế luôn có nội trở nhỏ nhưng khác 0.", "Nội trở này làm tăng điện trở tổng và làm giảm nhẹ dòng điện cần đo."], en: ["A practical ammeter possesses small but non-zero internal resistance.", "This resistance slightly increases total circuit impedance."] },
    expected: { componentTypes: ["battery", "ammeter", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "high-voltage-divider-loading",
    schemaVersion: 1,
    level: "high",
    example: "mixed-network",
    title: { vi: "Ảnh hưởng của tải lên bộ chia áp", en: "Loaded voltage divider analysis" },
    objective: { vi: "Khảo sát sụt giảm điện áp đầu ra khi mắc thêm điện trở tải vào bộ chia áp.", en: "Examine output voltage drop when connecting a load resistor across a divider." },
    hints: { vi: ["Điện trở tải mắc song song với R2 làm giảm điện trở nhánh dưới.", "Sụt áp trên nhánh dưới do đó bị giảm so với trạng thái không tải."], en: ["Load resistance in parallel with R2 reduces the lower branch resistance.", "Consequently, output voltage drops relative to unloaded operation."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "high-max-power-transfer",
    schemaVersion: 1,
    level: "high",
    example: "power-loads",
    title: { vi: "Định lý truyền công suất cực đại", en: "Maximum power transfer theorem" },
    objective: { vi: "Khảo sát điều kiện để công suất tiêu thụ trên tải đạt giá trị lớn nhất.", en: "Examine conditions under which load power consumption reaches maximum." },
    hints: { vi: ["Công suất trên tải đạt cực đại khi điện trở tải bằng nội trở nguồn.", "Quan sát công suất tiêu thụ trên các tải khác nhau trong mạch."], en: ["Load power is maximized when load resistance equals source internal resistance.", "Inspect power dissipated across different loads in the circuit."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "high-ac-sine-inspection",
    schemaVersion: 1,
    level: "high",
    example: "ac-resistor",
    title: { vi: "Khảo sát dạng sóng tức thời AC", en: "AC instantaneous waveform inspection" },
    objective: { vi: "Phân tích đồ thị điện áp tức thời và xác nhận sự đảo dấu tuần hoàn.", en: "Analyze instantaneous voltage plots and confirm periodic polarity reversal." },
    hints: { vi: ["Nửa chu kỳ dương điện thế chân A cao hơn chân B.", "Nửa chu kỳ âm điện thế đổi chiều, dòng điện chảy ngược lại."], en: ["During the positive half-cycle, terminal A is positive relative to B.", "During the negative half-cycle, polarity and current reverse."] },
    expected: { componentTypes: ["acSource", "resistor"], transientMode: "ac" }
  },
  {
    id: "high-ac-low-pass-filter",
    schemaVersion: 1,
    level: "high",
    example: "ac-rc",
    title: { vi: "Mạch lọc thông thấp RC tần số cao", en: "RC low-pass filter at high frequency" },
    objective: { vi: "Khảo sát sự suy giảm biên độ tín hiệu đầu ra trên tụ khi tăng tần số.", en: "Examine output signal attenuation across capacitor as frequency increases." },
    hints: { vi: ["Ở tần số cao, dung kháng của tụ rất nhỏ làm ngắn mạch tín hiệu AC.", "Tín hiệu ra trên tụ bị suy giảm mạnh ở dải tần số cao."], en: ["At high frequencies, low capacitor reactance shunts AC signals.", "Output voltage across the capacitor attenuates significantly."] },
    expected: { componentTypes: ["acSource", "resistor", "capacitor"], transientMode: "ac-rc" }
  },
  {
    id: "high-rlc-step-response",
    schemaVersion: 1,
    level: "high",
    example: "rlc",
    title: { vi: "Đáp ứng bước nhảy của mạch RLC", en: "RLC step response" },
    objective: { vi: "Khảo sát quá trình chuyển tiếp từ t=0 đến trạng thái xác lập trong mạch RLC.", en: "Explore transient transition from t=0 to steady state in an RLC network." },
    hints: { vi: ["Khi cấp nguồn DC đột ngột, mạch trải qua giai đoạn dao động quá độ.", "Sau khi quá độ kết thúc, tụ điện tích đầy và ngắt dòng một chiều."], en: ["Applying sudden DC voltage triggers a transient oscillation phase.", "After settling, the capacitor is fully charged and blocks DC current."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor", "inductor"], transientMode: "rlc" }
  },
  {
    id: "high-ac-reactive-energy",
    schemaVersion: 1,
    level: "high",
    example: "ac-rc",
    title: { vi: "Năng lượng phản kháng trong mạch AC-RC", en: "Reactive energy in AC-RC circuit" },
    objective: { vi: "Khảo sát công suất phản kháng và sự trao đổi năng lượng giữa nguồn và tụ.", en: "Investigate reactive power and cyclic energy exchange between source and capacitor." },
    hints: { vi: ["Tụ điện nạp năng lượng trong một phần chu kỳ và trả lại cho nguồn ở phần chu kỳ sau.", "Công suất trung bình tiêu thụ bởi tụ điện lý tưởng bằng 0."], en: ["The capacitor stores energy during part of the cycle and returns it later.", "Average power consumed by an ideal capacitor over a full cycle is zero."] },
    expected: { componentTypes: ["acSource", "resistor", "capacitor"], transientMode: "ac-rc" }
  },
  {
    id: "high-transient-settling",
    schemaVersion: 1,
    level: "high",
    example: "rc",
    title: { vi: "Thời gian xác lập của mạch quá độ", en: "Transient settling time" },
    objective: { vi: "Đánh giá thời gian cần thiết để mạch điện đạt trạng thái ổn định lâu dài.", en: "Evaluate the time required for a transient circuit to reach steady state." },
    hints: { vi: ["Quy tắc thực nghiệm: sau khoảng thời gian t = 4 * tau đến 5 * tau, quá độ kết thúc.", "Điện áp và dòng điện sau đó duy trì ở giá trị xác lập."], en: ["Rule of thumb: transients subside after t = 4 * tau to 5 * tau.", "Voltages and currents subsequently remain at steady-state values."] },
    expected: { componentTypes: ["battery", "resistor", "capacitor"], transientMode: "rc" }
  }
];
