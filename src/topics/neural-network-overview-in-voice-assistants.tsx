"use client";

import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

export const metadata: TopicMeta = {
  slug: "neural-network-overview-in-voice-assistants",
  title: "Neural Networks in Voice Assistants",
  titleVi: "Mạng nơ-ron trong Trợ lý Giọng nói",
  description:
    "Cách Google Assistant và Siri dùng mạng nơ-ron sâu để nhận diện giọng nói, giảm tỉ lệ lỗi từ hơn 23% xuống dưới 5%",
  category: "neural-fundamentals",
  tags: ["neural-network", "speech-recognition", "application"],
  difficulty: "beginner",
  relatedSlugs: ["neural-network-overview"],
  vizType: "static",
  applicationOf: "neural-network-overview",
  featuredApp: {
    name: "Google Assistant",
    productFeature: "Speech Recognition",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Hey Siri: An On-device DNN-powered Voice Trigger",
      publisher: "Apple Machine Learning Research",
      url: "https://machinelearning.apple.com/research/hey-siri",
      date: "2017-10",
      kind: "engineering-blog",
    },
    {
      title:
        "Deep Learning for Siri's Voice: On-device Deep Mixture Density Networks",
      publisher: "Apple Machine Learning Research",
      url: "https://machinelearning.apple.com/research/siri-voices",
      date: "2017-08",
      kind: "engineering-blog",
    },
    {
      title: "The Neural Networks Behind Google Voice Transcription",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/the-neural-networks-behind-google-voice-transcription/",
      date: "2015-09",
      kind: "engineering-blog",
    },
    {
      title: "Improving End-to-End Models for Speech Recognition",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/improving-end-to-end-models-for-speech-recognition/",
      date: "2019-01",
      kind: "engineering-blog",
    },
    {
      title:
        "Google's Speech Recognition Technology Now Has a 4.9% Word Error Rate",
      publisher: "VentureBeat",
      url: "https://venturebeat.com/business/googles-speech-recognition-technology-now-has-a-4-9-word-error-rate",
      date: "2017-05",
      kind: "news",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

export default function NeuralNetworkOverviewInVoiceAssistants() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Tổng quan mạng nơ-ron"
    >
      <ApplicationHero
        parentTitleVi="Tổng quan mạng nơ-ron"
        topicSlug="neural-network-overview-in-voice-assistants"
      >
        <p>
          Bạn nói &ldquo;Hey Siri, thời tiết hôm nay thế nào?&rdquo; hoặc
          &ldquo;OK Google, đặt báo thức 7 giờ sáng&rdquo; &mdash; chỉ trong
          vài trăm mili-giây, trợ lý ảo đã hiểu chính xác yêu cầu của bạn và
          phản hồi. Đằng sau sự nhạy bén đó là mạng nơ-ron sâu (deep neural
          network &mdash; mạng có nhiều tầng xử lý chồng lên nhau).
        </p>
        <p>
          Trước 2012, hệ thống nhận dạng giọng nói dựa trên mô hình thống kê
          truyền thống với tỉ lệ lỗi từ (word error rate &mdash; tỉ lệ từ bị
          nhận sai) trên 23%. Kể từ khi Google và Apple chuyển sang mạng
          nơ-ron sâu, tỉ lệ này giảm xuống dưới 5% &mdash; lần đầu tiên tiệm
          cận khả năng nghe hiểu của con người.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="neural-network-overview-in-voice-assistants">
        <p>
          Tiếng nói con người cực kỳ đa dạng: giọng vùng miền, tốc độ nói,
          tiếng ồn xung quanh, cách phát âm khác nhau giữa mỗi người. Hệ
          thống nhận dạng giọng nói cần biến dạng sóng âm thanh thô thành văn
          bản chính xác &mdash; trong thời gian thực.
        </p>
        <p>
          Phương pháp truyền thống dùng HMM (Hidden Markov Model &mdash; mô
          hình Markov ẩn) kết hợp GMM (Gaussian Mixture Model &mdash; mô hình
          hỗn hợp Gauss) để mô hình hóa âm thanh. Nhưng hai mô hình này xử
          lý mỗi khung âm thanh gần như độc lập, không nắm bắt được ngữ cảnh
          dài hạn &mdash; dẫn đến lỗi nhận dạng cao.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Tổng quan mạng nơ-ron"
        topicSlug="neural-network-overview-in-voice-assistants"
      >
        <Beat step={1}>
          <p>
            <strong>Tiền xử lý âm thanh.</strong> Micro thu sóng âm ở tần số
            lấy mẫu 16.000 lần/giây. Bộ phân tích phổ (spectrum analysis)
            chuyển dạng sóng thành các khung (frame) mô tả phổ tần số, mỗi
            khung dài khoảng 0,01 giây &mdash; tạo ra chuỗi vector đặc trưng
            (feature vector &mdash; mảng số biểu diễn đặc điểm âm thanh).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>
              Mạng nơ-ron sâu phân loại âm vị (phoneme &mdash; đơn vị âm thanh
              nhỏ nhất).
            </strong>{" "}
            Chuỗi vector đặc trưng đi qua mạng nơ-ron nhiều tầng. Google dùng
            LSTM (Long Short-Term Memory &mdash; bộ nhớ dài-ngắn hạn) có khả
            năng ghi nhớ ngữ cảnh trước đó. Apple dùng DNN (Deep Neural
            Network) trên chip Neural Engine (bộ xử lý chuyên biệt cho mạng
            nơ-ron) ngay trên thiết bị. Mỗi tầng nhận đầu ra tầng trước, biến
            đổi qua hàm kích hoạt (activation function), rồi truyền tiếp &mdash;
            đây là cốt lõi của mạng nơ-ron.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Giải mã chuỗi từ.</strong> Đầu ra mạng nơ-ron là phân phối
            xác suất (probability distribution) trên tập từ vựng tại mỗi bước
            thời gian. Bộ giải mã (decoder) dùng thuật toán beam search (tìm
            kiếm chùm tia &mdash; giữ lại nhiều giả thuyết tốt nhất) kết hợp
            mô hình ngôn ngữ (language model) để chọn chuỗi từ có xác suất cao
            nhất.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Xử lý ngôn ngữ tự nhiên.</strong> Văn bản được nhận dạng
            tiếp tục đi qua mạng NLU (Natural Language Understanding &mdash;
            hiểu ngôn ngữ tự nhiên) để xác định ý định (intent &mdash; mục
            đích của người dùng) và thực thể (entity &mdash; đối tượng cụ thể
            trong câu), rồi thực hiện hành động tương ứng.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="neural-network-overview-in-voice-assistants"
      >
        <Metric
          value="Tỉ lệ lỗi từ của Google giảm từ 23% (2013) xuống 4,9% (2017) nhờ chuyển sang mạng nơ-ron sâu"
          sourceRef={5}
        />
        <Metric
          value="Mô hình end-to-end của Google đạt 5,6% WER, cải thiện 16% so với hệ thống truyền thống"
          sourceRef={4}
        />
        <Metric
          value="Siri dùng DNN xử lý trực tiếp trên thiết bị, phát hiện 'Hey Siri' với độ trễ dưới 200ms"
          sourceRef={1}
        />
        <Metric
          value="Google Voice Transcription dùng LSTM-RNN giảm đáng kể lỗi nhận dạng trên cuộc gọi điện thoại"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Tổng quan mạng nơ-ron"
        topicSlug="neural-network-overview-in-voice-assistants"
      >
        <p>
          Nếu không có mạng nơ-ron sâu, trợ lý giọng nói sẽ vẫn dùng mô hình
          thống kê truyền thống với tỉ lệ lỗi trên 20% &mdash; cứ 5 từ lại
          sai 1 từ. Trải nghiệm đó quá tệ để dùng hàng ngày.
        </p>
        <p>
          Mạng nơ-ron sâu cho phép hệ thống học trực tiếp từ hàng triệu giờ
          dữ liệu giọng nói, nắm bắt ngữ cảnh dài hạn mà mô hình thống kê
          không thể. Nhờ đó, hơn 4,2 tỉ thiết bị trên thế giới có trợ lý
          giọng nói hoạt động đủ tốt để trở thành công cụ hàng ngày.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
