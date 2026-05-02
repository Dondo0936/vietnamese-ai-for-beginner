/**
 * Source: https://github.com/josephmisiti/awesome-machine-learning
 * Filtered to .md files committed in the last 12 months as of 2026-04.
 * Vietnamese editorial layer applied per writing-vietnamese-technical
 * (no em-dash; English tech terms inline; period/colon over em-dash).
 */

export type ItemTag = {
  kind: "free" | "paid" | "fresh" | "cls" | "fmt";
  label: string;
};

export type Item = {
  title: string;
  href: string;
  desc: string;
  tags?: ItemTag[];
};

export type Cat = {
  title: string;
  count: string;
  items: Item[];
};

/**
 * Curriculum steps allow inline external links by interleaving plain
 * strings and link objects in a `segments` array. The renderer just
 * walks the array.
 */
export type StepSegment = string | { href: string; label: string };

export type Step = {
  title: string;
  segments: StepSegment[];
};

export type EventItem = {
  pin: string;
  title: string;
  desc: string;
  href: string;
};

export type EventCat = {
  title: string;
  count: string;
  events: EventItem[];
};

export type Section =
  | {
      kind: "list";
      id: string;
      num: string;
      title: string;
      desc: string;
      cats: Cat[];
    }
  | {
      kind: "curriculum";
      id: string;
      num: string;
      title: string;
      desc: string;
      intro: string;
      quote: string;
      steps: Step[];
    }
  | {
      kind: "events";
      id: string;
      num: string;
      title: string;
      desc: string;
      cats: EventCat[];
    };

const TAG_FREE: ItemTag = { kind: "free", label: "Miễn phí" };
const TAG_FREE_PDF: ItemTag = { kind: "free", label: "PDF online" };
const TAG_PDF: ItemTag = { kind: "free", label: "PDF" };
const TAG_FREE_AUDIT: ItemTag = { kind: "free", label: "Miễn phí (audit)" };
const TAG_AUDIT_FREE: ItemTag = { kind: "free", label: "Audit miễn phí" };
const TAG_AUDIT: ItemTag = { kind: "free", label: "Audit" };
const TAG_PAID: ItemTag = { kind: "paid", label: "Trả phí" };
const TAG_PAID_CERT: ItemTag = { kind: "paid", label: "$ chứng chỉ" };
const TAG_FRESH_NEW: ItemTag = { kind: "fresh", label: "Mới" };
const TAG_FRESH_2025: ItemTag = { kind: "fresh", label: "2025" };
const TAG_FRESH_2023: ItemTag = { kind: "fresh", label: "2023" };
const TAG_FRESH_NEW_EDITION: ItemTag = { kind: "fresh", label: "Ấn bản mới" };
const TAG_FRESH_V2: ItemTag = { kind: "fresh", label: "Phiên bản 2" };
const TAG_FRESH_V3: ItemTag = { kind: "fresh", label: "Phiên bản 3" };
const TAG_FRESH_VISUAL: ItemTag = { kind: "fresh", label: "Visual" };
const TAG_CLS_STANFORD: ItemTag = { kind: "cls", label: "Stanford" };
const TAG_CLS_MIT: ItemTag = { kind: "cls", label: "MIT" };
const TAG_CLS_BERKELEY: ItemTag = { kind: "cls", label: "Berkeley" };
const TAG_FMT_PYTHON: ItemTag = { kind: "fmt", label: "+ mã Python" };
const TAG_FMT_R: ItemTag = { kind: "fmt", label: "+ mã R" };
const TAG_FMT_CODE: ItemTag = { kind: "fmt", label: "+ mã" };
const TAG_FMT_NOTEBOOK: ItemTag = { kind: "fmt", label: "Notebook" };
const TAG_FMT_PRINT: ItemTag = { kind: "fmt", label: "Sách giấy" };
const TAG_FMT_PRINT_PDF: ItemTag = { kind: "fmt", label: "Sách giấy / PDF" };
const TAG_FMT_FA: ItemTag = { kind: "fmt", label: "Có hỗ trợ tài chính" };
const TAG_FREE_ONLINE: ItemTag = { kind: "free", label: "Đọc online" };

export const RESOURCES_META = {
  title: "Tài nguyên Học máy",
  eyebrow: "Cập nhật tháng 4 · 2026",
  h1: "Tủ sách Học máy",
  h1Italic: "được tuyển chọn",
  h1Tail: ", dịch sang tiếng Việt.",
  lede:
    "Bộ sưu tập sách, khóa học, blog và lộ trình do cộng đồng awesome-machine-learning tổng hợp. Chỉ giữ lại các nguồn vẫn được duy trì trong vòng 12 tháng qua. Mỗi mục được dịch và chú thích để bạn hiểu nhanh trước khi nhấp.",
  meta: [
    { value: "5", text: "tệp Markdown, gốc tiếng Anh" },
    { value: "80+", text: "mục đã dịch" },
  ],
  source: {
    label: "Nguồn",
    href: "https://github.com/josephmisiti/awesome-machine-learning",
    text: "github.com/josephmisiti/awesome-machine-learning",
  },
  asideSource: {
    title: "Về danh sách này",
    body:
      "Chúng tôi chỉ tuyển chọn các tệp .md trong repo awesome-machine-learning đã có commit trong 12 tháng gần nhất. Các tệp events.md và meetups.md được giữ nguyên vì repo gốc đánh dấu là tài nguyên thường trực.",
    linkLabel: "Xem nguồn gốc",
    linkHref: "https://github.com/josephmisiti/awesome-machine-learning",
  },
  scope: [
    { label: "README chính", count: "04 / 26" },
    { label: "books.md", count: "2025" },
    { label: "courses.md", count: "2025" },
    { label: "blogs.md", count: "2025" },
    { label: "ml-curriculum.md", count: "2025" },
  ],
} as const;

export const SECTIONS: Section[] = [
  /* ─── 01 · Sách ─── */
  {
    kind: "list",
    id: "books",
    num: "01",
    title: "Sách",
    desc:
      "Sách miễn phí và mã nguồn mở về học máy, thống kê, khai phá dữ liệu. Phần lớn đọc trực tiếp trên web.",
    cats: [
      {
        title: "Học máy và Khai phá dữ liệu",
        count: "16 mục",
        items: [
          {
            title: "Probabilistic Machine Learning",
            href: "https://probml.github.io/pml-book/book1.html",
            desc:
              "Kevin P. Murphy, ấn bản 2022. Sách 'phải đọc' cho nghiên cứu sinh. Phủ đầy đủ nền tảng tối ưu, lý thuyết quyết định, đại số tuyến tính trước khi đi vào học sâu hiện đại.",
            tags: [TAG_FREE, TAG_FREE_PDF, TAG_FRESH_NEW_EDITION],
          },
          {
            title: "Probabilistic ML: Advanced Topics",
            href: "https://probml.github.io/pml-book/book2.html",
            desc:
              "Phần tiếp theo, ấn bản 2023. Tập trung vào các chủ đề chuyên sâu hơn như diffusion và mô hình sinh.",
            tags: [TAG_FREE, TAG_FREE_PDF, TAG_FRESH_2023],
          },
          {
            title: "The Hundred-Page Machine Learning Book",
            href: "http://themlbook.com/wiki/doku.php",
            desc:
              "Cuốn sách 100 trang gói gọn toàn bộ kiến thức học máy cốt lõi. Đọc nhanh, ôn tập tốt.",
            tags: [TAG_FMT_PRINT_PDF],
          },
          {
            title: "An Introduction to Statistical Learning (R)",
            href: "https://drive.google.com/file/d/106d-rN7cXpyAkgrUqjcPONNCyO-rX7MQ/view",
            desc:
              "Sách 'vỡ lòng' về học thống kê kèm mã R. Dễ tiếp cận hơn cuốn ESL của cùng nhóm tác giả.",
            tags: [TAG_FREE, TAG_FMT_R],
          },
          {
            title: "An Introduction to Statistical Learning (Python)",
            href: "https://drive.google.com/file/d/1ajFkHO6zjrdGNqhqW1jKBZdiNGh_8YQ1/view",
            desc:
              "Phiên bản Python của ISL. Cùng nội dung, đổi ngôn ngữ thực hành.",
            tags: [TAG_FREE, TAG_FMT_PYTHON],
          },
          {
            title: "The Elements of Statistical Learning",
            href: "https://web.stanford.edu/~hastie/ElemStatLearn/",
            desc:
              "Kinh điển của Hastie, Tibshirani, Friedman. Toán nặng, dành cho người đã quen ISL.",
            tags: [TAG_FREE],
          },
          {
            title: "Probabilistic Programming và Bayesian Methods for Hackers",
            href: "http://camdavidsonpilon.github.io/Probabilistic-Programming-and-Bayesian-Methods-for-Hackers/",
            desc:
              "Bayes 'qua mã': toàn bộ là Jupyter Notebook tương tác. Phù hợp dân kỹ thuật ngại công thức.",
            tags: [TAG_FREE, TAG_FMT_NOTEBOOK],
          },
          {
            title: "Think Bayes",
            href: "https://greenteapress.com/wp/think-bayes/",
            desc:
              "Allen Downey. Học Bayes bằng mã Python, không cần giải tích nâng cao.",
            tags: [TAG_FREE, TAG_FMT_PYTHON],
          },
          {
            title: "Reinforcement Learning: An Introduction",
            href: "http://incompleteideas.net/book/the-book-2nd.html",
            desc:
              "Sutton và Barto. Sách giáo khoa chuẩn của RL, ấn bản 2.",
            tags: [TAG_FREE],
          },
          {
            title: "Mining Massive Datasets",
            href: "http://infolab.stanford.edu/~ullman/mmds/book.pdf",
            desc:
              "Stanford. Kỹ thuật xử lý dữ liệu cực lớn (MapReduce, MinHash, PageRank).",
            tags: [TAG_FREE],
          },
          {
            title: "Mathematics for Machine Learning",
            href: "https://mml-book.github.io/",
            desc:
              "Nền tảng toán cho ML: đại số tuyến tính, giải tích, xác suất, tối ưu. Đọc trước khi vào sách lý thuyết.",
            tags: [TAG_FREE],
          },
          {
            title: "Approaching (Almost) Any ML Problem",
            href: "https://github.com/abhishekkrthakur/approachingalmost",
            desc:
              "Abhishek Thakur. Quyển 'sổ tay' thực chiến từ Grandmaster Kaggle.",
            tags: [TAG_FMT_PRINT],
          },
          {
            title: "Distributed Machine Learning Patterns",
            href: "https://github.com/terrytangyuan/distributed-ml-patterns",
            desc:
              "Yuan Tang. Các pattern để mở rộng pipeline ML từ laptop đến cụm phân tán.",
            tags: [TAG_FREE_ONLINE, TAG_FMT_CODE],
          },
          {
            title: "Causal AI",
            href: "https://www.manning.com/books/causal-machine-learning",
            desc:
              "Robert Ness. Xây model AI biết suy luận nhân quả.",
            tags: [TAG_PAID],
          },
          {
            title: "Machine Learning System Design",
            href: "https://www.manning.com/books/machine-learning-system-design",
            desc:
              "Babushkin và Kravchenko. Cách lên kế hoạch và thiết kế hệ thống ML cho ra sản phẩm thật.",
            tags: [TAG_PAID],
          },
          {
            title: "AI Governance",
            href: "https://www.manning.com/books/ai-governance",
            desc:
              "Sổ tay dùng Generative AI an toàn và có hệ thống.",
            tags: [TAG_PAID, TAG_FRESH_NEW],
          },
        ],
      },
      {
        title: "Học sâu (Deep Learning)",
        count: "6 mục",
        items: [
          {
            title: "Deep Learning",
            href: "https://www.deeplearningbook.org/",
            desc:
              "Goodfellow, Bengio, Courville. Sách giáo khoa MIT Press, vẫn là tham chiếu chuẩn.",
            tags: [TAG_FREE_ONLINE],
          },
          {
            title: "Deep Learning with Python, 3rd ed.",
            href: "https://www.manning.com/books/deep-learning-with-python-third-edition",
            desc:
              "François Chollet. Bản cập nhật mới nhất, theo Keras 3.",
            tags: [TAG_PAID, TAG_FRESH_V3],
          },
          {
            title: "Grokking Deep Learning",
            href: "https://www.manning.com/books/grokking-deep-learning",
            desc:
              "Andrew Trask. Học sâu bằng cách viết lại từ đầu trong NumPy.",
            tags: [TAG_PAID],
          },
          {
            title: "Neural Networks and Deep Learning",
            href: "http://neuralnetworksanddeeplearning.com/",
            desc:
              "Michael Nielsen. Sách online, trực quan, lý tưởng cho người mới.",
            tags: [TAG_FREE],
          },
          {
            title: "Math và Architectures of Deep Learning",
            href: "https://www.manning.com/books/math-and-architectures-of-deep-learning",
            desc:
              "Toán phía sau từng kiến trúc DL phổ biến: CNN, RNN, Transformer.",
            tags: [TAG_PAID],
          },
          {
            title: "AI Model Evaluation",
            href: "https://www.manning.com/books/ai-model-evaluation",
            desc: "Sách mới về cách đánh giá model AI có hệ thống.",
            tags: [TAG_PAID, TAG_FRESH_NEW],
          },
        ],
      },
      {
        title: "Xử lý ngôn ngữ tự nhiên",
        count: "3 mục",
        items: [
          {
            title: "Natural Language Processing with Python (NLTK)",
            href: "https://www.nltk.org/book/",
            desc:
              "Sách online chính thức của thư viện NLTK. Vẫn là cửa ngõ cho người mới.",
            tags: [TAG_FREE],
          },
          {
            title: "NLP in Action, 2nd ed.",
            href: "https://www.manning.com/books/natural-language-processing-in-action-second-edition",
            desc:
              "Cập nhật cho thời đại Transformer: RAG, fine-tuning, đa ngôn ngữ.",
            tags: [TAG_PAID, TAG_FRESH_V2],
          },
          {
            title: "Transfer Learning for NLP",
            href: "https://www.manning.com/books/transfer-learning-for-natural-language-processing",
            desc:
              "Paul Azunre. Chuyển giao tri thức từ model lớn sang bài toán cụ thể.",
            tags: [TAG_PAID],
          },
        ],
      },
      {
        title: "Toán nền: Xác suất, Đại số tuyến tính, Tối ưu",
        count: "4 mục",
        items: [
          {
            title: "Think Stats",
            href: "https://www.greenteapress.com/thinkstats/",
            desc:
              "Allen Downey. Thống kê thực hành bằng Python, không công thức rườm rà.",
            tags: [TAG_FREE, TAG_FMT_CODE],
          },
          {
            title: "Convex Optimization",
            href: "https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf",
            desc:
              "Boyd và Vandenberghe. Kinh điển về tối ưu lồi.",
            tags: [TAG_PDF],
          },
          {
            title: "The Matrix Cookbook",
            href: "https://www.math.uwaterloo.ca/~hwolkowi/matrixcookbook.pdf",
            desc:
              "Sổ tay công thức ma trận. Luôn cần khi đạo hàm các model.",
            tags: [TAG_PDF],
          },
          {
            title: "The Math Behind Artificial Intelligence",
            href: "https://www.freecodecamp.org/news/the-math-behind-artificial-intelligence-book",
            desc:
              "FreeCodeCamp. Sách dẫn nhập toán cho AI, ngôn ngữ dễ tiếp cận.",
            tags: [TAG_FREE],
          },
        ],
      },
    ],
  },

  /* ─── 02 · Khóa học ─── */
  {
    kind: "list",
    id: "courses",
    num: "02",
    title: "Khóa học",
    desc:
      "Khóa học trực tuyến, miễn phí và trả phí, về học máy, thống kê, khai phá dữ liệu.",
    cats: [
      {
        title: "Nhập môn: chọn một trong số này",
        count: "6 mục",
        items: [
          {
            title: "Machine Learning · Andrew Ng",
            href: "https://www.coursera.org/learn/machine-learning",
            desc:
              "Khóa kinh điển trên Coursera. Vẫn là điểm khởi đầu được đề xuất nhiều nhất cho người mới.",
            tags: [TAG_FREE_AUDIT, TAG_CLS_STANFORD],
          },
          {
            title: "Deep Learning Specialization",
            href: "https://www.coursera.org/specializations/deep-learning",
            desc:
              "5 khóa nhỏ về mạng neural, CNN, RNN, Transformer. Do Andrew Ng và DeepLearning.AI tổ chức.",
            tags: [TAG_AUDIT_FREE, TAG_PAID_CERT],
          },
          {
            title: "Intro to Deep Learning · MIT",
            href: "https://introtodeeplearning.com/",
            desc:
              "Khóa ngắn của MIT, cập nhật mỗi năm. Bài giảng kèm lab thực hành.",
            tags: [TAG_FREE, TAG_CLS_MIT],
          },
          {
            title: "Practical Deep Learning · fast.ai",
            href: "https://www.fast.ai/",
            desc:
              "Triết lý 'code-first' của Jeremy Howard. Học bằng cách build model ngay.",
            tags: [TAG_FREE],
          },
          {
            title: "Machine Learning Crash Course · Google",
            href: "https://developers.google.com/machine-learning/crash-course/",
            desc:
              "Khóa rút gọn 15 giờ của Google, kèm bài tập tương tác.",
            tags: [TAG_FREE],
          },
          {
            title: "MLU-Explain · Amazon",
            href: "https://mlu-explain.github.io/",
            desc:
              "Giải thích trực quan, tương tác các khái niệm cốt lõi của ML.",
            tags: [TAG_FREE, TAG_FRESH_VISUAL],
          },
        ],
      },
      {
        title: "Chuyên sâu và nâng cao",
        count: "10 mục",
        items: [
          {
            title: "Reinforcement Learning · David Silver",
            href: "https://www.youtube.com/watch?v=2pWv7GOvuf0&list=PLzuuYNsE1EZAXYR4FJ75jcJseBmo4KQ9-",
            desc:
              "Bài giảng RL của David Silver (DeepMind). Playlist YouTube đầy đủ.",
            tags: [TAG_FREE],
          },
          {
            title: "CS231n · CNNs for Visual Recognition",
            href: "http://cs231n.github.io/",
            desc:
              "Khóa nổi tiếng của Stanford về thị giác máy tính: slide, bài tập, video.",
            tags: [TAG_FREE, TAG_CLS_STANFORD],
          },
          {
            title: "CS294 · Deep Reinforcement Learning",
            href: "http://rll.berkeley.edu/deeprlcourse/",
            desc:
              "UC Berkeley. RL chuyên sâu, có slide và video.",
            tags: [TAG_FREE, TAG_CLS_BERKELEY],
          },
          {
            title: "Probabilistic Graphical Models",
            href: "https://www.coursera.org/specializations/probabilistic-graphical-models",
            desc:
              "Daphne Koller. Chuyên đề Coursera 3 phần về mô hình đồ thị xác suất.",
            tags: [TAG_AUDIT, TAG_CLS_STANFORD],
          },
          {
            title: "Full-Stack Deep Learning",
            href: "https://fullstackdeeplearning.com/",
            desc:
              "Đưa model DL vào sản phẩm thật: MLOps, monitoring, deployment.",
            tags: [TAG_FREE],
          },
          {
            title: "MLOps Specialization",
            href: "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops",
            desc:
              "DeepLearning.AI. Chuyên về vận hành model ML ở quy mô production.",
            tags: [TAG_PAID, TAG_FMT_FA],
          },
          {
            title: "Open Machine Learning Course",
            href: "https://github.com/Yorko/mlcourse.ai",
            desc:
              "mlcourse.ai. Bài giảng kèm bài viết Medium, có cộng đồng tích cực.",
            tags: [TAG_FREE],
          },
          {
            title: "System Designer · ML Systems",
            href: "https://systemdesigner.net/ml-systems",
            desc:
              "28 bài học tương tác về training pipeline, model serving, feature store, monitoring.",
            tags: [TAG_FREE, TAG_FRESH_NEW],
          },
          {
            title: "System Designer · GenAI",
            href: "https://systemdesigner.net/genai",
            desc:
              "32 bài học về RAG, vector DB, agentic AI, deployment, kèm AI tutor và whiteboard.",
            tags: [TAG_FREE, TAG_FRESH_NEW],
          },
          {
            title: "Introduction to Data-Centric AI · MIT",
            href: "https://dcai.csail.mit.edu/",
            desc:
              "Lấy dữ liệu làm trung tâm thay vì model. Cách tiếp cận data-centric AI.",
            tags: [TAG_FREE, TAG_CLS_MIT],
          },
        ],
      },
      {
        title: "LLM và AI tạo sinh",
        count: "4 mục",
        items: [
          {
            title: "LLMOps · Comet",
            href: "https://www.comet.com/site/llm-course/",
            desc:
              "Xây ứng dụng thật bằng LLM, kèm phần thực hành đánh giá model.",
            tags: [TAG_FREE, TAG_FRESH_2025],
          },
          {
            title: "Prompt Engineering for Vision Models",
            href: "https://www.deeplearning.ai/short-courses/prompt-engineering-for-vision-models/",
            desc:
              "Khóa ngắn của DeepLearning.AI về prompt cho model thị giác.",
            tags: [TAG_FREE],
          },
          {
            title: "ML Observability Fundamentals",
            href: "https://arize.com/ml-observability-fundamentals/",
            desc:
              "Arize. Nguyên lý giám sát model ML khi đưa vào production.",
            tags: [TAG_FREE],
          },
          {
            title: "Kaggle Learn",
            href: "https://www.kaggle.com/learn/overview",
            desc:
              "Các micro-course rất ngắn về Pandas, ML, DL, máy tính lượng tử, có chứng chỉ.",
            tags: [TAG_FREE],
          },
        ],
      },
    ],
  },

  /* ─── 03 · Blog & Podcast ─── */
  {
    kind: "list",
    id: "blogs",
    num: "03",
    title: "Blog và Podcast",
    desc:
      "Đọc và nghe đều đặn để giữ nhịp với cộng đồng. Đã lọc theo các nguồn vẫn xuất bản trong năm qua.",
    cats: [
      {
        title: "Blog kỹ thuật",
        count: "12 mục",
        items: [
          {
            title: "Distill",
            href: "https://distill.pub",
            desc:
              "Bài viết tương tác chất lượng cao. Lý tưởng để hiểu các khái niệm phức tạp.",
          },
          {
            title: "Christopher Olah",
            href: "https://colah.github.io/",
            desc:
              "Giải thích trực quan các kiến trúc mạng (LSTM, attention, RNN).",
          },
          {
            title: "Andrej Karpathy",
            href: "https://karpathy.github.io/",
            desc:
              "Bài viết và YouTube về LLM, Transformer, từ 'zero to hero'.",
          },
          {
            title: "Sebastian Raschka",
            href: "https://sebastianraschka.com/",
            desc:
              "Tác giả sách Python ML. Newsletter và bài viết về LLM rất chắc tay.",
          },
          {
            title: "Lilian Weng",
            href: "https://lilianweng.github.io/",
            desc:
              "Bài tổng hợp dạng survey về RL, agent, diffusion. Lý tưởng để vào chủ đề mới.",
          },
          {
            title: "Andrew Trask",
            href: "https://iamtrask.github.io/",
            desc:
              "Tác giả Grokking Deep Learning. Chuyên về privacy-preserving ML.",
          },
          {
            title: "Jake VanderPlas",
            href: "https://jakevdp.github.io/",
            desc:
              "Python Data Science Handbook. Blog về NumPy, pandas, scikit-learn.",
          },
          {
            title: "Fennel Blog",
            href: "https://fennel.ai/blog/",
            desc:
              "Bài viết kỹ thuật về feature store và pipeline ML thực chiến.",
          },
          {
            title: "LightTag NLP Blog",
            href: "https://lighttag.io/blog",
            desc: "Annotation, dataset, kỹ thuật gán nhãn cho NLP.",
          },
          {
            title: "Kaggle Blog",
            href: "https://blog.kaggle.com/",
            desc: "Phỏng vấn winners, kỹ thuật cuộc thi, kernel hay.",
          },
          {
            title: "Shakir Mohamed",
            href: "http://blog.shakirm.com/",
            desc: "Bayesian deep learning, mô hình sinh, từ DeepMind.",
          },
          {
            title: "Yarin Gal",
            href: "https://www.cs.ox.ac.uk/people/yarin.gal/website/blog.html",
            desc: "Bayesian deep learning và uncertainty trong ML.",
          },
        ],
      },
      {
        title: "Podcast",
        count: "8 mục",
        items: [
          {
            title: "TWIML AI",
            href: "https://twimlai.com/shows/",
            desc:
              "This Week in ML và AI. Phỏng vấn dài, sâu, ra tập hàng tuần.",
          },
          {
            title: "Data Skeptic",
            href: "https://dataskeptic.com/",
            desc:
              "Tập ngắn giải thích khái niệm, thân thiện với người mới.",
          },
          {
            title: "Talking Machines",
            href: "https://www.thetalkingmachines.com/",
            desc:
              "Một trong những podcast ML lâu đời nhất, vẫn còn ra tập.",
          },
          {
            title: "DataTalks.Club",
            href: "https://anchor.fm/datatalksclub",
            desc:
              "Cộng đồng DTC. Phỏng vấn về MLOps, dữ liệu, sự nghiệp.",
          },
          {
            title: "Super Data Science · Jon Krohn",
            href: "https://www.youtube.com/@SuperDataScienceWithJonKrohn",
            desc: "Video kèm audio, nội dung kỹ thuật và hướng nghiệp.",
          },
          {
            title: "Machine Learning Guide",
            href: "http://ocdevel.com/podcasts/machine-learning",
            desc:
              "Podcast theo dạng giáo trình. Nghe theo thứ tự để học.",
          },
          {
            title: "AI Stories",
            href: "https://www.youtube.com/@aistoriespodcast",
            desc:
              "Phỏng vấn các nhà thực hành AI. Câu chuyện sự nghiệp.",
          },
          {
            title: "Learning Machines 101",
            href: "https://www.learningmachines101.com/",
            desc: "Khái niệm ML qua các tập 30 phút, định kỳ.",
          },
        ],
      },
      {
        title: "Newsletter",
        count: "5 mục",
        items: [
          {
            title: "The Batch",
            href: "https://read.deeplearning.ai/the-batch/",
            desc:
              "Newsletter hàng tuần của Andrew Ng. Cập nhật nghiên cứu và tin AI.",
          },
          {
            title: "AI Digest",
            href: "https://aidigest.net/",
            desc: "Tổng hợp tuần về AI, ML, DS.",
          },
          {
            title: "DataTalks.Club",
            href: "https://datatalks.club",
            desc: "Newsletter kèm cộng đồng Slack lớn về dữ liệu.",
          },
          {
            title: "BuzzRobot",
            href: "https://buzzrobot.substack.com/",
            desc: "Talks độc quyền của các researcher hàng đầu.",
          },
          {
            title: "Air Around AI",
            href: "https://airaroundai.substack.com/",
            desc:
              "Newsletter cho lãnh đạo và người làm sản phẩm.",
          },
        ],
      },
    ],
  },

  /* ─── 04 · Lộ trình ─── */
  {
    kind: "curriculum",
    id: "curriculum",
    num: "04",
    title: "Lộ trình cho người mới",
    desc:
      "Lộ trình do Sebastian Raschka đề xuất. Bắt đầu từ một khóa học cho người mới, rồi đi sâu dần vào sách kinh điển.",
    intro:
      "Nếu phải xếp lộ trình cho người mới hoàn toàn, tôi sẽ bắt đầu bằng một khóa nhập môn cơ bản, rồi mới chuyển sang sách 'data mining' và sau cùng là các sách lý thuyết thống kê. Mục tiêu không phải hiểu ngay mọi công thức, mà là hiểu dữ liệu, hiểu khi nào nên dùng ML, khi nào không.",
    quote:
      "Nếu trong tay bạn chỉ có cây búa, mọi thứ đều trông như cái đinh.",
    steps: [
      {
        title: "Khóa học cho người mới",
        segments: [
          "Bắt đầu với ",
          {
            href: "https://www.coursera.org/learn/machine-learning",
            label: "Machine Learning của Andrew Ng",
          },
          " trên Coursera. Nội dung phổ quát, cách dạy nhẹ nhàng. Đủ để có 'bản đồ' về toàn bộ lĩnh vực.",
        ],
      },
      {
        title: "Một cuốn sách hay về Khai phá dữ liệu",
        segments: [
          "Đọc ",
          {
            href: "https://www-users.cs.umn.edu/~kumar/dmbook/index.php",
            label: "Introduction to Data Mining",
          },
          " (Tan, Steinbach, Kumar). Sách giúp bạn hiểu và xử lý dữ liệu. Không có 'dữ liệu tốt' thì thuật toán dù xịn cũng vô dụng.",
        ],
      },
      {
        title: "Thực hành dự án cá nhân",
        segments: [
          "Bắt tay làm dự án nhỏ với Python, NumPy, scikit-learn, PyTorch. Bạn sẽ học pipeline xử lý dữ liệu, kỹ thuật đánh giá, và best practices nhanh hơn nhiều khi tự tay viết.",
        ],
      },
      {
        title: "Đào sâu thống kê và lý thuyết",
        segments: [
          "Chọn một trong: ",
          {
            href: "https://statweb.stanford.edu/~tibs/ElemStatLearn/",
            label: "The Elements of Statistical Learning",
          },
          " · ",
          {
            href: "https://www.springer.com/us/book/9780387310732",
            label: "Pattern Recognition and ML",
          },
          " (Bishop) · ",
          {
            href: "https://www.wiley.com/WileyCDA/WileyTitle/productCd-0471056693.html",
            label: "Pattern Classification",
          },
          " (Duda, Hart, Stork).",
        ],
      },
      {
        title: "Đọc giải lao một quyển truyền cảm hứng",
        segments: [
          "Khi đầu căng, đổi sang ",
          {
            href: "https://homes.cs.washington.edu/~pedrod/",
            label: "The Master Algorithm",
          },
          " của Pedro Domingos. Không nặng kỹ thuật, nhưng khơi gợi rất tốt.",
        ],
      },
    ],
  },

  /* ─── 05 · Sự kiện và Meetup ─── */
  {
    kind: "events",
    id: "events",
    num: "05",
    title: "Sự kiện và Meetup",
    desc:
      "Hội nghị chuyên ngành và meetup miễn phí. Repo gốc giữ danh sách này như tài nguyên thường trực. Kiểm tra trang gốc trước khi đăng ký.",
    cats: [
      {
        title: "Hội nghị và sự kiện chuyên ngành",
        count: "2 mục",
        events: [
          {
            pin: "Toàn cầu · tổng hợp",
            title: "AI và ML Events",
            desc:
              "Tổng hợp các hội nghị và triển lãm sắp diễn ra về AI/ML, được tuyển chọn thủ công.",
            href: "https://aiml.events",
          },
          {
            pin: "Trực tuyến · miễn phí",
            title: "Codementor Events",
            desc:
              "Nền tảng sự kiện ảo cho dev: từ kỹ thuật đến hướng nghiệp.",
            href: "https://www.codementor.io/events",
          },
        ],
      },
      {
        title: "Meetup miễn phí",
        count: "3 mục",
        events: [
          {
            pin: "Ấn Độ · Bangalore",
            title: "BangML",
            desc:
              "Bangalore Machine Learning Meetup. Cộng đồng địa phương lâu năm.",
            href: "https://www.meetup.com/BangML/",
          },
          {
            pin: "Mỹ · New York City",
            title: "NYC AI và ML Meetups",
            desc:
              "Mạng lưới các nhóm meetup AI/ML tại New York City.",
            href: "https://www.meetup.com/nyc-artificial-intelligence-machine-learning/",
          },
          {
            pin: "Mỹ · San Francisco",
            title: "SF Bay Area ML",
            desc:
              "Meetup ML lớn nhất khu vực vịnh San Francisco.",
            href: "https://www.meetup.com/sf-bayarea-machine-learning/",
          },
        ],
      },
    ],
  },
];

/**
 * Side-aside section list. Counts derived from SECTIONS so they can't
 * drift; the curriculum section reports its step count instead.
 */
export const ASIDE_TOC = SECTIONS.map((s) => {
  if (s.kind === "list") {
    const total = s.cats.reduce((acc, c) => acc + c.items.length, 0);
    return { id: s.id, label: s.title, count: String(total) };
  }
  if (s.kind === "curriculum") {
    return { id: s.id, label: s.title, count: `${s.steps.length} bước` };
  }
  const total = s.cats.reduce((acc, c) => acc + c.events.length, 0);
  return { id: s.id, label: s.title, count: String(total) };
});
