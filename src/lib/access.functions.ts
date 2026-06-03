import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type JobTitle = "coo" | "manager" | "agent" | "contact" | "other";
export const JOB_TITLES: JobTitle[] = ["coo", "manager", "agent", "contact", "other"];

export type PersonRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: JobTitle;
};

function normalizeTitle(t: string | null | undefined): JobTitle {
  const v = (t ?? "").toLowerCase();
  return (JOB_TITLES as string[]).includes(v) ? (v as JobTitle) : "other";
}

export const listPeople = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<PersonRow[]> => {
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, phone, title, created_at")
      .order("created_at", { ascending: true });
    if (pErr) throw new Error(pErr.message);

    return (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.name ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      title: normalizeTitle((p as { title?: string }).title),
    }));
  });

const createInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().default(""),
  password: z.string().min(8).max(128),
  title: z.enum(["coo", "manager", "agent", "contact", "other"]),
});

export const createPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data }) => {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, phone: data.phone, title: data.title },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");

    // Trigger creates profile + admin role; ensure title is set (in case metadata missed).
    await supabaseAdmin
      .from("profiles")
      .update({ name: data.name, phone: data.phone, title: data.title })
      .eq("id", created.user.id);

    return { ok: true, id: created.user.id };
  });

const updateProfileInput = z.object({
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).default(""),
  title: z.enum(["coo", "manager", "agent", "contact", "other"]),
});

export const updatePerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateProfileInput.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ name: data.name, phone: data.phone, title: data.title })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deleteInput = z.object({ userId: z.string().uuid() });

export const deletePerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, phone, title")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      profile: profile
        ? {
            id: profile.id,
            name: profile.name ?? "",
            email: profile.email ?? "",
            phone: profile.phone ?? "",
            title: normalizeTitle((profile as { title?: string }).title),
          }
        : null,
    };
  });
