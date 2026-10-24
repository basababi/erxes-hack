import { z } from "zod";
import { generateJson, isLlmConfigured, LlmError } from "../../ai/llmClient.ts";

export interface TopicProgress {
  name: string;
  attempts: number;
  averageScore: number;
}

const feedbackSchema = z.object({
  strengths: z.array(z.string().trim().min(1).max(120)).max(3),
  needsPractice: z.array(z.string().trim().min(1).max(120)).max(3),
  recommendation: z.string().trim().min(1).max(300),
  parentAdvice: z.string().trim().min(1).max(300),
  careerGuidance: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        rationale: z.string().trim().min(1).max(180),
        tryNext: z.string().trim().min(1).max(180),
      }),
    )
    .max(3),
});

export type PracticeFeedback = z.infer<typeof feedbackSchema> & {
  generatedByAi: boolean;
  notice: string | null;
};

export const fallbackPracticeFeedback = (
  topics: TopicProgress[],
  notice: string,
): PracticeFeedback => {
  const strengths = topics
    .filter((topic) => topic.averageScore >= 80)
    .sort((left, right) => right.averageScore - left.averageScore)
    .slice(0, 3)
    .map((topic) => `${topic.name} — ${topic.averageScore}%`);
  const needsPractice = topics
    .filter((topic) => topic.averageScore < 60)
    .sort((left, right) => left.averageScore - right.averageScore)
    .slice(0, 3)
    .map((topic) => `${topic.name} — ${topic.averageScore}%`);
  const focus = [...topics].sort((left, right) => left.averageScore - right.averageScore)[0];
  const strongest = [...topics].sort((left, right) => right.averageScore - left.averageScore)[0];

  return {
    strengths:
      strengths.length > 0
        ? strengths
        : ["Одоогоор 80%-иас дээш оноотой сэдэв алга; ахицаа үргэлжлүүлээрэй."],
    needsPractice:
      needsPractice.length > 0 ? needsPractice : ["Одоогоор 60%-иас доош оноотой сэдэв алга."],
    recommendation: focus
      ? `${focus.name} сэдвээр дахин дадлага хийгээд, алдсан алхмаа тайлбарлаж үзээрэй.`
      : "Дадлагаа үргэлжлүүлж, сэдэв бүрийн ахицаа ажиглаарай.",
    parentAdvice: focus
      ? `${focus.name} сэдвээр өдөрт 10 минут хамт бодож, хариунаас илүү ямар алхам сонгосныг нь асуугаарай.`
      : "Хүүхдээсээ өнөөдөр сурсан нэг зүйлээ тайлбарлуулах нь ахицыг нь дэмжинэ.",
    careerGuidance: [
      {
        title: strongest ? "Өгөгдөл ба тоон сэтгэлгээ" : "Сонирхлоо нээх",
        rationale: strongest
          ? `${strongest.name} сэдвийн ${strongest.averageScore}% дундаж нь тоон мэдээлэлтэй ажиллах чиглэлийг сонирхон судлах эхлэл байж болно. Энэ нь авьяасын үнэлгээ биш.`
          : "Одоогоор карьерын чиглэл санал болгохуйц дадлагын мэдээлэл хангалтгүй байна.",
        tryNext:
          "Өдөр тутмын нэг жижиг мэдээллийг хүснэгт эсвэл графикаар үзүүлж, юуг анзаарснаа ярилцаарай.",
      },
    ],
    generatedByAi: false,
    notice,
  };
};

const feedbackPrompt = (topics: TopicProgress[]) =>
  [
    "Чи сурагчид эелдэг, бодитой санал өгдөг математикийн багш.",
    "Доорх нь сурагчийн сэдэв бүрээрх дадлагын дундаж оноо болон дадлагын тоо.",
    "Зөвхөн дундаж оноо 80-аас дээш сэдвийг strengths-д, 60-аас доош сэдвийг needsPractice-д оруул. Бусдыг хүчээр ангилахгүй.",
    "Сэдвийн нэрийг оролтын нэртэй яг адил хуулж, жагсаалт бүрийн мөрийг 'сэдвийн нэр — богино шалтгаан' хэлбэрээр бич.",
    "Оролтод байхгүй сэдэв бүү нэм. Тоо баримтаас өөр зүйл бүү таамагла.",
    "Сурагчийг буруутгахгүй, насанд нь тохирсон энгийн Монгол хэл хэрэглэ. Parent advice нь гэртээ хийж болох нэг бодит, төлбөргүй алхам байна.",
    "Career guidance нь онош, баталгаатай тохирох мэргэжил биш; зөвхөн сонирхон судлах 1-3 чиглэл байна. Чиглэл бүрийг оролтын бодит сэдэвтэй холбоод, дараагийн жижиг туршилтыг санал болго.",
    "Сэдэв эсвэл чадварын талаар оролтод байхгүй баримт зохиохгүй. Хариу, хувийн шинж, орлого, амжилт таамаглахгүй.",
    'JSON only: {"strengths":["сэдэв — богино шалтгаан"],"needsPractice":["сэдэв — богино шалтгаан"],"recommendation":"сурагчийн дараагийн алхам","parentAdvice":"эцэг эхэд өгөх нэг эелдэг, хэрэгжихүйц зөвлөгөө","careerGuidance":[{"title":"судлах чиглэл","rationale":"аль ажиглагдсан сэдэвтэй яагаад холбогдох","tryNext":"сонирхлыг турших жижиг алхам"}]}',
    "",
    JSON.stringify(topics),
  ].join("\n");

export const generatePracticeFeedback = async (
  topics: TopicProgress[],
): Promise<PracticeFeedback> => {
  if (!isLlmConfigured()) {
    return fallbackPracticeFeedback(
      topics,
      "AI тохируулаагүй тул оноонд тулгуурласан дүгнэлт харууллаа.",
    );
  }

  try {
    const generated = await generateJson(feedbackPrompt(topics), feedbackSchema);
    const validClassification = (line: string, category: "strengths" | "needsPractice") => {
      const topic = topics.find((candidate) => line.startsWith(`${candidate.name} —`));

      return Boolean(
        topic && (category === "strengths" ? topic.averageScore >= 80 : topic.averageScore < 60),
      );
    };

    if (
      !generated.strengths.every((line) => validClassification(line, "strengths")) ||
      !generated.needsPractice.every((line) => validClassification(line, "needsPractice")) ||
      (topics.some((topic) => topic.averageScore >= 80) && generated.strengths.length === 0) ||
      (topics.some((topic) => topic.averageScore < 60) && generated.needsPractice.length === 0) ||
      generated.careerGuidance.some(
        ({ rationale }) => !topics.some((topic) => rationale.includes(topic.name)),
      )
    ) {
      return fallbackPracticeFeedback(
        topics,
        "AI онооны ангиллыг баталгаажуулж чадсангүй; оноонд тулгуурласан дүгнэлт харууллаа.",
      );
    }

    return { ...generated, generatedByAi: true, notice: null };
  } catch (error) {
    if (!(error instanceof LlmError)) throw error;

    return fallbackPracticeFeedback(
      topics,
      `${error.message}; оноонд тулгуурласан дүгнэлт харууллаа.`,
    );
  }
};
