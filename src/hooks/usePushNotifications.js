import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  // ... (código da função auxiliar, sem alterações)
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ... (useEffect, sem alterações)
    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
          } catch (error) { console.error("Erro ao verificar inscrição:", error); setSubscriptionError(error);
          } finally { setIsLoading(false); }
        }
      };
      checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    // ... (função handleSubscribe, sem alterações)
    if (!VAPID_PUBLIC_KEY) { /* ... */ return; }
    if (isSubscribed) { /* ... */ return; }
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { throw new Error('Permissão para notificações foi negada.'); }
        const registration = await navigator.serviceWorker.ready;
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");
        const { error } = await supabase.functions.invoke('save-push-subscription', { body: { subscription, userId: user.id } });
        if (error) throw error;
        console.log('Inscrição realizada com sucesso!');
        setIsSubscribed(true);
    } catch (error) {
        console.error("Falha ao se inscrever:", error); setSubscriptionError(error);
        alert(`Erro ao ativar notificações: ${error.message}`);
    }
  };

  // NOVO: Função para cancelar a inscrição
  const handleUnsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Cancela no nível do navegador
        await subscription.unsubscribe();

        // 2. Cancela no seu banco de dados
        const { error } = await supabase.functions.invoke('delete-push-subscription');
        if (error) throw error;
        
        console.log("Inscrição cancelada com sucesso.");
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Falha ao cancelar inscrição:", error);
      alert(`Erro ao cancelar notificações: ${error.message}`);
    }
  };

  return { isSubscribed, handleSubscribe, handleUnsubscribe, subscriptionError, isLoading };
}