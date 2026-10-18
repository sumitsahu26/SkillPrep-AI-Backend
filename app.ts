import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import resumeRoutes from "./routes/resume.routes";
import interviewRoutes from "./routes/interview.routes";
import aiInterviewRoutes from "./routes/aiInterview.routes";
import mockInterviewRoutes from "./routes/mockInterview.routes";
import roadmapRoutes from "./routes/roadmap.routes";
import skillAssessmentRoutes from "./routes/skillAssessment.routes";
import assessmentQuestionRoutes from "./routes/assessmentQuestion.routes";
import careerMonitorRoutes from "./routes/careerMonitor.routes";
import aiMentorRoutes from "./routes/aiMentor.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());


connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/ai-interview", aiInterviewRoutes);
app.use("/api/mock-interviews", mockInterviewRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/skill-assessments", skillAssessmentRoutes);
app.use("/api/assessment-bank", assessmentQuestionRoutes);
app.use("/api/career-monitor", careerMonitorRoutes);
app.use("/api/ai-mentor", aiMentorRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});