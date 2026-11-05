export const primaryLessons = [
  {
    id: "closed-loop",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "1. Thắp sáng bóng đèn", en: "1. Light the bulb" },
    objective: { vi: "Tạo mạch kín từ pin qua công tắc và bóng đèn. Quan sát điều kiện để có dòng điện.", en: "Build a closed path through a battery, switch and bulb; observe when current can flow." },
    hints: { vi: ["Mạch cần một đường đi liên tục qua tải rồi trở về cực còn lại của pin.", "Đóng công tắc và nối đủ cả hai chân của từng linh kiện."], en: ["Current needs a complete path through the load and back to the other battery terminal.", "Close the switch and connect both terminals of every component."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-open-switch",
    schemaVersion: 1,
    level: "primary",
    example: "open-switch",
    title: { vi: "Công tắc đóng và mở", en: "Open and closed switch" },
    objective: { vi: "So sánh cùng một mạch khi công tắc đóng và mở.", en: "Compare the same circuit with the switch closed and open." },
    hints: { vi: ["Nhấp vào công tắc để đổi trạng thái.", "Khi công tắc mở, đường dẫn bị ngắt."], en: ["Click the switch to change its state.", "An open switch breaks the conducting path."] },
    expected: { componentTypes: ["battery", "switch", "lamp"] }
  },
  {
    id: "primary-conductors",
    schemaVersion: 1,
    level: "primary",
    example: "two-lamps-series",
    title: { vi: "Hai bóng đèn nối tiếp", en: "Two bulbs in series" },
    objective: { vi: "Quan sát hai bóng nằm trên cùng một đường dòng điện.", en: "Observe two bulbs on the same current path." },
    hints: { vi: ["Trong mạch nối tiếp, cùng một dòng điện đi qua mỗi linh kiện.", "Thêm tải nối tiếp làm tăng điện trở tổng."], en: ["The same current passes through each series component.", "Adding a series load increases total resistance."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-parallel",
    schemaVersion: 1,
    level: "primary",
    example: "parallel",
    title: { vi: "Hai nhánh đèn song song", en: "Two parallel bulb branches" },
    objective: { vi: "Nhận biết mạch phân nhánh và quan sát dòng tổng.", en: "Recognize a branched circuit and observe total current." },
    hints: { vi: ["Mỗi bóng nằm trên một nhánh riêng.", "Dòng tổng bằng tổng dòng điện qua các nhánh."], en: ["Each bulb sits on its own branch.", "Total current is the sum of branch currents."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-switch-control",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Điều khiển bật tắt đèn", en: "Switch on and off control" },
    objective: { vi: "Sử dụng công tắc để bật và tắt bóng đèn theo ý muốn.", en: "Use a switch to turn a bulb on and off at will." },
    hints: { vi: ["Nhấn vào công tắc để đổi giữa đóng và mở.", "Khi đóng, đường dẫn được nối liền làm đèn sáng."], en: ["Click the switch to toggle between open and closed.", "When closed, the continuous path lights the bulb."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-battery-source",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Nguồn điện từ pin", en: "Power from the battery" },
    objective: { vi: "Nhận biết vai trò cung cấp điện năng của pin trong mạch.", en: "Identify the role of the battery in supplying electrical energy to the circuit." },
    hints: { vi: ["Pin là nguồn cấp năng lượng cho đèn phát sáng.", "Cần nối cả cực dương và cực âm về tải."], en: ["The battery provides the energy that lights the bulb.", "Both positive and negative terminals must connect to the load."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true, targetVoltage: 9 }
  },
  {
    id: "primary-bulb-load",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Bóng đèn tiêu thụ điện", en: "Bulb as an electrical load" },
    objective: { vi: "Quan sát bóng đèn chuyển hóa điện năng thành ánh sáng khi có dòng điện.", en: "Observe the bulb converting electrical energy into light when current flows." },
    hints: { vi: ["Bóng đèn sáng lên khi dòng điện chạy qua dây tóc.", "Nếu mạch hở thì không có dòng điện và đèn tắt."], en: ["The bulb glows when current flows through its filament.", "If the circuit is open, current ceases and the bulb goes dark."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true, minCurrent: 0.1 }
  },
  {
    id: "primary-two-switch-series",
    schemaVersion: 1,
    level: "primary",
    example: "two-switch-series",
    title: { vi: "Khóa an toàn hai công tắc", en: "Two-switch safety interlock" },
    objective: { vi: "Khám phá cách mắc hai công tắc nối tiếp để tăng độ an toàn.", en: "Explore connecting two switches in series for enhanced safety." },
    hints: { vi: ["Hai công tắc cùng nằm trên đường dây dẫn.", "Chỉ khi cả hai công tắc cùng đóng thì đèn mới có thể sáng."], en: ["Both switches lie along the same conducting path.", "The bulb can only light when both switches are closed together."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-dual-branch-switches",
    schemaVersion: 1,
    level: "primary",
    example: "parallel-switches",
    title: { vi: "Điều khiển hai đèn riêng biệt", en: "Independent dual bulb control" },
    objective: { vi: "Bật hoặc tắt từng bóng đèn độc lập bằng công tắc riêng trên mỗi nhánh.", en: "Turn each bulb on or off independently using separate branch switches." },
    hints: { vi: ["Mỗi nhánh có một công tắc và một bóng đèn.", "Tắt một đèn không làm ảnh hưởng đến đèn ở nhánh còn lại."], en: ["Each branch has its own switch and bulb.", "Turning off one bulb does not affect the bulb on the other branch."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-loop-continuity",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Tính liên tục của mạch điện", en: "Continuity of the electric circuit" },
    objective: { vi: "Kiểm tra điều kiện để dòng điện tuần hoàn trong một vòng khép kín.", en: "Verify the condition for current to circulate around a closed loop." },
    hints: { vi: ["Dòng điện đi từ một cực qua tải rồi trở về cực kia của pin.", "Bất kỳ điểm hở nào trên vòng cũng làm dừng toàn bộ dòng điện."], en: ["Current travels from one terminal through the load and back to the other.", "Any break along the loop halts the entire current flow."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-series-brightness",
    schemaVersion: 1,
    level: "primary",
    example: "two-lamps-series",
    title: { vi: "Độ sáng hai đèn nối tiếp", en: "Brightness of two series bulbs" },
    objective: { vi: "Quan sát hai bóng đèn cùng chia sẻ điện áp nguồn khi mắc nối tiếp.", en: "Observe two bulbs sharing the source voltage when connected in series." },
    hints: { vi: ["Hai bóng nằm trên cùng một đường truyền.", "Dòng điện phải vượt qua điện trở của cả hai bóng đèn."], en: ["Both bulbs sit on the same path.", "Current must pass through the resistance of both bulbs."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true, targetResistance: 12 }
  },
  {
    id: "primary-parallel-brightness",
    schemaVersion: 1,
    level: "primary",
    example: "parallel",
    title: { vi: "Độ sáng hai đèn song song", en: "Brightness of two parallel bulbs" },
    objective: { vi: "Quan sát hai bóng đèn song song cùng nhận đủ điện áp của nguồn pin.", en: "Observe two parallel bulbs each receiving full battery voltage." },
    hints: { vi: ["Hai đầu của mỗi bóng đèn đều nối trực tiếp về hai cực của pin.", "Điện trở tương đương của mạch giảm giúp dòng tổng tăng lên."], en: ["Both ends of each bulb connect directly across the battery terminals.", "Reduced equivalent resistance allows greater total current."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true, targetResistance: 3 }
  },
  {
    id: "primary-switch-open-concept",
    schemaVersion: 1,
    level: "primary",
    example: "open-switch",
    title: { vi: "Trạng thái ngắt mạch", en: "Circuit open condition" },
    objective: { vi: "Nhận biết trạng thái khi công tắc ngắt không cho dòng điện chạy qua.", en: "Identify the open condition when the switch prevents current flow." },
    hints: { vi: ["Khi công tắc mở, khoảng trống không khí ngăn dòng điện chạy qua.", "Bóng đèn không sáng vì mạch bị hở."], en: ["When open, the air gap blocks electric charges from passing.", "The bulb remains unlit because the circuit is broken."] },
    expected: { componentTypes: ["battery", "switch", "lamp"] }
  },
  {
    id: "primary-room-lighting",
    schemaVersion: 1,
    level: "primary",
    example: "parallel-switches",
    title: { vi: "Mạch đèn chiếu sáng gia đình", en: "Home room lighting circuit" },
    objective: { vi: "Tìm hiểu vì sao đèn trong các phòng thường được mắc song song.", en: "Understand why lights in different rooms are wired in parallel." },
    hints: { vi: ["Nếu mắc song song, khi một đèn tắt các phòng khác vẫn sáng bình thường.", "Mỗi phòng có thể bật tắt công tắc riêng rẽ."], en: ["With parallel wiring, if one light goes out, other rooms stay lit.", "Each room can have its own independent switch."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-flashlight-model",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Mô hình đèn pin cầm tay", en: "Flashlight circuit model" },
    objective: { vi: "Lắp ráp mô hình mạch điện đơn giản của một chiếc đèn pin bỏ túi.", en: "Assemble a simple circuit model of a portable handheld flashlight." },
    hints: { vi: ["Đèn pin gồm có pin, công tắc gạt và bóng đèn.", "Đóng công tắc thì đèn pin sẽ chiếu sáng."], en: ["A flashlight consists of a battery, slide switch, and lamp.", "Closing the switch illuminates the flashlight."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-staircase-logic",
    schemaVersion: 1,
    level: "primary",
    example: "two-switch-series",
    title: { vi: "Hệ thống công tắc nối tiếp", en: "Series switch system" },
    objective: { vi: "Khảo sát mạch chỉ hoạt động khi mọi công tắc đều ở trạng thái đóng.", en: "Investigate a circuit that only operates when all switches are closed." },
    hints: { vi: ["Thử mở một trong hai công tắc để xem đèn có tắt không.", "Cả hai công tắc đóng mới tạo thành một đường dẫn trọn vẹn."], en: ["Try opening either switch to verify if the bulb turns off.", "Both switches must be closed to complete the conducting line."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-single-switch-branch",
    schemaVersion: 1,
    level: "primary",
    example: "switch-branch",
    title: { vi: "Bảo vệ một nhánh đèn", en: "Single branch switch protection" },
    objective: { vi: "Quan sát việc đóng ngắt riêng nhánh đèn mà không ảnh hưởng nhánh còn lại.", en: "Observe toggling one branch switch without disturbing the other branch." },
    hints: { vi: ["Hai nhánh mắc song song với cùng một nguồn điện.", "Mỗi công tắc chỉ kiểm soát dòng điện chạy qua nhánh của nó."], en: ["Two branches run in parallel across the same power source.", "Each switch only controls the current flowing in its branch."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-holiday-series-lights",
    schemaVersion: 1,
    level: "primary",
    example: "two-lamps-series",
    title: { vi: "Dây đèn trang trí nối tiếp", en: "Holiday series decorative lights" },
    objective: { vi: "Tìm hiểu đặc điểm của dây đèn trang trí nhiều bóng mắc nối tiếp.", en: "Learn the characteristics of multi-bulb decorative series string lights." },
    hints: { vi: ["Dòng điện đi tuần tự qua từng bóng đèn một.", "Nếu một bóng bị hỏng làm đứt mạch, toàn bộ dây đèn sẽ cùng tắt."], en: ["Current flows sequentially through each bulb one after another.", "If one bulb breaks the circuit, the entire string goes dark."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-safe-connection",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Nối dây an toàn qua tải", en: "Safe connection through load" },
    objective: { vi: "Luôn đảm bảo dòng điện phải đi qua tải thay vì nối tắt pin.", en: "Always ensure current flows through a load rather than shorting the battery." },
    hints: { vi: ["Bóng đèn cung cấp điện trở cần thiết để giới hạn dòng điện.", "Không nối trực tiếp hai cực của pin với nhau."], en: ["The bulb provides necessary resistance to limit the current.", "Never connect the battery terminals directly together."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true, minCurrent: 0.1 }
  },
  {
    id: "primary-desk-fan-light",
    schemaVersion: 1,
    level: "primary",
    example: "parallel-switches",
    title: { vi: "Mạch đèn và quạt để bàn", en: "Desk lamp and fan circuit" },
    objective: { vi: "Mô phỏng bàn học có hai thiết bị điện hoạt động song song độc lập.", en: "Simulate a study desk with two electrical appliances running in parallel." },
    hints: { vi: ["Mỗi thiết bị được nối vào một nhánh song song riêng.", "Bật hoặc tắt quạt không làm gián đoạn việc chiếu sáng của đèn."], en: ["Each appliance is connected to its own parallel branch.", "Turning the fan on or off does not interrupt the lighting."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-tracing-wires",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Dò đường dây dẫn điện", en: "Tracing circuit wires" },
    objective: { vi: "Luyện tập lần theo đường dây nối từ cực dương trở về cực âm.", en: "Practice following wire routes from the positive back to the negative terminal." },
    hints: { vi: ["Kiểm tra các điểm nối giữa linh kiện và dây dẫn.", "Mỗi linh kiện đều phải có hai đầu nối vào mạch."], en: ["Inspect connection points between components and wires.", "Every component must have two terminals wired into the circuit."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-dual-load-parallel",
    schemaVersion: 1,
    level: "primary",
    example: "parallel",
    title: { vi: "Tải điện song song hai nhánh", en: "Two-branch parallel loads" },
    objective: { vi: "Khảo sát cách chia dòng điện từ nguồn vào hai nhánh tải.", en: "Examine how source current divides into two load branches." },
    hints: { vi: ["Dòng điện từ nguồn tách thành hai luồng đi qua hai bóng đèn.", "Sau khi qua đèn, hai luồng hợp lại trở về cực âm của nguồn."], en: ["Current from the source splits into two flows through both bulbs.", "After passing the bulbs, both flows recombine to the negative terminal."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true, minCurrent: 1.0 }
  },
  {
    id: "primary-switch-terminal-check",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Nối dây công tắc đúng cực", en: "Switch terminal connections" },
    objective: { vi: "Nối chính xác hai chân tiếp điểm của công tắc vào mạch điện.", en: "Correctly wire both contacts of a switch into the circuit." },
    hints: { vi: ["Công tắc có hai chân tiếp điểm để ngắt hoặc nối đường dẫn.", "Khi đóng công tắc, tiếp điểm khép lại cho dòng điện đi qua."], en: ["The switch has two terminals to break or make the conducting path.", "When closed, contacts touch and permit current flow."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-series-current-unity",
    schemaVersion: 1,
    level: "primary",
    example: "two-lamps-series",
    title: { vi: "Dòng điện đồng nhất trong mạch nối tiếp", en: "Uniform current in series path" },
    objective: { vi: "Nhận biết cùng một dòng điện đi qua mọi linh kiện trên đoạn mạch nối tiếp.", en: "Recognize that the exact same current traverses every series component." },
    hints: { vi: ["Không có điểm rẽ nhánh nào nên dòng điện không bị hao hụt.", "Cường độ dòng điện là như nhau tại mọi vị trí trong vòng nối tiếp."], en: ["With no branch splits, current cannot be lost along the line.", "Current is identical at all points around the series loop."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-turn-off-switch",
    schemaVersion: 1,
    level: "primary",
    example: "open-switch",
    title: { vi: "Ngắt điện an toàn", en: "Safe power cutoff" },
    objective: { vi: "Sử dụng công tắc để ngắt dòng điện trước khi thao tác trên mạch.", en: "Use a switch to interrupt current before servicing components." },
    hints: { vi: ["Mở công tắc giúp triệt tiêu dòng điện trong mạch.", "Đây là nguyên tắc an toàn cơ bản khi sửa chữa điện."], en: ["Opening the switch stops current in the circuit.", "This is a basic safety rule when repairing electrical setups."] },
    expected: { componentTypes: ["battery", "switch", "lamp"] }
  },
  {
    id: "primary-emergency-stop",
    schemaVersion: 1,
    level: "primary",
    example: "two-switch-series",
    title: { vi: "Nút ngắt khẩn cấp", en: "Emergency cutoff switch" },
    objective: { vi: "Bố trí công tắc nối tiếp với nguồn để ngắt toàn bộ hệ thống khi cần.", en: "Place a switch in series with the source to disconnect the entire system." },
    hints: { vi: ["Công tắc đặt nối tiếp có thể cắt nguồn cung cấp cho toàn bộ mạch.", "Chỉ cần mở một công tắc là toàn bộ tải lập tức tắt."], en: ["A series switch can cut supply to the entire circuit.", "Opening either switch immediately turns off all loads."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-parallel-independence",
    schemaVersion: 1,
    level: "primary",
    example: "switch-branch",
    title: { vi: "Tính độc lập của các nhánh song song", en: "Independence of parallel branches" },
    objective: { vi: "Chứng minh một nhánh bị ngắt không làm mất điện ở các nhánh khác.", en: "Demonstrate that disconnecting one branch does not affect others." },
    hints: { vi: ["Mỗi nhánh vẫn duy trì đường kín độc lập về nguồn pin.", "Đây là lý do thiết bị gia dụng luôn được mắc song song."], en: ["Each branch maintains an independent closed path to the battery.", "This is why household appliances are wired in parallel."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-bulb-check",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Kiểm tra bóng đèn hoạt động", en: "Verifying bulb operation" },
    objective: { vi: "Khảo sát bóng đèn hoạt động bình thường với nguồn pin 9V.", en: "Verify that the bulb operates normally with a 9V battery." },
    hints: { vi: ["Điện áp nguồn 9V cung cấp năng lượng đầy đủ cho đèn sáng rõ.", "Đọc thông số điện áp và cường độ dòng điện hiển thị trên bảng."], en: ["The 9V source provides sufficient power to brightly light the bulb.", "Read voltage and current values displayed on the panel."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true, targetVoltage: 9 }
  },
  {
    id: "primary-dual-path-junction",
    schemaVersion: 1,
    level: "primary",
    example: "parallel",
    title: { vi: "Điểm nối rẽ nhánh của dòng điện", en: "Branching junction points" },
    objective: { vi: "Quan sát điểm nối chia tách và hợp nhất của hai luồng điện tích.", en: "Observe the splitting and merging points of two charge flows." },
    hints: { vi: ["Điểm ngã ba dẫn dòng điện đi về hai bóng đèn song song.", "Sau khi qua đèn, chúng gặp nhau ở ngã ba thứ hai để về pin."], en: ["The junction splits current toward the two parallel bulbs.", "After passing the bulbs, they meet at the second junction back to the battery."] },
    expected: { componentTypes: ["battery", "lamp"], requireClosedCircuit: true }
  },
  {
    id: "primary-simple-closed-loop",
    schemaVersion: 1,
    level: "primary",
    example: "simple",
    title: { vi: "Mạch điện một vòng cơ bản", en: "Single-loop basic circuit" },
    objective: { vi: "Củng cố kiến thức về mạch điện một vòng kín đơn giản nhất.", en: "Reinforce understanding of the simplest single closed-loop circuit." },
    hints: { vi: ["Mạch gồm nguồn pin, công tắc và một bóng đèn.", "Đảm bảo không có đoạn hở nào để đèn phát sáng ổn định."], en: ["The circuit contains a battery, a switch, and a lamp.", "Ensure there are no breaks so the bulb shines steadily."] },
    expected: { componentTypes: ["battery", "switch", "lamp"], requireClosedCircuit: true }
  }
];
