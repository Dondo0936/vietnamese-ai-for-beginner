"use client";

type OfficeBrief = {
  title: string;
  scene: string;
  aiMove: string;
  humanCheck: string;
  flow: [string, string, string, string];
};

const OFFICE_BRIEFS: Record<string, OfficeBrief> = {
  "getting-started-with-ai": {
    title: "Bắt đầu bằng một việc thật",
    scene: "Chọn một việc nhỏ: email, tóm tắt họp, kế hoạch tuần.",
    aiMove: "Giao vai trò, mục tiêu, dữ liệu và định dạng ngay trong prompt.",
    humanCheck: "Đọc lại như duyệt văn bản trước khi gửi cho đồng nghiệp.",
    flow: ["Việc thật", "Prompt rõ", "Bản nháp", "Kiểm rồi dùng"],
  },
  "llm-overview": {
    title: "LLM đoán chữ, không biết chắc",
    scene: "Bạn nhập yêu cầu, model nhìn context và đoán token tiếp theo.",
    aiMove: "Nó nối các token thành câu trả lời nghe rất trôi chảy.",
    humanCheck: "Việc quan trọng cần đối chiếu nguồn, số liệu và ngữ cảnh.",
    flow: ["Prompt", "Context", "Token kế tiếp", "Kiểm chứng"],
  },
  "llm-overview-in-chat-assistants": {
    title: "Chatbot là giao diện của LLM",
    scene: "ChatGPT, Claude và Gemini nhận việc qua một khung chat quen thuộc.",
    aiMove: "Trợ lý giữ ngữ cảnh, tạo câu trả lời và gợi ý bước tiếp theo.",
    humanCheck: "Giữ thông tin nhạy cảm ngoài chat công cộng nếu chưa rõ chính sách.",
    flow: ["Yêu cầu", "Ngữ cảnh", "Trả lời", "Quyết định"],
  },
  "prompt-engineering": {
    title: "Prompt là bản brief cho AI",
    scene: "Bạn cần email, tóm tắt hoặc báo cáo đúng người nhận.",
    aiMove: "Prompt nêu vai trò, việc, bối cảnh, định dạng và giọng.",
    humanCheck: "So bản nháp với mục tiêu trước khi gửi.",
    flow: ["Việc cần làm", "Prompt đủ khung", "Bản nháp", "Sửa rồi gửi"],
  },
  "prompt-engineering-in-writing-tools": {
    title: "Công cụ viết đóng gói prompt",
    scene: "Người dùng chọn template thay vì tự nghĩ prompt từ trang trắng.",
    aiMove: "Jasper hoặc Notion AI chèn khung vai trò, giọng văn và mục tiêu.",
    humanCheck: "So lại giọng thương hiệu, thông tin sản phẩm và lời hứa bán hàng.",
    flow: ["Template", "Prompt ẩn", "Bản nháp", "Biên tập"],
  },
  "chain-of-thought": {
    title: "Cho AI nháp trước khi chốt",
    scene: "Một yêu cầu có nhiều bước dễ sai nếu AI trả lời ngay.",
    aiMove: "Prompt yêu cầu chia việc, nêu giả định và đi từng bước.",
    humanCheck: "Kiểm từng bước, không chỉ nhìn đáp án cuối.",
    flow: ["Bài nhiều bước", "Nháp", "Đáp án", "Soát logic"],
  },
  "chain-of-thought-in-reasoning-models": {
    title: "Reasoning model tự dành thời gian nghĩ",
    scene: "Câu hỏi khó cần lập luận sâu hơn một phản hồi chat nhanh.",
    aiMove: "Model tạo bản nháp nội bộ rồi mới đưa ra câu trả lời gọn.",
    humanCheck: "Dùng cho quyết định cần lý do, không dùng để thay phê duyệt.",
    flow: ["Câu hỏi khó", "Suy luận", "Kết luận", "Phê duyệt"],
  },
  "in-context-learning": {
    title: "Dạy AI bằng ví dụ ngay trong prompt",
    scene: "Bạn đưa hai mẫu đúng trước khi giao mẫu thứ ba.",
    aiMove: "Model bắt chước format, giọng văn và quy tắc từ ví dụ.",
    humanCheck: "Ví dụ sai sẽ kéo toàn bộ câu trả lời đi sai hướng.",
    flow: ["Mẫu đúng", "Prompt", "Mẫu mới", "Kiểm format"],
  },
  "in-context-learning-in-chatbots": {
    title: "Chatbot bắt chước mẫu ngay trong chat",
    scene: "Agent đưa hai phản hồi đúng mẫu trước câu hỏi mới.",
    aiMove: "Model giữ format, giọng và quy tắc xử lý từ các ví dụ.",
    humanCheck: "CS kiểm lại nhãn, giọng trả lời và ngoại lệ trước khi dùng.",
    flow: ["Mẫu trả lời", "Câu hỏi mới", "Giữ format", "CS kiểm"],
  },
  temperature: {
    title: "Temperature chỉnh độ ngẫu nhiên của câu trả lời",
    scene: "Cùng một prompt có thể cho câu rất ổn định hoặc nhiều biến thể.",
    aiMove: "Temperature thấp bám sát mẫu, temperature cao mở rộng lựa chọn.",
    humanCheck: "Việc chính xác để thấp, việc nghĩ ý tưởng có thể tăng.",
    flow: ["Prompt", "Temperature", "Biến thể", "Chọn bản"],
  },
  "temperature-in-creative-writing": {
    title: "Sáng tạo có nút chỉnh",
    scene: "Bạn cần nhiều hướng tiêu đề, caption hoặc đoạn mở đầu.",
    aiMove: "Công cụ tăng độ ngẫu nhiên để tạo thêm cách diễn đạt.",
    humanCheck: "Lọc lại theo thương hiệu, sự thật và mục tiêu chiến dịch.",
    flow: ["Brief", "Độ ngẫu nhiên", "Nhiều bản", "Chọn giọng"],
  },
  hallucination: {
    title: "Câu trả lời trôi chảy vẫn có thể sai",
    scene: "AI đưa ra số liệu, tên luật hoặc trích dẫn nghe rất chắc.",
    aiMove: "Model lấp khoảng trống bằng mẫu câu có xác suất cao.",
    humanCheck: "Bắt buộc hỏi nguồn, mở nguồn và kiểm từng chi tiết quan trọng.",
    flow: ["Câu trả lời", "Nguồn", "Đối chiếu", "Sử dụng"],
  },
  "hallucination-in-legal-research": {
    title: "Pháp lý không có chỗ cho nguồn bịa",
    scene: "Một trích dẫn án lệ sai có thể thành rủi ro nghề nghiệp.",
    aiMove: "AI có thể tạo tên vụ án và đoạn trích nghe hợp pháp.",
    humanCheck: "Mở cơ sở dữ liệu pháp lý thật trước khi đưa vào hồ sơ.",
    flow: ["Câu hỏi", "Án lệ AI nêu", "Nguồn thật", "Hồ sơ"],
  },
  "context-window": {
    title: "Context window là bàn làm việc của AI",
    scene: "Tài liệu quá dài khiến phần đầu hoặc phần giữa bị loãng.",
    aiMove: "Model chỉ nhìn được lượng token nằm trong cửa sổ context.",
    humanCheck: "Đưa phần quan trọng lên trước và chia tài liệu theo mục tiêu.",
    flow: ["Tài liệu", "Token", "Context", "Câu trả lời"],
  },
  "context-window-in-long-documents": {
    title: "Tài liệu dài vẫn cần cách hỏi đúng",
    scene: "PDF hàng trăm trang chứa cả phần cần đọc và phần gây nhiễu.",
    aiMove: "Model cửa sổ lớn giữ được nhiều đoạn hơn trong một lượt hỏi.",
    humanCheck: "Yêu cầu trích trang, đoạn và giới hạn phạm vi rõ.",
    flow: ["PDF dài", "Cửa sổ lớn", "Tóm tắt", "Trích dẫn"],
  },
  rag: {
    title: "RAG cho AI tra cứu trước khi trả lời",
    scene: "Nhân viên hỏi quy trình công ty mà model nền không thể tự biết.",
    aiMove: "Hệ thống tìm đoạn tài liệu liên quan rồi đưa vào prompt.",
    humanCheck: "Câu trả lời cần có nguồn để người dùng bấm kiểm lại.",
    flow: ["Câu hỏi", "Tìm tài liệu", "Prompt có nguồn", "Trả lời"],
  },
  "semantic-search": {
    title: "Tìm theo ý thay vì theo chữ",
    scene: "Bạn nhớ nội dung cần tìm nhưng không nhớ đúng từ khóa.",
    aiMove: "Embedding biến câu hỏi và tài liệu thành điểm gần nhau theo nghĩa.",
    humanCheck: "Mở kết quả gốc để chắc đoạn tìm được đúng ngữ cảnh.",
    flow: ["Ý cần tìm", "Embedding", "Đoạn gần nghĩa", "Mở nguồn"],
  },
  "ai-coding-assistants": {
    title: "AI coding assistant cũng giúp dân văn phòng",
    scene: "Nhiều việc lặp trong file, bảng tính hoặc website cần tự động hóa.",
    aiMove: "Trợ lý viết script, giải thích lỗi và chỉnh theo phản hồi.",
    humanCheck: "Chạy thử trên dữ liệu mẫu trước khi dùng với dữ liệu thật.",
    flow: ["Việc lặp", "Yêu cầu", "Script", "Chạy thử"],
  },
  "agentic-workflows": {
    title: "Agentic workflow giao việc theo chuỗi",
    scene: "Một quy trình cần đọc email, kiểm bảng và gửi thông báo.",
    aiMove: "Agent chọn bước tiếp theo dựa trên dữ liệu vừa đọc.",
    humanCheck: "Đặt điểm dừng phê duyệt ở bước tốn tiền hoặc gửi ra ngoài.",
    flow: ["Trigger", "Agent", "Công cụ", "Phê duyệt"],
  },
  "ai-for-writing": {
    title: "AI viết bản nháp, bạn giữ trách nhiệm",
    scene: "Email, báo cáo và slide thường bắt đầu từ ý thô.",
    aiMove: "AI dựng cấu trúc, chỉnh giọng và rút gọn nội dung.",
    humanCheck: "Bạn kiểm thông tin, sắc thái và người nhận trước khi gửi.",
    flow: ["Ý thô", "Bản nháp", "Chỉnh giọng", "Gửi"],
  },
  "ai-for-data-analysis": {
    title: "AI giúp đọc bảng, không thay kiểm số",
    scene: "Bảng tính có nhiều cột, câu hỏi và ngoại lệ khó nhìn bằng mắt.",
    aiMove: "AI gợi ý biểu đồ, công thức, SQL và insight ban đầu.",
    humanCheck: "Kiểm công thức, mẫu dữ liệu và giả định trước khi trình bày.",
    flow: ["Bảng dữ liệu", "Câu hỏi", "Insight", "Kiểm số"],
  },
  "ai-privacy-security": {
    title: "Bảo mật bắt đầu trước khi dán dữ liệu",
    scene: "Một đoạn chat có thể chứa lương, hợp đồng hoặc thông tin khách hàng.",
    aiMove: "Công cụ AI xử lý dữ liệu theo chính sách của từng nhà cung cấp.",
    humanCheck: "Phân loại dữ liệu và dùng kênh doanh nghiệp cho nội dung nhạy cảm.",
    flow: ["Dữ liệu", "Phân loại", "Công cụ đúng", "Lưu vết"],
  },
  "ai-tool-evaluation": {
    title: "Chọn AI tool bằng tiêu chí nhìn được",
    scene: "Một demo đẹp chưa đủ để mua phần mềm cho cả đội.",
    aiMove: "So công cụ theo chất lượng, chi phí, tốc độ, bảo mật và tích hợp.",
    humanCheck: "Chạy thử bằng việc thật của team trước khi ký hợp đồng.",
    flow: ["Nhu cầu", "Bảng tiêu chí", "Pilot", "Quyết định"],
  },
  "bias-fairness": {
    title: "AI có thể học lại định kiến cũ",
    scene: "Dữ liệu quá khứ chứa cách ra quyết định không công bằng.",
    aiMove: "Model học mẫu từ dữ liệu đó và lặp lại trong dự đoán mới.",
    humanCheck: "Theo dõi kết quả theo nhóm và đặt bước khiếu nại rõ.",
    flow: ["Dữ liệu cũ", "Model", "Quyết định", "Kiểm fairness"],
  },
  "bias-fairness-in-hiring": {
    title: "Tuyển dụng cần kiểm bias từ đầu",
    scene: "CV tốt có thể bị loại vì dữ liệu quá khứ thiên lệch.",
    aiMove: "Hệ thống xếp hạng ứng viên theo mẫu tuyển dụng cũ.",
    humanCheck: "Đo tác động theo nhóm và để con người phê duyệt cuối.",
    flow: ["CV", "Xếp hạng", "Danh sách", "Kiểm bias"],
  },
  "ai-governance": {
    title: "AI governance là quy trình dùng AI an toàn",
    scene: "Mỗi phòng ban dùng AI khác nhau, rủi ro cũng khác nhau.",
    aiMove: "Khung governance phân loại use case, quyền truy cập và phê duyệt.",
    humanCheck: "Chỉ triển khai khi có chủ sở hữu, nhật ký và quy trình xử lý lỗi.",
    flow: ["Use case", "Rủi ro", "Chính sách", "Theo dõi"],
  },
  "ai-governance-in-enterprise": {
    title: "Doanh nghiệp lớn cần cùng một chuẩn",
    scene: "Nhiều đội tự làm AI sẽ tạo rủi ro rời rạc.",
    aiMove: "Chuẩn nội bộ buộc dự án đi qua đánh giá, tài liệu và kiểm thử.",
    humanCheck: "Ban hành trách nhiệm rõ cho người xây, người duyệt và người vận hành.",
    flow: ["Dự án", "Chuẩn", "Đánh giá", "Triển khai"],
  },
  guardrails: {
    title: "Guardrails giữ chatbot trong vùng an toàn",
    scene: "Người dùng có thể hỏi câu nguy hiểm, riêng tư hoặc sai chính sách.",
    aiMove: "Hệ thống lọc đầu vào, đầu ra và hướng chatbot sang câu trả lời an toàn.",
    humanCheck: "Ghi nhận trường hợp bị chặn sai để chỉnh chính sách.",
    flow: ["Yêu cầu", "Luật chặn", "Trả lời an toàn", "Ghi nhận"],
  },
  "guardrails-in-chat-assistants": {
    title: "Trợ lý chat cần rào chắn nhiều lớp",
    scene: "Một chatbot công khai gặp đủ loại yêu cầu trong ngày.",
    aiMove: "Moderation và constitutional rules giúp lọc nội dung có hại.",
    humanCheck: "Vẫn cần kênh báo lỗi khi bot từ chối sai hoặc bỏ lọt rủi ro.",
    flow: ["Tin nhắn", "Moderation", "Trả lời", "Báo lỗi"],
  },
  explainability: {
    title: "Explainability cho biết AI dựa vào tín hiệu nào",
    scene: "Một điểm số hoặc nhãn dự đoán cần lý do để người dùng tin.",
    aiMove: "Kỹ thuật giải thích nêu đặc trưng ảnh hưởng mạnh nhất.",
    humanCheck: "Lý do phải hiểu được và dùng được trong quy trình thật.",
    flow: ["Dự đoán", "Tín hiệu", "Lý do", "Hành động"],
  },
  "explainability-in-credit-decisions": {
    title: "Từ chối tín dụng phải có lý do",
    scene: "Khách hàng cần biết vì sao hồ sơ vay bị từ chối.",
    aiMove: "Hệ thống nêu các yếu tố chính thay vì chỉ trả về điểm rủi ro.",
    humanCheck: "Lý do phải đúng luật, không phân biệt đối xử và có đường khiếu nại.",
    flow: ["Hồ sơ", "Điểm rủi ro", "Lý do", "Thông báo"],
  },
  "ai-in-finance": {
    title: "Tài chính dùng AI để thấy rủi ro sớm",
    scene: "Giao dịch, khoản vay và yêu cầu hỗ trợ tạo ra tín hiệu liên tục.",
    aiMove: "AI phát hiện bất thường, chấm điểm rủi ro và ưu tiên xử lý.",
    humanCheck: "Quyết định ảnh hưởng tiền bạc cần kiểm soát và giải thích được.",
    flow: ["Giao dịch", "Điểm rủi ro", "Cảnh báo gian lận", "Nhân viên duyệt"],
  },
  "ai-in-healthcare": {
    title: "Y tế dùng AI như lớp hỗ trợ bác sĩ",
    scene: "Ảnh chụp, hồ sơ và triệu chứng có nhiều tín hiệu khó đọc nhanh.",
    aiMove: "AI gợi ý vùng nghi ngờ, mức ưu tiên và khả năng cần kiểm tra thêm.",
    humanCheck: "Bác sĩ chịu quyết định cuối và kiểm theo quy trình chuyên môn.",
    flow: ["Dữ liệu y tế", "Gợi ý", "Bác sĩ kiểm", "Chăm sóc"],
  },
  "ai-in-education": {
    title: "Giáo dục dùng AI để cá nhân hóa nhịp học",
    scene: "Một lớp có học viên nhanh, chậm và mắc lỗi khác nhau.",
    aiMove: "AI gợi ý bài tập, phản hồi nháp và nội dung ôn riêng.",
    humanCheck: "Giáo viên giữ chuẩn đánh giá, động lực và sự công bằng.",
    flow: ["Bài nộp", "Bài tập gợi ý", "Phản hồi nháp", "Giáo viên duyệt"],
  },
  "ai-in-agriculture": {
    title: "Nông nghiệp dùng AI để nhìn ruộng bằng dữ liệu",
    scene: "Ảnh cây, cảm biến và thời tiết thay đổi từng ngày.",
    aiMove: "AI phát hiện sâu bệnh, dự báo rủi ro và gợi ý thời điểm xử lý.",
    humanCheck: "Nông dân và kỹ sư nông nghiệp kiểm tại ruộng trước khi làm lớn.",
    flow: ["Ảnh ruộng", "Dự báo", "Khuyến nghị", "Kiểm thực địa"],
  },
  "recommendation-systems": {
    title: "Recommendation system đoán bước tiếp theo",
    scene: "App cần chọn sản phẩm, video hoặc bài hát đáng hiện trước.",
    aiMove: "Hệ thống so hành vi của bạn với nội dung và người dùng gần giống.",
    humanCheck: "Theo dõi lặp nội dung, thiên lệch và mục tiêu kinh doanh quá đà.",
    flow: ["Hành vi", "So khớp", "Gợi ý", "Đo phản hồi"],
  },
  "recommendation-systems-in-shopping": {
    title: "Mua sắm online sống nhờ gợi ý đúng lúc",
    scene: "Người mua lướt rất nhanh và không đọc hết danh mục.",
    aiMove: "Sàn ưu tiên sản phẩm theo lịch sử, ngữ cảnh và người dùng tương tự.",
    humanCheck: "Kiểm xem gợi ý có hữu ích hay chỉ đẩy hàng cần bán.",
    flow: ["Lượt xem", "Tín hiệu", "Gợi ý", "Mua hoặc bỏ"],
  },
  "sentiment-analysis": {
    title: "Sentiment analysis gom cảm xúc thành tín hiệu",
    scene: "Bình luận khách hàng đến nhiều hơn khả năng đọc thủ công.",
    aiMove: "Model gán tích cực, tiêu cực hoặc trung tính cho từng câu.",
    humanCheck: "Mẫu mỉa mai, tiếng lóng và ngữ cảnh ngành cần kiểm tay.",
    flow: ["Bình luận", "Nhãn cảm xúc", "Xu hướng", "Hành động"],
  },
  "sentiment-analysis-in-brand-monitoring": {
    title: "Theo dõi thương hiệu cần cảnh báo sớm",
    scene: "Một cụm bình luận tiêu cực có thể lan trước khi đội truyền thông thấy.",
    aiMove: "Hệ thống gom khen chê, phát hiện chủ đề nóng và cảnh báo bất thường.",
    humanCheck: "Đọc mẫu bình luận gốc trước khi phản hồi công khai.",
    flow: ["Bình luận", "Chủ đề nóng", "Cảnh báo PR", "Đọc mẫu gốc"],
  },
  "text-classification": {
    title: "Text classification biến tin nhắn thành nhãn",
    scene: "Hộp thư có khiếu nại, hỏi giá, spam và yêu cầu kỹ thuật lẫn nhau.",
    aiMove: "Model đọc nội dung rồi gán nhãn để hệ thống xử lý tiếp.",
    humanCheck: "Kiểm nhãn sai ở nhóm quan trọng và cập nhật mẫu huấn luyện.",
    flow: ["Email/ticket", "Nhãn chủ đề", "Đúng hàng đợi", "Đội xử lý"],
  },
  "text-classification-in-support-routing": {
    title: "Điều phối hỗ trợ bắt đầu từ nhãn đúng",
    scene: "Ticket đến sai đội làm khách chờ và nhân viên chuyển qua lại.",
    aiMove: "AI gán chủ đề, độ ưu tiên và đội phụ trách ngay khi ticket vào.",
    humanCheck: "Theo dõi ticket bị chuyển lại để sửa quy tắc và dữ liệu mẫu.",
    flow: ["Ticket", "Nhãn", "Đội xử lý", "SLA"],
  },
};

interface OfficeVisualBriefProps {
  slug: string;
}

export default function OfficeVisualBrief({ slug }: OfficeVisualBriefProps) {
  const brief = OFFICE_BRIEFS[slug];
  if (!brief) return null;

  const cards = [
    { label: "Tình huống", text: brief.scene },
    { label: "AI làm gì", text: brief.aiMove },
    { label: "Bạn kiểm gì", text: brief.humanCheck },
  ];

  return (
    <section className="my-8" aria-label="Bản đồ trực quan cho nhân viên văn phòng">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Nhìn nhanh
        </p>
        <h2 className="text-lg font-semibold text-foreground">{brief.title}</h2>
      </div>

      <ol className="mb-4 grid gap-3 sm:grid-cols-4" aria-label="Luồng làm việc">
        {brief.flow.map((step, index) => (
          <li key={step} className="flex items-center gap-2 text-sm text-foreground">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {index + 1}
            </span>
            <span className="font-medium">{step}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-2 md:grid-cols-3 md:gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-3 md:p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {card.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">
              {card.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
