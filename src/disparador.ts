// src/disparador.ts

import dotenv from 'dotenv';
import twilio from 'twilio';

// --- CONFIGURAÇÃO INICIAL ---
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
const BOT_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// --- SIMULAÇÃO DA LÓGICA DO SEU APLICATIVO ---

/**
 * Busca todos os usuários que devem receber a notificação.
 * @returns Uma lista de usuários com nome e telefone.
 */
async function getActiveUsers(): Promise<{ name: string; phone: string; }[]> {
    console.log("Buscando todos os usuários ativos...");
    // LÓGICA REAL AQUI: 
    // Ex: return await prisma.user.findMany({ where: { wantsNotifications: true } });
    return [
        { name: "Alice", phone: "whatsapp:+5581999999999" }, // Substitua por números reais
        { name: "Beto", phone: "whatsapp:+5581888888888" }, // para teste
        // ... mais usuários
    ];
}

/**
 * Este é o seu "parse pronto". Ele gera uma mensagem personalizada para cada usuário.
 * @param user - O objeto do usuário.
 * @returns A string da mensagem personalizada.
 */
function createPersonalizedMessage(user: { name: string; phone: string; }): string {
    // Aqui você pode buscar dados financeiros reais do usuário para o mês.
    const expenses = 3450.00;
    const message = `Olá, ${user.name}! 🌟\n\nSeu resumo financeiro de Setembro chegou!\n\nVocê gastou *R$ ${expenses.toFixed(2)}* este mês. Acesse o app para ver todos os detalhes e planejar Outubro! 💰\n\nAbraços,\nSeu App Financeiro.`;
    return message;
}

/**
 * Função principal que orquestra o disparo em massa.
 */
async function sendBulkMessages() {
    console.log("Iniciando o disparo de mensagens em massa...");
    const users = await getActiveUsers();
    console.log(`Encontrados ${users.length} usuários para notificar.`);

    for (const user of users) {
        const message = createPersonalizedMessage(user);
        
        try {
            await twilioClient.messages.create({
                from: BOT_NUMBER!,
                to: user.phone,
                body: message,
            });
            console.log(`Mensagem enviada com sucesso para ${user.name} (${user.phone})`);
        } catch (error: any) {
            console.error(`Falha ao enviar para ${user.name}: ${error.message}`);
        }

        // IMPORTANTE: Adiciona um atraso para evitar ser bloqueado pelo WhatsApp.
        // 1 segundo de atraso entre cada mensagem. Ajuste conforme necessário.
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("Disparo de mensagens em massa concluído.");
}

// --- EXECUÇÃO DO SCRIPT ---
sendBulkMessages();