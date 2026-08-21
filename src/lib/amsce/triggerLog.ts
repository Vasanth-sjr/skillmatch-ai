// Persistence for verification triggers.
//
// Recording a fired trigger is what lets Phase 8 ask whether the
// mechanism works at all: which suggestions get acted on, and whether
// the confidence gain we projected is the one users actually realise.
// A prompt that nobody can measure is a guess wearing a badge.

import { supabase } from "@/integrations/supabase/client";
import { VerificationTrigger } from "./verificationTrigger";

export interface TriggerLogRow {
  skill: string;
  reason: string;
  actedAt: string | null;
  suggestedModule: string | null;
}

export async function recordTriggers(
  userId: string,
  careerPath: string,
  triggers: VerificationTrigger[],
): Promise<void> {
  if (triggers.length === 0) return;

  const rows = triggers.map(t => ({
    user_id: userId,
    career_path: careerPath,
    skill: t.skill,
    reason: t.reason,
    self_rating: t.selfRating,
    confidence_at_fire: Math.round(t.currentConfidence * 100) / 100,
    suggested_module: t.actions[0]?.module ?? null,
    projected_gain: t.actions[0]
      ? Math.round(t.actions[0].projectedGain * 100) / 100
      : null,
    fired_at: new Date().toISOString(),
  }));

  const { error } = await (supabase as any)
    .from("verification_trigger_log")
    .upsert(rows, { onConflict: "user_id,career_path,skill" });

  if (error) console.error("Couldn't record verification triggers:", error);
}

/**
 * Marks a trigger as acted upon.
 *
 * Called when the user follows a suggestion, not when the resulting
 * evidence lands — the two can be far apart (opening the mock interview
 * page is instant; finishing an answer is not), and conflating them
 * would overstate how effective the prompt was.
 */
export async function markTriggerActed(
  userId: string,
  careerPath: string,
  skill: string,
  module: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from("verification_trigger_log")
    .update({ acted_at: new Date().toISOString(), acted_module: module })
    .eq("user_id", userId)
    .eq("career_path", careerPath)
    .eq("skill", skill);

  if (error) console.error("Couldn't mark trigger as acted:", error);
}

export async function loadTriggerLog(
  userId: string,
  careerPath: string,
): Promise<Record<string, TriggerLogRow>> {
  const { data, error } = await (supabase as any)
    .from("verification_trigger_log")
    .select("skill, reason, acted_at, suggested_module")
    .eq("user_id", userId)
    .eq("career_path", careerPath);

  if (error) {
    console.error("Couldn't load verification trigger log:", error);
    return {};
  }

  const bySkill: Record<string, TriggerLogRow> = {};
  for (const row of data ?? []) {
    bySkill[row.skill] = {
      skill: row.skill,
      reason: row.reason,
      actedAt: row.acted_at,
      suggestedModule: row.suggested_module,
    };
  }
  return bySkill;
}
