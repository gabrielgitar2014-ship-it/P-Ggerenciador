import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://deno.land/x/webpush/mod.ts'

// ... (seu código da função sendWhatsappMessage e a constante NOTIFICATION_PHONE_NUMBER)

serve(async (req) => {
  // ... (código para extrair o 'record' e validar)
  const { record } = await req.json();

  // 1. Enviar a notificação do WhatsApp (código que você já tem)
  // ...

  // 2. Enviar a Notificação Push
  try {
    const userId = record.user_id; // Assumindo que você salva o user_id na despesa
    if (!userId) throw new Error("ID do usuário não encontrado na despesa");
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Busca a assinatura do usuário no banco
    const { data: subData, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_details')
      .eq('user_id', userId)
      .single();

    if (subError || !subData) throw new Error("Assinatura de notificação não encontrada para o usuário.");

    const payload = JSON.stringify({
      title: 'Nova Despesa Registrada!',
      body: `${record.description} - R$ ${record.amount.toFixed(2)}`,
    });

    await webpush.sendNotification(
      subData.subscription_details,
      payload,
      {
        vapidDetails: {
          subject: 'mailto:seu-email@exemplo.com',
          publicKey: Deno.env.get('VAPID_PUBLIC_KEY'),
          privateKey: Deno.env.get('VAPID_PRIVATE_KEY'),
        },
      }
    );
    console.log("Notificação Push enviada com sucesso.");

  } catch (pushError) {
    console.error("Erro ao enviar notificação push:", pushError.message);
  }

  // Resposta final
  return new Response(JSON.stringify({ success: true, message: "Operação concluída." }), { status: 200 });
})