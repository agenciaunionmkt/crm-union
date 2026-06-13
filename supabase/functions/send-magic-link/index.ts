import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    const redirectUrl = "https://www.agenciaunionmkt.com.br/auth/callback"
    const { data, error: genError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: "https://www.agenciaunionmkt.com.br/auth/callback",
      },
    })

    if (genError) {
      console.error("Erro ao gerar magic link:", genError)
      return new Response(
        JSON.stringify({ error: genError.message || "Erro ao gerar link" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const magicLink = data?.properties?.action_link
    if (!magicLink) {
      console.error("Falha ao gerar magic link - action_link não encontrado:", data)
      return new Response(
        JSON.stringify({ error: "Falha ao gerar link de acesso" }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log("Magic link gerado com sucesso para:", email)

    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      console.error("RESEND_API_KEY não configurada")
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log("Enviando email via Resend para:", email)

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Seu link seguro para acessar Union Marketing",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Acesso Seguro - Union Marketing</h2>
            <p>Olá,</p>
            <p>Clique no link abaixo para acessar sua conta:</p>
            <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #fbbf24; color: #111827; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Conta
            </a>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              Ou copie e cole este link no seu navegador:<br>
              <code>${magicLink}</code>
            </p>
            <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
              Este link expira em 24 horas.<br>
              Se você não solicitou este email, ignore esta mensagem.
            </p>
          </div>
        `,
      }),
    })

    const resendData = await resendResponse.json()

    console.log("Resposta do Resend:", resendResponse.status, resendData)

    if (!resendResponse.ok) {
      console.error("Erro ao enviar email via Resend:", {
        status: resendResponse.status,
        data: resendData,
        apiKey: resendApiKey?.substring(0, 10) + "...",
      })
      return new Response(
        JSON.stringify({
          error: "Falha ao enviar email",
          details: resendData?.message || resendData?.error || "Erro desconhecido"
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log("Email enviado com sucesso para:", email, "ID:", resendData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Link enviado com sucesso para seu email"
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error("Erro na função:", error)
    return new Response(
      JSON.stringify({
        error: "Erro no servidor",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
