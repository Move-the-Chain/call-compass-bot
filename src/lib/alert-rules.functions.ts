import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AlertRuleRow = {
  id: string;
  title: string;
  desc: string;
  priority: string;
  channels: { slack: boolean; email: boolean; sms: boolean };
  recipientIds: string[];
  recipientRoles: string[];
  enabled: boolean;
  position: number;
};

type DbRow = {
  id: string;
  title: string;
  description: string;
  priority: string;
  channel_slack: boolean;
  channel_email: boolean;
  channel_sms: boolean;
  recipient_titles: string[];
  recipient_ids: string[];
  enabled: boolean;
  position: number;
};

function fromDb(r: DbRow): AlertRuleRow {
  return {
    id: r.id,
    title: r.title,
    desc: r.description ?? "",
    priority: r.priority,
    channels: { slack: !!r.channel_slack, email: !!r.channel_email, sms: !!r.channel_sms },
    recipientIds: r.recipient_ids ?? [],
    recipientRoles: r.recipient_titles ?? [],
    enabled: !!r.enabled,
    position: r.position ?? 0,
  };
}

export const listAlertRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<AlertRuleRow[]> => {
    const { data, error } = await supabaseAdmin
      .from("alert_rules")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => fromDb(r as DbRow));
  });

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  desc: z.string().max(2000).default(""),
  priority: z.string().trim().min(1).max(40),
  channels: z.object({ slack: z.boolean(), email: z.boolean(), sms: z.boolean() }),
  recipientIds: z.array(z.string().uuid()).max(500).default([]),
  recipientRoles: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  enabled: z.boolean().default(true),
  position: z.number().int().min(0).max(10000).default(0),
});

export const upsertAlertRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertInput.parse(data))
  .handler(async ({ data, context }): Promise<AlertRuleRow> => {
    const row = {
      title: data.title,
      description: data.desc,
      priority: data.priority,
      channel_slack: data.channels.slack,
      channel_email: data.channels.email,
      channel_sms: data.channels.sms,
      recipient_titles: data.recipientRoles,
      recipient_ids: data.recipientIds,
      enabled: data.enabled,
      position: data.position,
    };
    if (data.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("alert_rules")
        .update(row)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return fromDb(updated as DbRow);
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("alert_rules")
      .insert({ ...row, created_by: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromDb(inserted as DbRow);
  });

const toggleInput = z.object({ id: z.string().uuid(), enabled: z.boolean() });
export const setAlertRuleEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => toggleInput.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("alert_rules")
      .update({ enabled: data.enabled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deleteInput = z.object({ id: z.string().uuid() });
export const deleteAlertRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteInput.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("alert_rules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
