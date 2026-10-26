import { Types } from "mongoose";

import Roadmap from "../models/roadmap.model";
import { createNotification } from "./notification.service";

import {
  generateAIRoadmap,
} from "./aiRoadmap.service";

/* =========================================================
   TYPES
========================================================= */

export interface CreateRoadmapInput {
  userId: string;

  targetRole: string;

  experience: string;

  durationWeeks: number;

  currentSkills: string[];

  targetSkills?: string[];
}

/* =========================================================
   GENERATE ROADMAP
========================================================= */

export const createRoadmap =
  async (
    data: CreateRoadmapInput
  ) => {
    const {
      userId,
      targetRole,
      experience,
      durationWeeks,
      currentSkills,
      targetSkills,
    } = data;

    if (
      !Types.ObjectId.isValid(
        userId
      )
    ) {
      throw new Error(
        "Invalid user ID"
      );
    }

    const generated =
      await generateAIRoadmap({
        targetRole,
        experience,
        durationWeeks,
        currentSkills,
        targetSkills,
      });

    const roadmap =
      await Roadmap.create({
        userId:
          new Types.ObjectId(
            userId
          ),

        title:
          generated.title,

        targetRole,

        experience,

        durationWeeks,

        currentSkills,

        targetSkills:
          generated.targetSkills,

        steps:
          generated.steps.map(
            (step) => ({
              week:
                step.week,

              title:
                step.title,

              description:
                step.description,

              topics:
                step.topics.map(
                  (topic) => ({
                    title:
                      topic.title,

                    description:
                      topic.description,

                    completed:
                      false,
                  })
                ),

              resources:
                step.resources,

              completed:
                false,
            })
          ),

        status:
          "not_started",

        progress: 0,

        source: "ai",
      });

      if(roadmap) {
        await createNotification({
          userId,
          title: "Your Roadmap has been created successfully.",
          description:
            "Your mock interview has been completed. Check your results and feedback.",
          type: "interview",
          link: "/roadmap",
        });
      }

    return roadmap;
  };

/* =========================================================
   GET USER ROADMAPS
========================================================= */

export const getUserRoadmaps =
  async (
    userId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        userId
      )
    ) {
      throw new Error(
        "Invalid user ID"
      );
    }

    return Roadmap.find({
      userId,
    })
      .sort({
        createdAt: -1,
      })
      .select(
        "-steps.topics.description"
      );
  };

/* =========================================================
   GET ONE ROADMAP
========================================================= */

export const getRoadmapById =
  async (
    roadmapId: string,
    userId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        roadmapId
      )
    ) {
      throw new Error(
        "Invalid roadmap ID"
      );
    }

    const roadmap =
      await Roadmap.findOne({
        _id: roadmapId,
        userId,
      });

    if (!roadmap) {
      throw new Error(
        "Roadmap not found"
      );
    }

    return roadmap;
  };

/* =========================================================
   TOGGLE TOPIC
========================================================= */

export const toggleRoadmapTopic =
  async (
    roadmapId: string,
    userId: string,
    topicId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        roadmapId
      ) ||
      !Types.ObjectId.isValid(
        topicId
      )
    ) {
      throw new Error(
        "Invalid ID"
      );
    }

    const roadmap =
      await Roadmap.findOne({
        _id: roadmapId,
        userId,
      });

    if (!roadmap) {
      throw new Error(
        "Roadmap not found"
      );
    }

    let selectedTopic:
      | (typeof roadmap.steps)[number]["topics"][number]
      | undefined;

    for (
      const step of roadmap.steps
    ) {
      const topic =
        step.topics.find(
          (item) =>
            item._id.toString() ===
            topicId
        );

      if (topic) {
        selectedTopic =
          topic;

        break;
      }
    }

    if (!selectedTopic) {
      throw new Error(
        "Topic not found"
      );
    }

    selectedTopic.completed =
      !selectedTopic.completed;

    selectedTopic.completedAt =
      selectedTopic.completed
        ? new Date()
        : undefined;

    /* =====================================================
       UPDATE STEP COMPLETION
    ===================================================== */

    for (
      const step of roadmap.steps
    ) {
      const hasTopics =
        step.topics.length > 0;

      const allCompleted =
        hasTopics &&
        step.topics.every(
          (topic) =>
            topic.completed
        );

      step.completed =
        allCompleted;

      step.completedAt =
        allCompleted
          ? step.completedAt ||
            new Date()
          : undefined;
    }

    /* =====================================================
       CALCULATE PROGRESS
    ===================================================== */

    const allTopics =
      roadmap.steps.flatMap(
        (step) =>
          step.topics
      );

    const completedTopics =
      allTopics.filter(
        (topic) =>
          topic.completed
      ).length;

    roadmap.progress =
      allTopics.length > 0
        ? Math.round(
            (completedTopics /
              allTopics.length) *
              100
          )
        : 0;

    if (
      roadmap.progress === 100
    ) {
      roadmap.status =
        "completed";
    } else if (
      roadmap.progress > 0
    ) {
      roadmap.status =
        "in_progress";
    } else {
      roadmap.status =
        "not_started";
    }

    await roadmap.save();

    return roadmap;
  };

/* =========================================================
   DELETE ROADMAP
========================================================= */

export const deleteRoadmap =
  async (
    roadmapId: string,
    userId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        roadmapId
      )
    ) {
      throw new Error(
        "Invalid roadmap ID"
      );
    }

    const roadmap =
      await Roadmap.findOneAndDelete(
        {
          _id: roadmapId,
          userId,
        }
      );

    if (!roadmap) {
      throw new Error(
        "Roadmap not found"
      );
    }

    return roadmap;
  };