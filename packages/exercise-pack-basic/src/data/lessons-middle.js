export const middleLessons = [
  {
    id: "series-vs-parallel",
    schemaVersion: 1,
    level: "middle",
    example: "series",
    title: { vi: "So sánh nối tiếp và song song", en: "Compare series and parallel" },
    objective: { vi: "Chạy hai cấu hình nối tiếp/song song để so sánh dòng điện tổng.", en: "Run both series and parallel configurations and compare total current." },
    hints: { vi: ["Chạy lần lượt hai bài mẫu nối tiếp và song song.", "Hai bóng giống nhau mắc song song thường có điện trở tương đương thấp hơn."], en: ["Run both the series and parallel sample circuits.", "Two identical parallel bulbs usually have lower equivalent resistance."] },
    expected: { comparison: "series-parallel-current" }
  },
  {
    id: "middle-series-resistors",
    schemaVersion: 1,
    level: "middle",
    example: "resistor-series",
    title: { vi: "Điện trở mắc nối tiếp", en: "Resistors in series" },
    objective: { vi: "Kiểm tra điện trở tương đương bằng tổng các điện trở nối tiếp.", en: "Verify that series equivalent resistance is the sum of resistances." },
    hints: { vi: ["Chọn từng điện trở để xem giá trị.", "Điện trở tổng của nhánh nối tiếp tăng khi thêm điện trở."], en: ["Select each resistor to inspect its value.", "Adding a resistor in series increases total resistance."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-parallel-resistors",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-resistors",
    title: { vi: "Điện trở mắc song song", en: "Resistors in parallel" },
    objective: { vi: "So sánh điện trở tương đương và dòng điện của các nhánh.", en: "Compare equivalent resistance and branch currents." },
    hints: { vi: ["Các điện trở song song cùng nối giữa hai nút.", "Điện trở tương đương nhỏ hơn điện trở nhánh nhỏ nhất."], en: ["Parallel resistors connect across the same two nodes.", "Equivalent resistance is lower than the smallest branch resistance."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-series-switches",
    schemaVersion: 1,
    level: "middle",
    example: "two-switch-series",
    title: { vi: "Hai công tắc nối tiếp", en: "Two series switches" },
    objective: { vi: "Tìm hiểu vì sao một công tắc mở có thể ngắt toàn bộ nhánh nối tiếp.", en: "Learn why one open switch can interrupt an entire series path." },
    hints: { vi: ["Thử mở từng công tắc rồi đóng lại.", "Dòng chỉ chạy khi cả hai công tắc đều đóng."], en: ["Open each switch in turn, then close it again.", "Current flows only when both switches are closed."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-parallel-switches",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-switches",
    title: { vi: "Công tắc điều khiển từng nhánh", en: "Independent branch switches" },
    objective: { vi: "Mỗi công tắc điều khiển một nhánh đèn song song độc lập.", en: "Each switch controls an independent parallel bulb branch." },
    hints: { vi: ["Đóng hoặc mở một công tắc tại một thời điểm.", "Nhánh còn lại vẫn có thể dẫn dòng nếu đường của nó còn kín."], en: ["Toggle one switch at a time.", "The other branch can still conduct if its path remains closed."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-mixed-network",
    schemaVersion: 1,
    level: "middle",
    example: "mixed-network",
    title: { vi: "Mạch hỗn hợp", en: "Mixed series-parallel circuit" },
    objective: { vi: "Phân tích một điện trở nối tiếp với hai nhánh tải song song.", en: "Analyze a series resistor feeding two parallel load branches." },
    hints: { vi: ["Tìm phần nối tiếp trước, rồi xác định hai nhánh song song.", "Dòng qua điện trở chính bằng tổng dòng hai nhánh."], en: ["Identify the series section first, then the two parallel branches.", "Current through the main resistor equals the sum of branch currents."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-voltage-divider",
    schemaVersion: 1,
    level: "middle",
    example: "voltage-divider",
    title: { vi: "Bộ chia điện áp", en: "Voltage divider" },
    objective: { vi: "Quan sát điện áp trên hai điện trở nối tiếp.", en: "Observe voltage across two series resistors." },
    hints: { vi: ["Điện áp nguồn được chia giữa các điện trở theo giá trị của chúng.", "Tổng sụt áp xấp xỉ điện áp nguồn trong mô hình này."], en: ["Source voltage divides across series resistors according to their values.", "The sum of voltage drops is approximately the source voltage in this model."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-ohms-law-verify",
    schemaVersion: 1,
    level: "middle",
    example: "resistor-series",
    title: { vi: "Nghiệm lại định luật Ohm", en: "Verify Ohm's law" },
    objective: { vi: "Kiểm tra hệ thức I = U / R trên đoạn mạch có điện trở thuần.", en: "Verify the relation I = V / R across a purely resistive circuit." },
    hints: { vi: ["Đọc điện áp nguồn 9V và điện trở tương đương của mạch.", "Tính tỷ số U/R và so sánh với giá trị ampe kế đo được."], en: ["Read source voltage 9V and total equivalent resistance.", "Compute V/R and compare with the measured current."] },
    expected: { relation: "ohms-law", tolerance: 0.01 }
  },
  {
    id: "middle-current-measurement",
    schemaVersion: 1,
    level: "middle",
    example: "meter-series",
    title: { vi: "Đo dòng điện bằng ampe kế", en: "Measure current with an ammeter" },
    objective: { vi: "Thực hành mắc ampe kế nối tiếp với điện trở để đo cường độ dòng điện.", en: "Practice placing an ammeter in series with a resistor to measure current." },
    hints: { vi: ["Ampe kế phải mắc nối tiếp để toàn bộ dòng điện chạy xuyên qua nó.", "Nội trở của ampe kế rất nhỏ nên không ảnh hưởng đáng kể đến mạch."], en: ["The ammeter must be in series so all current flows through it.", "Its very small internal resistance does not significantly alter the circuit."] },
    expected: { componentTypes: ["battery", "ammeter", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-voltage-measurement",
    schemaVersion: 1,
    level: "middle",
    example: "voltage-divider",
    title: { vi: "Đo điện áp trên từng phần tử", en: "Voltage drop across components" },
    objective: { vi: "Khảo sát sự phân bố điện áp trên các điện trở trong đoạn mạch nối tiếp.", en: "Examine voltage distribution across resistors in a series circuit." },
    hints: { vi: ["Điện áp nguồn 9V được chia thành các phần sụt áp trên từng điện trở.", "Điện trở có giá trị lớn hơn sẽ nhận sụt áp lớn hơn."], en: ["The 9V source divides into voltage drops across each resistor.", "The resistor with higher value receives a larger voltage drop."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-kcl-junction",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-resistors",
    title: { vi: "Định luật nút dòng điện (KCL)", en: "Kirchhoff's current law at a junction" },
    objective: { vi: "Khảo sát nguyên lý dòng vào bằng tổng các dòng ra tại điểm phân nhánh.", en: "Investigate that current entering a node equals the sum of currents leaving it." },
    hints: { vi: ["Dòng điện tổng từ nguồn chia thành hai nhánh qua hai điện trở song song.", "Tổng cường độ dòng điện qua R1 và R2 đúng bằng dòng điện từ pin."], en: ["Total source current splits across two parallel resistors.", "The sum of branch currents through R1 and R2 equals total source current."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-kvl-series",
    schemaVersion: 1,
    level: "middle",
    example: "resistor-series",
    title: { vi: "Định luật vòng điện áp (KVL)", en: "Kirchhoff's voltage law in a loop" },
    objective: { vi: "Chứng minh tổng đại số các sụt áp dọc theo vòng kín bằng điện áp nguồn.", en: "Demonstrate that the sum of voltage drops along a closed loop equals source voltage." },
    hints: { vi: ["Cộng sụt áp trên R1 và sụt áp trên R2.", "Tổng hai sụt áp này xấp xỉ bằng điện áp của nguồn pin."], en: ["Add the voltage drop across R1 and the drop across R2.", "Their sum closely matches the battery source voltage."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-current-limiting",
    schemaVersion: 1,
    level: "middle",
    example: "mixed-network",
    title: { vi: "Điện trở hạn chế dòng điện", en: "Resistor as a current limiter" },
    objective: { vi: "Sử dụng điện trở mắc nối tiếp để bảo vệ và hạn chế dòng qua bóng đèn.", en: "Use a series resistor to protect and limit current through a lamp." },
    hints: { vi: ["Điện trở nối tiếp làm tăng trở kháng tổng của toàn mạch.", "Dòng điện giảm giúp đèn hoạt động trong dải an toàn."], en: ["The series resistor increases the total circuit impedance.", "The reduced current keeps the lamp operating in a safe range."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-power-calculation",
    schemaVersion: 1,
    level: "middle",
    example: "power-loads",
    title: { vi: "Tính công suất điện năng tiêu thụ", en: "Electrical power consumption" },
    objective: { vi: "Vận dụng công thức P = U * I để tính toán công suất tiêu thụ của các tải.", en: "Apply P = V * I to calculate power dissipated by loads." },
    hints: { vi: ["Công suất tiêu thụ được tính bằng tích giữa hiệu điện thế và cường độ dòng điện.", "Tải có điện trở nhỏ hơn trong mạch song song tiêu thụ công suất lớn hơn."], en: ["Power consumed is the product of voltage and current.", "In parallel, the lower resistance load dissipates greater power."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-resistor-tolerance",
    schemaVersion: 1,
    level: "middle",
    example: "resistor-series",
    title: { vi: "Điện trở tương đương của mạch nối tiếp", en: "Equivalent resistance in series" },
    objective: { vi: "Kiểm tra công thức Rtd = R1 + R2 trên hai điện trở 100 Ω và 200 Ω.", en: "Verify R_eq = R1 + R2 on two resistors of 100 ohms and 200 ohms." },
    hints: { vi: ["Điện trở 100 Ω mắc nối tiếp với điện trở 200 Ω cho Rtd = 300 Ω.", "Dòng điện mạch tương ứng I = 9V / 300Ω = 0.03A."], en: ["A 100 ohm resistor in series with a 200 ohm resistor yields 300 ohms.", "The resulting current is I = 9V / 300 ohms = 0.03A."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true, targetResistance: 300 }
  },
  {
    id: "middle-parallel-conductance",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-resistors",
    title: { vi: "Độ dẫn điện của mạch song song", en: "Conductance of parallel circuits" },
    objective: { vi: "Tìm hiểu điện trở tương đương của hai nhánh song song luôn nhỏ hơn mỗi nhánh.", en: "Understand why parallel equivalent resistance is smaller than any individual branch." },
    hints: { vi: ["Mỗi nhánh tạo thêm một lối đi mới cho các hạt mang điện.", "Với R1 = 100 Ω và R2 = 200 Ω, Rtd xấp xỉ 66.7 Ω."], en: ["Each branch provides an additional path for charge carriers.", "With R1 = 100 ohms and R2 = 200 ohms, R_eq is approximately 66.7 ohms."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-series-voltage-ratio",
    schemaVersion: 1,
    level: "middle",
    example: "voltage-divider",
    title: { vi: "Tỷ lệ phân chia điện áp", en: "Voltage divider ratio" },
    objective: { vi: "Khảo sát tỷ số điện áp U1/U2 bằng tỷ số điện trở R1/R2.", en: "Examine that voltage ratio V1/V2 equals resistance ratio R1/R2." },
    hints: { vi: ["Vì cùng chung dòng điện I, sụt áp U = I * R tỷ lệ thuận với R.", "Điện trở 200 Ω sẽ chịu sụt áp gấp đôi điện trở 100 Ω."], en: ["Sharing the same current I, voltage drop V = I * R is proportional to R.", "The 200 ohm resistor receives twice the voltage of the 100 ohm resistor."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-parallel-current-ratio",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-resistors",
    title: { vi: "Phân chia dòng điện giữa các nhánh", en: "Current division between branches" },
    objective: { vi: "Khảo sát tỷ lệ nghịch giữa cường độ dòng điện nhánh và điện trở nhánh.", en: "Explore the inverse relationship between branch current and branch resistance." },
    hints: { vi: ["Hai nhánh cùng chung hiệu điện thế của nguồn.", "Nhánh 100 Ω sẽ có dòng điện lớn gấp đôi nhánh 200 Ω."], en: ["Both branches experience identical source voltage.", "The 100 ohm branch draws twice as much current as the 200 ohm branch."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-ammeter-inline",
    schemaVersion: 1,
    level: "middle",
    example: "meter-series",
    title: { vi: "Mắc ampe kế kiểm tra dòng điện", en: "Inline ammeter current check" },
    objective: { vi: "Kiểm tra dòng điện qua tải bằng ampe kế mắc thẳng vào nhánh.", en: "Check load current using an ammeter placed directly in the branch." },
    hints: { vi: ["Ampe kế nối tiếp ghi nhận cường độ dòng điện đi qua nó.", "Với nguồn 9V và điện trở 100 Ω, ampe kế chỉ xấp xỉ 0.09 A."], en: ["The series ammeter reads the current passing through it.", "With a 9V battery and 100 ohm resistor, it reads roughly 0.09 A."] },
    expected: { componentTypes: ["battery", "ammeter", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-energy-dissipation",
    schemaVersion: 1,
    level: "middle",
    example: "resistor-series",
    title: { vi: "Nhiệt lượng tỏa ra trên điện trở", en: "Thermal dissipation in resistors" },
    objective: { vi: "Hiểu định luật Joule-Lenz về nhiệt lượng Q = I^2 * R * t tỏa ra trên tải.", en: "Understand Joule's heating law Q = I^2 * R * t dissipated in loads." },
    hints: { vi: ["Điện năng chuyển hóa thành nhiệt năng khi dòng điện đi qua điện trở.", "Công suất tỏa nhiệt tính bằng P = I^2 * R."], en: ["Electrical energy turns into heat as current traverses a resistor.", "Heat power dissipation equals P = I^2 * R."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-switch-protection",
    schemaVersion: 1,
    level: "middle",
    example: "two-switch-series",
    title: { vi: "Bảo vệ hai cấp bằng công tắc", en: "Dual switch protection" },
    objective: { vi: "Phân tích trạng thái đóng mở của hệ thống hai công tắc mắc nối tiếp.", en: "Analyze switching states of two switches connected in series." },
    hints: { vi: ["Mạch chỉ cho phép dòng điện chạy qua khi cả hai khóa đều đóng.", "Chỉ cần một khóa mở thì mạch lập tức bị ngắt hoàn toàn."], en: ["Current flows only when both contacts are closed.", "Opening either contact breaks the circuit completely."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-branch-fault-detect",
    schemaVersion: 1,
    level: "middle",
    example: "switch-branch",
    title: { vi: "Phát hiện sự cố hở mạch nhánh", en: "Branch open fault detection" },
    objective: { vi: "Khảo sát hiện tượng một nhánh song song bị hở mạch trong khi nhánh kia vẫn dẫn.", en: "Explore what happens when one parallel branch opens while another conducts." },
    hints: { vi: ["Nhánh bị hở không có dòng điện chạy qua.", "Nhánh song song còn lại vẫn tiếp tục hoạt động bình thường."], en: ["The open branch carries zero current.", "The remaining parallel branch continues to function normally."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-mixed-current-sum",
    schemaVersion: 1,
    level: "middle",
    example: "mixed-network",
    title: { vi: "Dòng điện trong mạch hỗn hợp", en: "Current in mixed circuits" },
    objective: { vi: "Xác minh dòng điện mạch chính bằng tổng dòng điện hai nhánh rẽ song song.", en: "Verify main loop current equals the sum of two parallel branch currents." },
    hints: { vi: ["Điện trở R1 nằm trên mạch chính, sau đó rẽ vào hai bóng đèn.", "Dòng qua R1 bằng tổng dòng chạy qua hai bóng đèn."], en: ["Resistor R1 sits on the main rail before splitting into two lamps.", "Current through R1 equals the sum of currents through both lamps."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-two-resistor-power-compare",
    schemaVersion: 1,
    level: "middle",
    example: "resistor-series",
    title: { vi: "So sánh công suất hai điện trở nối tiếp", en: "Power comparison in series resistors" },
    objective: { vi: "So sánh công suất tiêu thụ của hai điện trở 100 Ω và 200 Ω khi mắc nối tiếp.", en: "Compare power dissipation of 100 ohm and 200 ohm series resistors." },
    hints: { vi: ["Cùng dòng điện I, công suất P = I^2 * R tỷ lệ thuận với điện trở.", "Điện trở 200 Ω tiêu thụ công suất gấp đôi điện trở 100 Ω."], en: ["With identical current I, power P = I^2 * R is proportional to resistance.", "The 200 ohm resistor dissipates twice the power of the 100 ohm resistor."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-two-resistor-parallel-power",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-resistors",
    title: { vi: "So sánh công suất hai điện trở song song", en: "Power comparison in parallel resistors" },
    objective: { vi: "So sánh công suất tiêu thụ của hai điện trở khi mắc song song vào nguồn 9V.", en: "Compare power dissipation of two resistors connected in parallel to a 9V source." },
    hints: { vi: ["Cùng hiệu điện thế U, công suất P = U^2 / R tỷ lệ nghịch với điện trở.", "Điện trở 100 Ω tiêu thụ công suất lớn hơn điện trở 200 Ω."], en: ["With identical voltage V, power P = V^2 / R is inversely proportional to R.", "The 100 ohm resistor dissipates more power than the 200 ohm resistor."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-load-lamp-resistor",
    schemaVersion: 1,
    level: "middle",
    example: "power-loads",
    title: { vi: "Phối hợp tải bóng đèn và điện trở", en: "Combining lamp and resistor loads" },
    objective: { vi: "Khảo sát hoạt động của tải thuần trở và tải phát quang khi mắc song song.", en: "Examine pure resistance and light-emitting loads operating in parallel." },
    hints: { vi: ["Bóng đèn có điện trở khoảng 6 Ω tiêu thụ dòng điện lớn hơn điện trở 100 Ω.", "Quan sát dòng điện từng nhánh trên bảng hiển thị kết quả."], en: ["The lamp with ~6 ohm resistance draws more current than the 100 ohm resistor.", "Inspect branch currents on the results panel."] },
    expected: { componentTypes: ["battery", "resistor", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-series-chain-rules",
    schemaVersion: 1,
    level: "middle",
    example: "resistor-series",
    title: { vi: "Quy tắc chuỗi nối tiếp", en: "Series chain rules" },
    objective: { vi: "Củng cố hai quy tắc cốt lõi của mạch nối tiếp: I bằng nhau, U cộng dồn.", en: "Reinforce core series rules: current is uniform, voltages add up." },
    hints: { vi: ["I = I1 = I2 và U = U1 + U2.", "Kiểm tra với sơ đồ hai điện trở nối tiếp trên màn hình."], en: ["I = I1 = I2 and V = V1 + V2.", "Verify with the two series resistors shown on screen."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-parallel-network-rules",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-resistors",
    title: { vi: "Quy tắc mạng song song", en: "Parallel network rules" },
    objective: { vi: "Củng cố hai quy tắc cốt lõi của mạch song song: U bằng nhau, I cộng dồn.", en: "Reinforce core parallel rules: voltage is uniform, currents add up." },
    hints: { vi: ["U = U1 = U2 và I = I1 + I2.", "Kiểm tra với sơ đồ hai điện trở song song trên màn hình."], en: ["V = V1 = V2 and I = I1 + I2.", "Verify with the two parallel resistors shown on screen."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  },
  {
    id: "middle-switch-branch-control",
    schemaVersion: 1,
    level: "middle",
    example: "switch-branch",
    title: { vi: "Điều khiển nhánh có phụ tải", en: "Branch control with individual loads" },
    objective: { vi: "Đóng ngắt một nhánh tải bằng công tắc riêng biệt trong mạch điện.", en: "Switch an individual load branch using its dedicated switch." },
    hints: { vi: ["Mỗi nhánh hoạt động độc lập dưới cùng điện áp nguồn 9V.", "Mở công tắc nhánh chỉ triệt tiêu dòng điện trên chính nhánh đó."], en: ["Each branch functions independently under the 9V source.", "Opening a branch switch zeroes current only in that branch."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "middle-total-conductance-check",
    schemaVersion: 1,
    level: "middle",
    example: "parallel-resistors",
    title: { vi: "Khảo sát tổng dẫn điện mạng song song", en: "Parallel total conductance check" },
    objective: { vi: "Tổng hợp kiến thức về sự tăng dòng tổng khi thêm nhánh song song.", en: "Synthesize knowledge about total current increasing with parallel branches." },
    hints: { vi: ["Thêm nhánh song song làm tăng khả năng dẫn điện chung của mạch.", "Dòng điện tổng từ nguồn bằng tổng các dòng thành phần."], en: ["Adding parallel branches enhances overall circuit conductance.", "Total source current equals the sum of all individual branch currents."] },
    expected: { componentTypes: ["battery", "resistor"], requireClosedCircuit: true }
  }
];
