"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-agriculture", title: "AI in Agriculture", titleVi: "AI trong Nong nghiep", description: "Ung dung AI trong phat hien sau benh, du bao mua vu va nong nghiep chinh xac tai Viet Nam", category: "applied-ai", tags: ["crop", "pest-detection", "precision-farming"], difficulty: "beginner", relatedSlugs: ["image-classification", "object-detection", "edge-ai"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function AIInAgricultureTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "AI phat hien benh lua bang cach nao?", options: ["Do do am dat", "Chup anh la lua bang dien thoai → CNN phan loai benh (dao on, vang la, kho van) → goi y cach tri voi accuracy 90%+", "Do nhiet do khong khi"], correct: 1, explanation: "CNN (MobileNet/EfficientNet) nhan dien trieu chung benh tu anh la: mau sac (vang, nau), hinh dang vet benh, vi tri. App tren dien thoai: nong dan chup anh → AI phan loai → goi y thuoc/cach xu ly. Da co apps nhu PlantVillage, Plantix dung o VN." },
    { question: "Precision farming la gi?", options: ["Farming chinh xac tung cm", "Dung AI + sensors + drone de TOI UU tai tung vung nho: bao nhieu nuoc, bao nhieu phan, khi nao thu hoach — thay vi 'lam dong deu' toan canh dong", "Chi dung trong nha kinh"], correct: 1, explanation: "Precision farming: khong phun thuoc deu toan ruong ma chi phun cho nay bi sau. Khong tuoi deu ma tuoi theo do am tung vung. Giam 30-50% nuoc + phan + thuoc, tang 15-25% nang suat. Drones + sensors + AI = farming 4.0. Viet Nam dang pilot o Dong bang song Cuu Long." },
    { question: "Thach thuc lon nhat cua AI nong nghiep tai Viet Nam?", options: ["Thieu GPU", "Ha tang: internet khong on dinh o nong thon, nong dan chua quen cong nghe, data cu the cho giong cay VN con thieu", "Thieu dat nong nghiep"], correct: 1, explanation: "3 thach thuc chinh: (1) Internet o nong thon khong on dinh → can Edge AI (chay tren dien thoai offline), (2) Nong dan can app don gian (tieng Viet, giao dien de dung), (3) Data giong cay VN (lua, ca phe, thanh long) khong nhieu nhu data cay tay Au. Can tu collect va label." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Nong dan Dong Thap trong 10 ha lua. Mot vung bi dao on nhung chua nhin thay ro. Khi phat hien thi da lan 3 ha. AI giup the nao?" options={["AI khong lien quan den nong nghiep", "Drone bay quet + AI phan tich anh → phat hien benh SOM (truoc mat thuong 1-2 tuan) → chi can xu ly 0.5 ha thay vi 3 ha", "AI du bao thoi tiet"]} correct={1} explanation="Drone + multispectral camera chup ruong → AI phan tich: vung nao stress (chua co trieu chung mat thuong nhung spectral signature khac). Phat hien som 1-2 tuan → xu ly 0.5 ha thay vi 3 ha → tiet kiem 80% thuoc + cuu 70% nang suat. Da duoc pilot o Can Tho, An Giang!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>AI nong nghiep la <strong>nong dan 4.0</strong>: thay vi nhin troi doan thoi tiet, dung <strong>AI du bao</strong>. Thay vi phun thuoc toan ruong, dung <strong>drone chi phun cho bi benh</strong>. Thay vi thu hoach theo lich, dung <strong>AI phan tich do chin</strong>. Giam 30-50% chi phi, tang 15-25% nang suat. Viet Nam — nuoc nong nghiep — co the huong loi RAT LON!</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="App AI phat hien benh cay can chay tren dien thoai nong dan (RAM 2-3GB, khong co internet on dinh). Chon model nao?" options={["ResNet-152 (230MB, can internet)", "MobileNet V3 quantized INT8 (5MB, chay offline, 50ms tren dien thoai cu)", "GPT-4 Vision API"]} correct={1} explanation="Nong thon VN: internet khong on dinh → can offline. Dien thoai cu 2-3GB RAM → model phai nho. MobileNet V3 INT8: 5MB, accuracy 88% (du cho 90% use cases), chay 50ms, offline. Edge AI la giai phap duy nhat cho nong nghiep nong thon!" /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>AI in Agriculture</strong>{" "}ung dung AI de phat hien benh, toi uu tuoi tieu, du bao nang suat — nong nghiep chinh xac (precision farming).</p>
        <p><strong>4 ung dung chinh:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li><strong>Phat hien sau benh:</strong>{" "}CNN tu anh la → phan loai benh (accuracy 90%+)</li>
          <li><strong>Precision farming:</strong>{" "}Sensors + AI toi uu nuoc, phan, thuoc tung vung</li>
          <li><strong>Du bao nang suat:</strong>{" "}Satellite + weather + soil data → predict yield</li>
          <li><strong>Robot thu hoach:</strong>{" "}Computer vision + robotics cho thu hoach tu dong</li>
        </ul>
        <Callout variant="info" title="AI Nong nghiep tai Viet Nam">VNPT: platform nong nghiep thong minh cho Dong bang song Cuu Long. FPT: AI du bao thoi tiet cho nong nghiep. Nhieu startup: CropX VN, AgriConnect. Mekong delta (lua), Tay Nguyen (ca phe), Ninh Thuan (nho) dang pilot.</Callout>
        <CodeBlock language="python" title="Phat hien benh cay tren dien thoai">{`import tensorflow as tf

# Model nho cho dien thoai: MobileNet V3
model = tf.keras.applications.MobileNetV3Small(
    input_shape=(224, 224, 3),
    classes=10,  # 10 loai benh lua
    weights=None,
)
model.load_weights("disease_model.h5")

# Quantize cho dien thoai (5MB, offline)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()
# Ket qua: 5MB, 50ms tren dien thoai, accuracy 88%

# Nong dan chup anh la → model phan loai:
# "Dao on (70%), Kho van (20%), Binh thuong (10%)"
# + Goi y: "Phun thuoc Tricyclazole, lieu 1g/lit"`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["4 ung dung: Phat hien benh (CNN), Precision farming (sensors+AI), Du bao nang suat, Robot thu hoach.", "Edge AI bat buoc: nong thon khong co internet on dinh → model chay offline tren dien thoai.", "Precision farming: giam 30-50% nuoc/thuoc/phan, tang 15-25% nang suat.", "VN co loi the: nuoc nong nghiep lon, nhieu bai toan (lua, ca phe, thuy san) can AI.", "Thach thuc: internet nong thon, data giong cay VN con thieu, nong dan can app don gian."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
