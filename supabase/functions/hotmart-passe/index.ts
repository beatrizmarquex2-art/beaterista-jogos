// Hotmart 2.0.0 -> Supabase -> codigo anual -> email.
// Nao publicar sem configurar os secrets, o SQL e o webhook na Hotmart.
// Webhook externo: verify_jwt = false, mas exige X-HOTMART-HOTTOK.
import { createClient } from "npm:@supabase/supabase-js@2";

const PRODUCT_ID = 9051614;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const URL_ENTRADA = "https://jogos.beaterista.com.br/?entrar";
const EVENTOS = new Set([
  "PURCHASE_APPROVED", "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK", "PURCHASE_CANCELED",
]);

function codigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return "P" + Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

function seguro(a: string, b: string): boolean {
  const aa = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function escapeHtml(v: string): string {
  return v.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const hottok = Deno.env.get("HOTMART_HOTTOK") || "";
  if (!hottok) return json({ error: "server_not_configured" }, 503);
  if (!seguro(req.headers.get("X-HOTMART-HOTTOK") || "", hottok)) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: Record<string, any>;
  try { payload = await req.json(); }
  catch { return json({ error: "invalid_json" }, 400); }
  const evento = String(payload?.event || "");
  if (payload?.version !== "2.0.0" || !EVENTOS.has(evento)) {
    return json({ ignored: true, reason: "version_or_event" });
  }
  const d = payload?.data;
  if (Number(d?.product?.id) !== PRODUCT_ID) {
    return json({ ignored: true, reason: "other_product" });
  }
  const transacao = String(d?.purchase?.transaction || "").trim();
  if (transacao.length < 4 || transacao.length > 100) {
    return json({ error: "invalid_transaction" }, 400);
  }
  const nome = String(d?.buyer?.name || "").trim().slice(0, 160);
  const email = String(d?.buyer?.email || "").trim().toLowerCase();
  if (evento === "PURCHASE_APPROVED" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "buyer_email_missing" }, 422);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("HOTMART_EMAIL_FROM");
  if (!supabaseUrl || !supabaseKey ||
      (evento === "PURCHASE_APPROVED" && (!resendKey || !emailFrom))) {
    return json({ error: "server_not_configured" }, 503);
  }
  const sb = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const millis = Number(d?.purchase?.approved_date);
  const approvedAt = Number.isFinite(millis) && millis > 0
    ? new Date(millis).toISOString() : new Date().toISOString();

  // A RPC transacional impede que dois webhooks da mesma venda gerem codigos
  // diferentes. Um conflito de codigo aleatorio e tratado com nova tentativa.
  let resultado: any = null;
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data, error } = await sb.rpc("hotmart_passe_processar", {
      p_transacao: transacao,
      p_email: email,
      p_nome: nome,
      p_evento: evento,
      p_codigo: evento === "PURCHASE_APPROVED" ? codigo() : null,
      p_aprovada_em: evento === "PURCHASE_APPROVED" ? approvedAt : null,
    });
    if (!error) { resultado = data; break; }
    // 23505: codigo por acaso ja existe; gerar outro e repetir.
    if (error.code === "23505" && tentativa < 4) continue;
    console.error("hotmart_passe_rpc_error", error.code, error.message);
    return json({ error: "database_error" }, 500);
  }
  if (!resultado) return json({ error: "unable_to_create_code" }, 500);
  if (evento !== "PURCHASE_APPROVED") {
    return json({ ok: true, status: resultado.status });
  }
  if (resultado.status !== "aprovada") {
    return json({ ok: true, ignored: true, reason: "purchase_revoked" });
  }
  if (resultado.email_enviado) return json({ ok: true, delivered: true });

  const code = String(resultado.codigo || "");
  if (!/^P[A-Z0-9]{9}$/.test(code)) return json({ error: "invalid_generated_code" }, 500);
  const primeiroNome = nome.split(/\s+/)[0] || "aluno(a)";
  const corpo = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#252525">
      <h2>seu Passe Anual Robôterista está pronto!</h2>
      <p>olá, ${escapeHtml(primeiroNome)}! seu pagamento foi confirmado.</p>
      <p>este é seu código de acesso (válido por 12 meses, em até 2 aparelhos):</p>
      <p style="font-size:26px;letter-spacing:3px;font-weight:bold">${code}</p>
      <p>acesse <a href="${URL_ENTRADA}">${URL_ENTRADA}</a>,
         escreva seu nome e insira o código em "já tenho código".</p>
      <p>guarde este e-mail para recuperar o acesso.</p>
      <p>equipe Beaterista</p>
    </div>`;
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `hotmart-passe-${transacao}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: "seu acesso ao Passe Anual Robôterista",
        html: corpo,
      }),
    });
    if (!resposta.ok) {
      console.error("hotmart_email_error", resposta.status);
      return json({ error: "email_delivery_failed" }, 503);
    }
    const { error } = await sb.from("hotmart_passe_vendas")
      .update({ email_enviado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .eq("transacao", transacao).eq("status", "aprovada").is("email_enviado_em", null);
    if (error) {
      console.error("hotmart_email_mark_error", error.code, error.message);
      return json({ error: "email_mark_failed" }, 500);
    }
    return json({ ok: true, delivered: true });
  } catch (error) {
    console.error("hotmart_email_network_error", String(error));
    return json({ error: "email_delivery_failed" }, 503);
  }
});
