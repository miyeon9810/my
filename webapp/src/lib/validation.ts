import { z } from "zod";
import { QUEST_DIFFICULTIES } from "@/lib/leveling";

export const createQuestSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해줘").max(140),
  description: z.string().trim().max(2000).optional(),
  difficulty: z.enum(QUEST_DIFFICULTIES).default("normal"),
  dueDate: z.string().datetime().optional(),
  partyId: z.string().cuid().optional().nullable(),
  clanId: z.string().cuid().optional().nullable(),
});

export const updateQuestSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  difficulty: z.enum(QUEST_DIFFICULTIES).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
});

export const createPartySchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해줘").max(60),
  goal: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const createClanSchema = createPartySchema;

export const joinByCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4)
    .max(12)
    .transform((s) => s.toUpperCase()),
});

export const startFocusSessionSchema = z.object({
  questId: z.string().cuid().optional().nullable(),
  partyId: z.string().cuid().optional().nullable(),
  clanId: z.string().cuid().optional().nullable(),
});
