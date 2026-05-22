import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mammoth from "mammoth";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CV_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/cv");
const MAX_CV_TEXT_CHARS = 45000;

const recommendationValues = ["strong_yes", "yes", "maybe", "no"];

const screeningSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Overall fit score from 0 to 100.",
    },
    strengths: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" },
    },
    weaknesses: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    recommendation: {
      type: "string",
      enum: recommendationValues,
    },
    summary: {
      type: "string",
      minLength: 40,
      maxLength: 1200,
    },
  },
  required: ["score", "strengths", "weaknesses", "recommendation", "summary"],
};

const createHttpError = (status, message, detail) => {
  const error = new Error(message);
  error.status = status;
  if (detail) {
    error.detail = detail;
  }
  return error;
};

const getOpenAiClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw createHttpError(
      503,
      "AI screening is not configured",
      "Set OPENAI_API_KEY in backend/.env and restart the backend."
    );
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const resolveCvPath = (fileName) => {
  if (!fileName || path.basename(fileName) !== fileName) {
    return null;
  }

  const resolvedPath = path.resolve(CV_UPLOAD_DIR, fileName);
  const uploadRoot = `${CV_UPLOAD_DIR}${path.sep}`;
  return resolvedPath.startsWith(uploadRoot) ? resolvedPath : null;
};

const normalizeText = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const extractCvText = async ({ fileName, mimeType }) => {
  const filePath = resolveCvPath(fileName);

  if (!filePath) {
    throw createHttpError(404, "CV file not found");
  }

  const buffer = await fs.readFile(filePath);
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf" || mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return normalizeText(parsed.text).slice(0, MAX_CV_TEXT_CHARS);
    } finally {
      await parser.destroy();
    }
  }

  if (
    extension === ".docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return normalizeText(parsed.value).slice(0, MAX_CV_TEXT_CHARS);
  }

  throw createHttpError(
    415,
    "Unsupported CV format for AI screening",
    "AI screening currently supports PDF and DOCX files. Please ask the candidate to upload a PDF or DOCX CV."
  );
};

const buildPrompt = ({ application, cvText }) => {
  const candidateSkills = Array.isArray(application.candidate_skills)
    ? application.candidate_skills.join(", ")
    : application.candidate_skills || "";

  return `
Analyze this candidate for the job opening. Be evidence-based and concise.

Job:
- Title: ${application.job_title || "Unknown"}
- Company: ${application.company_name || "Unknown"}
- Employment type: ${application.employment_type || "Not specified"}
- Experience level: ${application.job_experience || "Not specified"}
- Description: ${application.job_description || "Not provided"}
- Responsibilities: ${application.job_responsibilities || "Not provided"}
- Requirements: ${application.job_requirements || "Not provided"}

Candidate:
- Name: ${application.candidate_name || "Unknown"}
- Email: ${application.candidate_email || "Unknown"}
- Phone: ${application.candidate_phone || "Unknown"}
- Skills from profile: ${candidateSkills || "Not provided"}
- Experience from profile: ${application.candidate_experience || "Not provided"}
- Cover letter: ${application.cover_letter || "Not provided"}

CV text:
${cvText}
`;
};

const parseScreeningResult = (response) => {
  const outputText = response.output_text;

  if (!outputText) {
    throw createHttpError(502, "AI provider returned an empty response");
  }

  const parsed = JSON.parse(outputText);
  const score = Number(parsed.score);
  const recommendation = String(parsed.recommendation || "");

  if (
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    !recommendationValues.includes(recommendation) ||
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.weaknesses) ||
    typeof parsed.summary !== "string"
  ) {
    throw createHttpError(502, "AI provider returned an invalid screening result");
  }

  return {
    score,
    strengths: parsed.strengths.map(String).filter(Boolean).slice(0, 6),
    weaknesses: parsed.weaknesses.map(String).filter(Boolean).slice(0, 6),
    recommendation,
    summary: parsed.summary.trim(),
  };
};

export const analyzeApplication = async (application) => {
  if (!application?.cv_file_name) {
    throw createHttpError(400, "This application does not have a CV file");
  }

  const cvText = await extractCvText({
    fileName: application.cv_file_name,
    mimeType: application.cv_mime_type,
  });

  if (!cvText) {
    throw createHttpError(422, "Could not extract readable text from this CV");
  }

  const client = getOpenAiClient();
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await client.responses.create({
    model,
    temperature: 0,
    input: [
      {
        role: "system",
        content:
          "You are a senior recruiter assistant. Return only structured JSON that follows the provided schema. Do not include protected-class assumptions.",
      },
      {
        role: "user",
        content: buildPrompt({ application, cvText }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "cv_screening_result",
        schema: screeningSchema,
        strict: true,
      },
    },
  });

  return {
    ...parseScreeningResult(response),
    model,
  };
};
