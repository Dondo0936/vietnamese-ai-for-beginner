import type { PathVisualBriefData, PathVisualVariant } from "./types";

function brief(
  slug: string,
  title: string,
  focus: string,
  variant: PathVisualVariant,
  nodes: PathVisualBriefData["nodes"],
  checks: PathVisualBriefData["checks"]
): PathVisualBriefData {
  return {
    pathId: "ai-engineer",
    slug,
    title,
    focus,
    variant,
    nodes,
    checks,
  };
}

export const AI_ENGINEER_VISUAL_BRIEFS = {
  cnn: brief(
    "cnn",
    "CNN nhìn ảnh theo tầng",
    "Filter nhỏ tạo feature map, pooling gom tín hiệu, classifier đọc nhãn.",
    "pipeline",
    [
      { label: "Ảnh", caption: "pixel thô", tone: "data" },
      { label: "Filter", caption: "cạnh và góc", tone: "compute" },
      { label: "Feature map", caption: "tín hiệu đã lọc", tone: "model" },
      { label: "Classifier", caption: "nhãn cuối", tone: "serve" },
    ],
    ["Kiểm shape tensor", "Nhìn feature map thật"]
  ),
  rnn: brief(
    "rnn",
    "RNN đọc chuỗi từng bước",
    "Hidden state mang ngữ cảnh từ token trước sang token sau.",
    "loop",
    [
      { label: "Token", caption: "đầu vào hiện tại", tone: "data" },
      { label: "Hidden state", caption: "ký ức tạm", tone: "model" },
      { label: "Bước kế", caption: "cập nhật tuần tự", tone: "compute" },
      { label: "Output", caption: "dự đoán theo chuỗi", tone: "serve" },
    ],
    ["Theo dõi vanishing gradient", "So với self-attention"]
  ),
  lstm: brief(
    "lstm",
    "LSTM dùng cổng để nhớ lâu",
    "Forget, input và output gate quyết định phần nào giữ, thêm, hoặc phát ra.",
    "gate",
    [
      { label: "Input", caption: "tín hiệu mới", tone: "data" },
      { label: "Forget gate", caption: "giữ hay bỏ", tone: "risk" },
      { label: "Cell state", caption: "đường nhớ dài", tone: "model" },
      { label: "Output gate", caption: "lộ phần cần dùng", tone: "serve" },
    ],
    ["Xem cell state không đứt", "Kiểm chuỗi dài"]
  ),
  transformer: brief(
    "transformer",
    "Transformer xử lý chuỗi song song",
    "Attention, FFN và residual block biến token thành biểu diễn giàu ngữ cảnh.",
    "stack",
    [
      { label: "Token", caption: "embedding đầu vào", tone: "data" },
      { label: "Attention", caption: "trộn ngữ cảnh", tone: "compute" },
      { label: "FFN", caption: "biến đổi từng vị trí", tone: "model" },
      { label: "Logits", caption: "điểm token tiếp theo", tone: "serve" },
    ],
    ["Kiểm mask và vị trí", "Đo throughput theo batch"]
  ),
  "self-attention": brief(
    "self-attention",
    "Self-attention lập bản đồ quan hệ",
    "Mỗi token tính trọng số nhìn sang các token khác trước khi trộn thông tin.",
    "matrix",
    [
      { label: "Query", caption: "token đang hỏi", tone: "data" },
      { label: "Key", caption: "token được so", tone: "data" },
      { label: "Score", caption: "mức liên quan", tone: "compute" },
      { label: "Value mix", caption: "ngữ cảnh mới", tone: "model" },
    ],
    ["Nhìn attention matrix", "Kiểm causal mask"]
  ),
  "multi-head-attention": brief(
    "multi-head-attention",
    "Nhiều head nhìn nhiều kiểu quan hệ",
    "Các head chạy song song, mỗi head học một lát quan hệ rồi ghép lại.",
    "matrix",
    [
      { label: "Head 1", caption: "quan hệ gần", tone: "compute" },
      { label: "Head 2", caption: "quan hệ xa", tone: "compute" },
      { label: "Head 3", caption: "mẫu cú pháp", tone: "model" },
      { label: "Concat", caption: "ghép tín hiệu", tone: "serve" },
    ],
    ["So head có khác nhau không", "Kiểm kích thước concat"]
  ),
  "positional-encoding": brief(
    "positional-encoding",
    "Vị trí được cộng vào token",
    "Transformer cần tín hiệu thứ tự để phân biệt token trước và sau.",
    "pipeline",
    [
      { label: "Token", caption: "nghĩa của chữ", tone: "data" },
      { label: "Vị trí", caption: "thứ tự trong chuỗi", tone: "data" },
      { label: "Embedding mới", caption: "nghĩa cộng vị trí", tone: "model" },
      { label: "Attention", caption: "đọc đúng thứ tự", tone: "compute" },
    ],
    ["Kiểm chuỗi dài hơn", "So learned và sinusoidal"]
  ),
  "residual-connections": brief(
    "residual-connections",
    "Skip connection giữ gradient sống",
    "Đường tắt cộng x vào F(x), giúp mạng sâu học phần cần sửa.",
    "pipeline",
    [
      { label: "x", caption: "tín hiệu gốc", tone: "data" },
      { label: "F(x)", caption: "phần biến đổi", tone: "compute" },
      { label: "+ x", caption: "đường skip", tone: "model" },
      { label: "Output", caption: "gốc cộng sửa", tone: "serve" },
    ],
    ["Đo training loss", "Kiểm shape trước khi cộng"]
  ),
  "weight-initialization": brief(
    "weight-initialization",
    "Khởi tạo giữ tín hiệu ổn định",
    "Weights ban đầu quyết định activation và gradient có nổ, tắt hay chảy đều.",
    "tradeoff",
    [
      { label: "Weights", caption: "giá trị ban đầu", tone: "data" },
      { label: "Activation", caption: "độ lớn tín hiệu", tone: "model" },
      { label: "Gradient", caption: "đường học ngược", tone: "compute" },
      { label: "Loss", caption: "hội tụ hay kẹt", tone: "serve" },
    ],
    ["Xem variance từng layer", "Chọn Xavier hoặc He"]
  ),
  "batch-normalization": brief(
    "batch-normalization",
    "BatchNorm ổn định phân phối lớp",
    "Batch statistics kéo activation về vùng dễ học rồi dùng running stats khi inference.",
    "pipeline",
    [
      { label: "Batch", caption: "mẫu đang học", tone: "data" },
      { label: "Mean/var", caption: "thống kê tạm", tone: "compute" },
      { label: "Normalize", caption: "kéo về vùng ổn", tone: "model" },
      { label: "Running stats", caption: "dùng khi inference", tone: "serve" },
    ],
    ["Gọi model.eval() khi suy luận", "Cẩn thận batch nhỏ"]
  ),
  sgd: brief(
    "sgd",
    "SGD đi xuống bằng bước nhỏ",
    "Mini-batch ồn nhưng rẻ, giúp optimizer cập nhật weights liên tục.",
    "loop",
    [
      { label: "Batch nhỏ", caption: "một lát dữ liệu", tone: "data" },
      { label: "Gradient", caption: "hướng giảm loss", tone: "compute" },
      { label: "Cập nhật", caption: "weights đổi nhẹ", tone: "model" },
      { label: "Loss mới", caption: "đo bước sau", tone: "serve" },
    ],
    ["Theo learning rate", "Nhìn noise không chỉ loss"]
  ),
  optimizers: brief(
    "optimizers",
    "Optimizer quyết định nhịp học",
    "Momentum, RMSProp và Adam khác nhau ở cách nhớ hướng và scale gradient.",
    "tradeoff",
    [
      { label: "Gradient", caption: "tín hiệu hiện tại", tone: "data" },
      { label: "Momentum", caption: "nhớ hướng cũ", tone: "compute" },
      { label: "Adapt", caption: "scale từng tham số", tone: "model" },
      { label: "Update", caption: "bước học cuối", tone: "serve" },
    ],
    ["So train và val loss", "Đừng chỉ nhìn hội tụ nhanh"]
  ),
  "prompt-engineering": brief(
    "prompt-engineering",
    "Prompt thành spec test được",
    "Engineer viết prompt như hợp đồng đầu vào, đầu ra, ví dụ và tiêu chí kiểm.",
    "gate",
    [
      { label: "Goal", caption: "việc cần hoàn tất", tone: "data" },
      { label: "Context", caption: "dữ kiện được phép dùng", tone: "data" },
      { label: "Schema", caption: "format máy đọc được", tone: "model" },
      { label: "Eval", caption: "tiêu chí pass/fail", tone: "serve" },
    ],
    ["Có ví dụ lỗi không", "Có định dạng máy đọc không"]
  ),
  gpt: brief(
    "gpt",
    "GPT sinh token kế tiếp",
    "Mô hình tự hồi quy dùng context trước đó để chọn token tiếp theo.",
    "pipeline",
    [
      { label: "Context", caption: "token đã thấy", tone: "data" },
      { label: "Logits", caption: "điểm cho vocab", tone: "compute" },
      { label: "Sampling", caption: "chọn token", tone: "model" },
      { label: "Token mới", caption: "nối vào context", tone: "serve" },
    ],
    ["Kiểm temperature", "Đo hallucination bằng nguồn"]
  ),
  bert: brief(
    "bert",
    "BERT đọc hai chiều để hiểu",
    "Masked language modeling buộc model nhìn trái, phải rồi lấp token bị che.",
    "pipeline",
    [
      { label: "Câu", caption: "context hai phía", tone: "data" },
      { label: "Mask", caption: "token bị che", tone: "risk" },
      { label: "Encoder", caption: "biểu diễn ngữ cảnh", tone: "model" },
      { label: "Nhãn", caption: "phân loại hoặc NER", tone: "serve" },
    ],
    ["Fine-tune lớp đầu ra", "Giới hạn 512 token"]
  ),
  tokenization: brief(
    "tokenization",
    "Tokenization quyết định chi phí đầu vào",
    "Cùng một câu có thể thành số token rất khác nhau tùy tokenizer.",
    "pipeline",
    [
      { label: "Text", caption: "câu người dùng", tone: "data" },
      { label: "Tokenizer", caption: "cắt thành mảnh", tone: "compute" },
      { label: "Token IDs", caption: "số đưa vào model", tone: "model" },
      { label: "Model", caption: "đọc chuỗi ID", tone: "serve" },
    ],
    ["Đếm token tiếng Việt", "Giữ tokenizer khớp model"]
  ),
  "tokenizer-comparison": brief(
    "tokenizer-comparison",
    "Tokenizer chia chữ theo chiến lược",
    "BPE, WordPiece và SentencePiece có cách cắt khác nhau, kéo theo chi phí khác nhau.",
    "matrix",
    [
      { label: "BPE", caption: "ghép cặp phổ biến", tone: "compute" },
      { label: "WordPiece", caption: "ưu tiên likelihood", tone: "model" },
      { label: "SentencePiece", caption: "không cần tách từ trước", tone: "data" },
      { label: "Thống kê", caption: "đếm token thật", tone: "serve" },
    ],
    ["So token trên dữ liệu thật", "Không đổi tokenizer tùy tiện"]
  ),
  "kv-cache": brief(
    "kv-cache",
    "KV cache nhớ để khỏi tính lại",
    "Key và value cũ được lưu, nên token mới không phải chạy lại toàn bộ context.",
    "pipeline",
    [
      { label: "Prompt", caption: "context ban đầu", tone: "data" },
      { label: "K/V cũ", caption: "đã lưu trong cache", tone: "model" },
      { label: "Token mới", caption: "chỉ tính phần mới", tone: "compute" },
      { label: "Tốc độ", caption: "decode nhanh hơn", tone: "serve" },
    ],
    ["Tính bộ nhớ cache", "Theo dõi context dài"]
  ),
  temperature: brief(
    "temperature",
    "Temperature chỉnh phân phối token",
    "Nhiệt thấp làm phân phối nhọn, nhiệt cao mở thêm lựa chọn.",
    "tradeoff",
    [
      { label: "Logits", caption: "điểm trước sampling", tone: "data" },
      { label: "Scale", caption: "chia theo temperature", tone: "compute" },
      { label: "Distribution", caption: "nhọn hoặc phẳng", tone: "model" },
      { label: "Sample", caption: "token được chọn", tone: "serve" },
    ],
    ["Việc thật để nhiệt thấp", "Đo nhiều run"]
  ),
  "top-k-top-p": brief(
    "top-k-top-p",
    "Top-k và top-p lọc vocab",
    "Bộ lọc giới hạn ứng viên trước khi sampling để cân bằng đa dạng và lỗi.",
    "gate",
    [
      { label: "Vocab", caption: "toàn bộ ứng viên", tone: "data" },
      { label: "Top-k", caption: "giữ k token", tone: "compute" },
      { label: "Top-p", caption: "giữ theo xác suất cộng dồn", tone: "model" },
      { label: "Token", caption: "ứng viên sau lọc", tone: "serve" },
    ],
    ["So entropy output", "Tránh lọc quá hẹp"]
  ),
  "beam-search": brief(
    "beam-search",
    "Beam search giữ nhiều giả thuyết",
    "Decoder giữ vài chuỗi tốt nhất thay vì chốt một token duy nhất.",
    "pipeline",
    [
      { label: "Beam", caption: "nhóm chuỗi đang xét", tone: "data" },
      { label: "Mở nhánh", caption: "thử token kế", tone: "compute" },
      { label: "Chấm điểm", caption: "xếp chuỗi tạm", tone: "model" },
      { label: "Chuỗi chọn", caption: "đáp án cuối", tone: "serve" },
    ],
    ["Chặn lặp câu", "Cân chi phí beam size"]
  ),
  "context-window": brief(
    "context-window",
    "Context window là ngân sách token",
    "Model chỉ nhìn phần nằm trong cửa sổ, nên thứ tự và nén context rất quan trọng.",
    "tradeoff",
    [
      { label: "Tài liệu", caption: "nội dung dài", tone: "data" },
      { label: "Chunk", caption: "phần được chọn", tone: "compute" },
      { label: "Prompt", caption: "token vào model", tone: "model" },
      { label: "Output", caption: "token còn lại", tone: "serve" },
    ],
    ["Đặt dữ kiện chính lên trước", "Đếm input và output token"]
  ),
  "fine-tuning": brief(
    "fine-tuning",
    "Fine-tuning đổi weights theo domain",
    "Huấn luyện thêm trên dữ liệu chuyên biệt khi prompt không đủ ổn định.",
    "pipeline",
    [
      { label: "Base model", caption: "kiến thức nền", tone: "model" },
      { label: "Dataset", caption: "dữ liệu domain", tone: "data" },
      { label: "Cập nhật", caption: "weights đổi nhẹ", tone: "compute" },
      { label: "Model mới", caption: "hành vi ổn hơn", tone: "serve" },
    ],
    ["Có tập đánh giá riêng", "Canh overfitting"]
  ),
  lora: brief(
    "lora",
    "LoRA học đường phụ nhỏ",
    "Weights gốc đóng băng, ma trận low-rank học phần hiệu chỉnh.",
    "pipeline",
    [
      { label: "W frozen", caption: "weights gốc giữ nguyên", tone: "model" },
      { label: "A", caption: "chiếu xuống rank thấp", tone: "compute" },
      { label: "B", caption: "chiếu ngược lên", tone: "compute" },
      { label: "Merge", caption: "cộng phần hiệu chỉnh", tone: "serve" },
    ],
    ["Theo rank và alpha", "Lưu adapter riêng"]
  ),
  qlora: brief(
    "qlora",
    "QLoRA nén base, học adapter",
    "Base 4-bit giảm VRAM, LoRA vẫn học phần cần sửa trên GPU nhỏ hơn.",
    "stack",
    [
      { label: "4-bit base", caption: "backbone đã nén", tone: "model" },
      { label: "NF4", caption: "kiểu nén cho weights", tone: "compute" },
      { label: "LoRA", caption: "adapter được học", tone: "data" },
      { label: "Output", caption: "chất lượng sau tinh chỉnh", tone: "serve" },
    ],
    ["Kiểm VRAM thật", "Theo chất lượng sau merge"]
  ),
  "fine-tuning-vs-prompting": brief(
    "fine-tuning-vs-prompting",
    "Chọn prompt hay fine-tuning bằng bằng chứng",
    "Bắt đầu bằng prompt, chỉ fine-tune khi lỗi lặp lại và có dữ liệu tốt.",
    "gate",
    [
      { label: "Prompt", caption: "baseline rẻ", tone: "data" },
      { label: "Eval", caption: "lỗi có lặp không", tone: "serve" },
      { label: "Dữ liệu", caption: "đủ sạch để học", tone: "model" },
      { label: "Fine-tune", caption: "đổi hành vi bền", tone: "compute" },
    ],
    ["So chi phí vòng đời", "Giữ baseline prompt"]
  ),
  quantization: brief(
    "quantization",
    "Quantization giảm bit để chạy rẻ",
    "Đổi FP32 sang FP16, INT8 hoặc INT4 để giảm bộ nhớ và tăng tốc inference.",
    "tradeoff",
    [
      { label: "FP32", caption: "đầy đủ và nặng", tone: "data" },
      { label: "FP16", caption: "nhanh hơn trên GPU", tone: "compute" },
      { label: "INT8", caption: "gọn cho inference", tone: "model" },
      { label: "INT4", caption: "rất gọn, dễ mất chất lượng", tone: "risk" },
    ],
    ["Đo chất lượng sau nén", "Cẩn thận outlier"]
  ),
  distillation: brief(
    "distillation",
    "Student học từ teacher",
    "Model nhỏ học phân phối và cách trả lời của model lớn để chạy nhanh hơn.",
    "pipeline",
    [
      { label: "Teacher", caption: "model lớn", tone: "model" },
      { label: "Soft labels", caption: "tín hiệu mềm", tone: "data" },
      { label: "Student", caption: "model nhỏ học theo", tone: "compute" },
      { label: "Deploy", caption: "rẻ và nhanh hơn", tone: "serve" },
    ],
    ["So chất lượng trên tập khó", "Đo latency thật"]
  ),
  pruning: brief(
    "pruning",
    "Pruning bỏ phần ít đóng góp",
    "Weights hoặc neuron yếu được loại bỏ để giảm compute mà vẫn giữ chất lượng.",
    "pipeline",
    [
      { label: "Model", caption: "mạng ban đầu", tone: "model" },
      { label: "Score", caption: "độ quan trọng", tone: "compute" },
      { label: "Prune", caption: "cắt phần yếu", tone: "risk" },
      { label: "Sparse", caption: "mạng gọn hơn", tone: "serve" },
    ],
    ["Fine-tune sau cắt", "Đo tốc độ thực tế"]
  ),
  "mixed-precision": brief(
    "mixed-precision",
    "Mixed precision chia việc theo dtype",
    "FP16 hoặc BF16 tăng tốc, FP32 giữ phần cần ổn định.",
    "tradeoff",
    [
      { label: "FP32 master", caption: "weights ổn định", tone: "data" },
      { label: "FP16 compute", caption: "matmul nhanh", tone: "compute" },
      { label: "Loss scaling", caption: "chống underflow", tone: "risk" },
      { label: "Update", caption: "cập nhật an toàn", tone: "serve" },
    ],
    ["Theo underflow gradient", "Dùng BF16 nếu có"]
  ),
  rag: brief(
    "rag",
    "RAG nối câu hỏi với nguồn",
    "Hệ thống retrieve đoạn liên quan rồi đưa vào prompt để model trả lời có căn cứ.",
    "pipeline",
    [
      { label: "Query", caption: "câu hỏi người dùng", tone: "data" },
      { label: "Retrieve", caption: "tìm đoạn liên quan", tone: "compute" },
      { label: "Context", caption: "nguồn vào prompt", tone: "model" },
      { label: "Answer", caption: "trả lời kèm căn cứ", tone: "serve" },
    ],
    ["Hiện nguồn rõ", "Đo faithfulness"]
  ),
  "agentic-rag": brief(
    "agentic-rag",
    "Agentic RAG biết khi nào tìm lại",
    "Agent lên kế hoạch, truy xuất, kiểm chứng rồi retry khi bằng chứng yếu.",
    "loop",
    [
      { label: "Plan", caption: "cần tìm gì", tone: "model" },
      { label: "Retrieve", caption: "lấy nguồn", tone: "compute" },
      { label: "Verify", caption: "đủ bằng chứng chưa", tone: "serve" },
      { label: "Retry", caption: "tìm lại khi yếu", tone: "risk" },
    ],
    ["Giới hạn số bước", "Log từng quyết định"]
  ),
  "vector-databases": brief(
    "vector-databases",
    "Vector DB lưu ý nghĩa để tìm",
    "Embedding được index để tìm các đoạn gần nhau theo nghĩa, không chỉ theo từ khóa.",
    "pipeline",
    [
      { label: "Text", caption: "đoạn tài liệu", tone: "data" },
      { label: "Embedding", caption: "vector ngữ nghĩa", tone: "model" },
      { label: "Index", caption: "cấu trúc truy vấn nhanh", tone: "compute" },
      { label: "Nearest", caption: "láng giềng gần nhất", tone: "serve" },
    ],
    ["Chọn metric phù hợp", "Theo recall và latency"]
  ),
  faiss: brief(
    "faiss",
    "FAISS tăng tốc tìm vector",
    "Index gần đúng giúp tìm láng giềng nhanh trên hàng triệu vector.",
    "pipeline",
    [
      { label: "Vector", caption: "embedding đã lưu", tone: "data" },
      { label: "Index", caption: "IVF, HNSW hoặc PQ", tone: "model" },
      { label: "Probe", caption: "tìm vùng gần", tone: "compute" },
      { label: "Neighbors", caption: "kết quả gần nhất", tone: "serve" },
    ],
    ["Tune nprobe hoặc ef", "Đo recall với ground truth"]
  ),
  "semantic-search": brief(
    "semantic-search",
    "Semantic search tìm theo ý",
    "Câu hỏi và tài liệu được chiếu vào cùng không gian vector để so khoảng cách.",
    "pipeline",
    [
      { label: "Query", caption: "ý người dùng", tone: "data" },
      { label: "Embedding", caption: "vector truy vấn", tone: "model" },
      { label: "Distance", caption: "khoảng cách ý nghĩa", tone: "compute" },
      { label: "Result", caption: "đoạn gần nghĩa", tone: "serve" },
    ],
    ["Đọc đoạn gốc", "Thử câu hỏi paraphrase"]
  ),
  "hybrid-search": brief(
    "hybrid-search",
    "Hybrid search ghép chữ và nghĩa",
    "BM25 bắt keyword chính xác, vector bắt ý tương đồng, merger cân bằng hai điểm.",
    "pipeline",
    [
      { label: "BM25", caption: "khớp từ khóa", tone: "compute" },
      { label: "Vector", caption: "khớp ngữ nghĩa", tone: "model" },
      { label: "Merge", caption: "gộp và chuẩn hóa điểm", tone: "compute" },
      { label: "Result", caption: "xếp hạng cuối", tone: "serve" },
    ],
    ["Tune alpha theo domain", "Giữ query có mã SKU"]
  ),
  "re-ranking": brief(
    "re-ranking",
    "Re-ranking đọc lại ứng viên",
    "Model mạnh hơn chấm lại top-k để đưa kết quả đúng nhất lên đầu.",
    "pipeline",
    [
      { label: "Top-k", caption: "ứng viên từ retrieval", tone: "data" },
      { label: "Cross-encoder", caption: "đọc query và doc cùng lúc", tone: "model" },
      { label: "Score", caption: "điểm liên quan mới", tone: "compute" },
      { label: "Reorder", caption: "sắp lại thứ tự", tone: "serve" },
    ],
    ["Đo NDCG hoặc MRR", "Cân latency thêm"]
  ),
  chunking: brief(
    "chunking",
    "Chunking chia tài liệu để retrieve",
    "Đoạn quá dài loãng ý, đoạn quá ngắn mất ngữ cảnh.",
    "tradeoff",
    [
      { label: "Document", caption: "văn bản dài", tone: "data" },
      { label: "Chunk size", caption: "độ dài mỗi đoạn", tone: "compute" },
      { label: "Overlap", caption: "phần nối ngữ cảnh", tone: "model" },
      { label: "Chunks", caption: "đưa vào embedding", tone: "serve" },
    ],
    ["Test trên câu hỏi thật", "Theo nguồn bị cắt"]
  ),
  "embedding-model": brief(
    "embedding-model",
    "Embedding model biến câu thành vector",
    "Chất lượng embedding quyết định semantic search và clustering có đáng tin không.",
    "pipeline",
    [
      { label: "Sentence", caption: "câu đầu vào", tone: "data" },
      { label: "Encoder", caption: "model tạo embedding", tone: "model" },
      { label: "Vector", caption: "tọa độ ngữ nghĩa", tone: "compute" },
      { label: "Distance", caption: "so ý gần xa", tone: "serve" },
    ],
    ["Benchmark trên tiếng Việt", "Không trộn model khác nhau"]
  ),
  bm25: brief(
    "bm25",
    "BM25 chấm điểm từ khóa",
    "Tần suất từ, độ dài tài liệu và độ hiếm từ quyết định điểm xếp hạng.",
    "matrix",
    [
      { label: "Query terms", caption: "từ khóa cần tìm", tone: "data" },
      { label: "TF", caption: "tần suất trong doc", tone: "compute" },
      { label: "IDF", caption: "độ hiếm của từ", tone: "model" },
      { label: "Score", caption: "điểm xếp hạng", tone: "serve" },
    ],
    ["Normalize tiếng Việt", "Giữ cho truy vấn mã số"]
  ),
  "function-calling": brief(
    "function-calling",
    "Function calling nối model với tool",
    "Model sinh lời gọi hàm có schema, hệ thống chạy tool rồi trả kết quả lại.",
    "gate",
    [
      { label: "Intent", caption: "việc cần làm", tone: "data" },
      { label: "Schema", caption: "tham số hợp lệ", tone: "model" },
      { label: "Tool call", caption: "lệnh được gọi", tone: "compute" },
      { label: "Result", caption: "dữ liệu quay lại", tone: "serve" },
    ],
    ["Validate arguments", "Chặn tool nguy hiểm"]
  ),
  "react-framework": brief(
    "react-framework",
    "ReAct xen kẽ nghĩ và làm",
    "Agent ghi reasoning ngắn, chọn action, đọc observation rồi quyết định bước tiếp.",
    "loop",
    [
      { label: "Thought", caption: "lý do bước kế", tone: "model" },
      { label: "Action", caption: "tool hoặc thao tác", tone: "compute" },
      { label: "Observation", caption: "kết quả vừa thấy", tone: "data" },
      { label: "Answer", caption: "kết luận sau vòng lặp", tone: "serve" },
    ],
    ["Giới hạn loop", "Log trace dễ đọc"]
  ),
  "agent-architecture": brief(
    "agent-architecture",
    "Agent cần bộ nhớ và quyền hạn rõ",
    "Perception, planner, memory và tools phải có ranh giới để debug được.",
    "stack",
    [
      { label: "Observe", caption: "đọc trạng thái", tone: "data" },
      { label: "Plan", caption: "chọn bước kế", tone: "model" },
      { label: "Act", caption: "gọi tool", tone: "compute" },
      { label: "Memory", caption: "lưu ngữ cảnh cần thiết", tone: "serve" },
    ],
    ["Quy định quyền tool", "Có điểm dừng con người"]
  ),
  orchestration: brief(
    "orchestration",
    "Orchestration điều phối nhiều dịch vụ",
    "Router chia việc cho model, tool, queue và evaluator theo trạng thái workflow.",
    "pipeline",
    [
      { label: "Request", caption: "việc đi vào hệ thống", tone: "data" },
      { label: "Router", caption: "chọn nhánh xử lý", tone: "model" },
      { label: "Workers", caption: "model và tool chạy việc", tone: "compute" },
      { label: "State", caption: "ghi tiến trình", tone: "serve" },
    ],
    ["Retry có idempotency", "Trace toàn tuyến"]
  ),
  "structured-outputs": brief(
    "structured-outputs",
    "Structured outputs khóa hình dạng trả lời",
    "Schema biến câu trả lời tự do thành JSON có thể validate và lưu.",
    "gate",
    [
      { label: "Prompt", caption: "nêu dữ liệu cần trích", tone: "data" },
      { label: "Schema", caption: "hình dạng bắt buộc", tone: "model" },
      { label: "JSON", caption: "đầu ra có cấu trúc", tone: "compute" },
      { label: "Validator", caption: "chặn sai kiểu", tone: "serve" },
    ],
    ["Test case sai schema", "Không parse bằng regex"]
  ),
  "computer-use": brief(
    "computer-use",
    "Computer use khép vòng nhìn và làm",
    "Agent nhìn màn hình, quyết định thao tác, click hoặc gõ, rồi quan sát lại.",
    "loop",
    [
      { label: "Screenshot", caption: "màn hình hiện tại", tone: "data" },
      { label: "Plan", caption: "bước thao tác", tone: "model" },
      { label: "Action", caption: "click hoặc gõ", tone: "compute" },
      { label: "Observe", caption: "kiểm kết quả", tone: "serve" },
    ],
    ["Có sandbox", "Chặn thao tác tốn tiền"]
  ),
  "model-serving": brief(
    "model-serving",
    "Model serving biến model thành API",
    "Server nhận request, batch, chạy inference và trả output trong SLO.",
    "pipeline",
    [
      { label: "Request", caption: "payload từ client", tone: "data" },
      { label: "Queue", caption: "xếp và batch", tone: "compute" },
      { label: "Inference", caption: "model chạy suy luận", tone: "model" },
      { label: "Response", caption: "trả về đúng SLO", tone: "serve" },
    ],
    ["Đo p95 latency", "Giới hạn payload"]
  ),
  "inference-optimization": brief(
    "inference-optimization",
    "Tối ưu inference là đổi latency lấy throughput",
    "Batching, KV cache, quantization và routing thay đổi chi phí mỗi request.",
    "tradeoff",
    [
      { label: "Request", caption: "nhu cầu tức thời", tone: "data" },
      { label: "Cache", caption: "tái dùng phần cũ", tone: "model" },
      { label: "Batch", caption: "gom để tăng throughput", tone: "compute" },
      { label: "Decode", caption: "token ra từng bước", tone: "serve" },
    ],
    ["Đo p50 và p95", "So chất lượng sau tối ưu"]
  ),
  mlops: brief(
    "mlops",
    "MLOps giữ vòng đời model có kiểm soát",
    "Data, training, deploy và monitoring phải có version để rollback được.",
    "loop",
    [
      { label: "Data", caption: "dataset có version", tone: "data" },
      { label: "Training", caption: "job có cấu hình", tone: "compute" },
      { label: "Registry", caption: "model được quản lý", tone: "model" },
      { label: "Monitor", caption: "theo dõi sau deploy", tone: "serve" },
    ],
    ["Version model và dataset", "Có rollback path"]
  ),
  containerization: brief(
    "containerization",
    "Container đóng gói môi trường chạy",
    "Image giữ code, runtime và dependency nhất quán giữa laptop, CI và production.",
    "stack",
    [
      { label: "Base image", caption: "hệ điều hành và CUDA", tone: "data" },
      { label: "Deps", caption: "thư viện cố định", tone: "compute" },
      { label: "App", caption: "code và model artifacts", tone: "model" },
      { label: "Runtime", caption: "chạy giống nhau", tone: "serve" },
    ],
    ["Pin CUDA và driver", "Scan image size"]
  ),
  monitoring: brief(
    "monitoring",
    "Monitoring phát hiện model xuống cấp",
    "Metrics, drift và lỗi người dùng cho biết khi model cần can thiệp.",
    "loop",
    [
      { label: "Input", caption: "phân phối đang đến", tone: "data" },
      { label: "Metric", caption: "chất lượng và latency", tone: "serve" },
      { label: "Alert", caption: "vượt ngưỡng", tone: "risk" },
      { label: "Incident", caption: "điều tra và sửa", tone: "compute" },
    ],
    ["Tách data drift và concept drift", "Có dashboard theo segment"]
  ),
  "edge-ai": brief(
    "edge-ai",
    "Edge AI chạy ngay trên thiết bị",
    "Model nhỏ chạy gần camera hoặc điện thoại để giảm mạng, latency và rủi ro dữ liệu.",
    "tradeoff",
    [
      { label: "Device", caption: "nơi dữ liệu sinh ra", tone: "data" },
      { label: "Model nhỏ", caption: "đủ nhẹ để chạy local", tone: "model" },
      { label: "Inference", caption: "không chờ cloud", tone: "compute" },
      { label: "Action", caption: "phản hồi tức thì", tone: "serve" },
    ],
    ["Đo pin và nhiệt", "Có fallback cloud"]
  ),
  "gpu-optimization": brief(
    "gpu-optimization",
    "GPU optimization bắt đầu từ profiler",
    "Timeline cho thấy kernel, memory copy và idle gap nào đang làm chậm training hoặc inference.",
    "pipeline",
    [
      { label: "Trace", caption: "timeline thật", tone: "data" },
      { label: "Kernel", caption: "phép tính trên GPU", tone: "compute" },
      { label: "Memory", caption: "HBM, SRAM, copy", tone: "risk" },
      { label: "Fix", caption: "batch, dtype hoặc kernel", tone: "serve" },
    ],
    ["Đo GPU utilization", "Không tối ưu khi chưa profile"]
  ),
  "cost-optimization": brief(
    "cost-optimization",
    "Cost optimization đo tiền theo task",
    "Cache, routing, batch API và context compression giảm chi phí mà không mù chất lượng.",
    "tradeoff",
    [
      { label: "Request", caption: "việc người dùng giao", tone: "data" },
      { label: "Cache", caption: "tránh gọi lại", tone: "model" },
      { label: "Router", caption: "chọn model vừa đủ", tone: "compute" },
      { label: "Cost", caption: "đô la mỗi task", tone: "serve" },
    ],
    ["Tính đô la mỗi task", "Giữ eval trước khi cắt"]
  ),
  "data-pipelines": brief(
    "data-pipelines",
    "Data pipeline biến dữ liệu thô thành dataset",
    "Ingest, validate, transform và version dữ liệu để training có thể lặp lại.",
    "pipeline",
    [
      { label: "Ingest", caption: "lấy dữ liệu thô", tone: "data" },
      { label: "Validate", caption: "kiểm schema", tone: "risk" },
      { label: "Transform", caption: "làm sạch và nối bảng", tone: "compute" },
      { label: "Dataset", caption: "đưa vào huấn luyện", tone: "serve" },
    ],
    ["Kiểm schema drift", "Lưu lineage"]
  ),
  "llm-evaluation": brief(
    "llm-evaluation",
    "LLM evaluation chặn lỗi trước deploy",
    "Offline eval và online eval cùng đo chất lượng, chi phí, latency và an toàn.",
    "gate",
    [
      { label: "Golden set", caption: "ca kiểm chuẩn", tone: "data" },
      { label: "Judge", caption: "chấm có rubric", tone: "model" },
      { label: "Shadow", caption: "chạy không ảnh hưởng user", tone: "compute" },
      { label: "Rollout", caption: "mở theo gate", tone: "serve" },
    ],
    ["Có human spot check", "Theo drift sau deploy"]
  ),
  "rag-evaluation": brief(
    "rag-evaluation",
    "RAG evaluation tách lỗi retrieval và generation",
    "Faithfulness, answer relevance và context relevance chỉ ra tầng nào đang hỏng.",
    "matrix",
    [
      { label: "Retrieval", caption: "nguồn có đúng không", tone: "compute" },
      { label: "Context", caption: "đủ bằng chứng không", tone: "data" },
      { label: "Answer", caption: "trả lời bám nguồn không", tone: "model" },
      { label: "Scores", caption: "đọc lỗi theo tầng", tone: "serve" },
    ],
    ["Mở nguồn đối chiếu", "Đừng chỉ chấm đáp án"]
  ),
  "agent-evaluation": brief(
    "agent-evaluation",
    "Agent evaluation đo cả đường đi",
    "Không chỉ xem answer cuối, phải đo tool call, số bước, an toàn và phục hồi lỗi.",
    "loop",
    [
      { label: "Task", caption: "việc được giao", tone: "data" },
      { label: "Trace", caption: "đường agent đã đi", tone: "model" },
      { label: "Tool result", caption: "hành động có đúng không", tone: "compute" },
      { label: "Score", caption: "đạt mục tiêu và an toàn", tone: "serve" },
    ],
    ["Replay trace lỗi", "Đặt ngân sách bước"]
  ),
  "observability-for-ai": brief(
    "observability-for-ai",
    "Observability nối trace, log và metric",
    "Mỗi request cần thấy retrieval, tool, model call, token, latency và lỗi.",
    "stack",
    [
      { label: "Trace", caption: "đường đi request", tone: "model" },
      { label: "Logs", caption: "sự kiện có cấu trúc", tone: "data" },
      { label: "Metrics", caption: "latency, token, lỗi", tone: "serve" },
      { label: "Alert", caption: "bất thường cần xử lý", tone: "risk" },
    ],
    ["Ẩn PII trong log", "Gắn request ID"]
  ),
  "cost-latency-tokens": brief(
    "cost-latency-tokens",
    "Token economics tính chi phí production",
    "Input token, output token, TTFT và decode rate quyết định trải nghiệm và tiền.",
    "tradeoff",
    [
      { label: "Input", caption: "token đi vào", tone: "data" },
      { label: "TTFT", caption: "chữ đầu xuất hiện", tone: "serve" },
      { label: "Decode", caption: "token mỗi giây", tone: "compute" },
      { label: "Cost", caption: "tiền mỗi task", tone: "model" },
    ],
    ["Tính break-even", "Đo theo task thật"]
  ),
  "canary-releases-llm": brief(
    "canary-releases-llm",
    "Canary rollout giảm rủi ro đổi model",
    "Shadow, 1%, 10% rồi 100% giúp bắt lỗi trước khi toàn bộ người dùng gặp.",
    "gate",
    [
      { label: "Shadow", caption: "so sánh âm thầm", tone: "data" },
      { label: "1%", caption: "mở rất nhỏ", tone: "compute" },
      { label: "10%", caption: "đo trên traffic thật", tone: "model" },
      { label: "Rollback", caption: "rút khi SLO vỡ", tone: "risk" },
    ],
    ["Gate bằng eval và SLO", "Rollback tự động"]
  ),
  "prompt-injection-defense": brief(
    "prompt-injection-defense",
    "Prompt injection cần phòng thủ nhiều lớp",
    "Không lớp nào đủ một mình, nên input, retrieval, tool và output đều cần guard.",
    "gate",
    [
      { label: "Input", caption: "lọc yêu cầu trực tiếp", tone: "data" },
      { label: "Policy", caption: "luật ưu tiên instruction", tone: "model" },
      { label: "Tool allowlist", caption: "chỉ mở tool cần thiết", tone: "compute" },
      { label: "Output", caption: "kiểm trước khi trả", tone: "serve" },
    ],
    ["Test indirect injection", "Tách instruction khỏi data"]
  ),
  guardrails: brief(
    "guardrails",
    "Guardrails giữ sản phẩm trong vùng cho phép",
    "Policy, classifier, schema và human review giảm hành vi nguy hiểm.",
    "gate",
    [
      { label: "Input", caption: "yêu cầu đi vào", tone: "data" },
      { label: "Policy", caption: "luật cho phép", tone: "model" },
      { label: "Filter", caption: "chặn hoặc sửa", tone: "compute" },
      { label: "Fallback", caption: "trả lời an toàn", tone: "serve" },
    ],
    ["Đo false refusal", "Có đường báo lỗi"]
  ),
  "red-teaming": brief(
    "red-teaming",
    "Red teaming thử phá trước khi người dùng phá",
    "Đội kiểm thử dùng prompt xấu, dữ liệu độc và tool abuse để tìm lỗ hổng.",
    "loop",
    [
      { label: "Attack", caption: "payload hoặc kịch bản", tone: "risk" },
      { label: "Run", caption: "chạy trên hệ thống", tone: "compute" },
      { label: "Observe", caption: "ghi hành vi sai", tone: "data" },
      { label: "Fix", caption: "vá và kiểm lại", tone: "serve" },
    ],
    ["Ghi payload tái lập", "Ưu tiên lỗi nghiêm trọng"]
  ),
  hallucination: brief(
    "hallucination",
    "Hallucination cần nguồn kiểm",
    "Câu trả lời trôi chảy phải đi qua claim extraction, retrieval và verification.",
    "gate",
    [
      { label: "Claim", caption: "mệnh đề cần kiểm", tone: "data" },
      { label: "Source", caption: "nguồn độc lập", tone: "compute" },
      { label: "Compare", caption: "khớp hay lệch", tone: "model" },
      { label: "Answer", caption: "nêu chắc hoặc không biết", tone: "serve" },
    ],
    ["Bắt buộc citation", "Tách không biết khỏi bịa"]
  ),
} satisfies Record<string, PathVisualBriefData>;
