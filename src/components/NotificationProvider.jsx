import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({ children }) {
  const [permission, setPermission] = useState(Notification.permission);
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    enabled: true,
    newOrders: true,
    statusChanges: true,
    payments: true,
    deliveries: true,
    sound: true
  });
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [trackedOrders, setTrackedOrders] = useState(new Map());

  // Carregar user e preferências
  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.notification_preferences) {
        setPreferences({ ...preferences, ...u.notification_preferences });
      }
    }).catch(() => {});
  }, []);

  // Monitorar pedidos
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    refetchInterval: 10000, // A cada 10 segundos
    enabled: !!user
  });

  // Função para solicitar permissão
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notificações não suportadas neste navegador');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      toast.success('Notificações ativadas!');
      return true;
    } else {
      toast.error('Permissão negada para notificações');
      return false;
    }
  };

  // Função para enviar notificação
  const sendNotification = (title, body, data = {}) => {
    if (!preferences.enabled || permission !== 'granted') return;
    
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.orderId || 'notification',
      requireInteraction: false,
      silent: !preferences.sound,
      data
    });

    notification.onclick = () => {
      window.focus();
      if (data.url) {
        window.location.href = data.url;
      }
      notification.close();
    };

    // Auto-fechar após 10 segundos
    setTimeout(() => notification.close(), 10000);
  };

  // Detectar novos pedidos
  useEffect(() => {
    if (!orders.length || !user) return;

    const currentCount = orders.length;
    
    if (lastOrderCount > 0 && currentCount > lastOrderCount && preferences.newOrders) {
      const newOrders = orders.slice(0, currentCount - lastOrderCount);
      
      newOrders.forEach(order => {
        sendNotification(
          '🆕 Novo Pedido!',
          `${order.client_name} - ${order.vehicle_model}`,
          { orderId: order.id, url: `/orderdetails?id=${order.id}` }
        );
      });
    }
    
    setLastOrderCount(currentCount);
  }, [orders.length, user]);

  // Detectar mudanças de status
  useEffect(() => {
    if (!orders.length || !user) return;

    orders.forEach(order => {
      const previousOrder = trackedOrders.get(order.id);
      
      if (!previousOrder) {
        trackedOrders.set(order.id, order);
        return;
      }

      // Status mudou
      if (previousOrder.current_status !== order.current_status) {
        const statusNotifications = {
          pagamento: preferences.payments,
          agendamento: preferences.deliveries,
          patio: preferences.deliveries,
          entrega: preferences.deliveries
        };

        const shouldNotify = preferences.statusChanges && 
          (statusNotifications[order.current_status] !== false);

        if (shouldNotify) {
          const statusEmojis = {
            documentos_cliente: '📄',
            nota_fiscal: '🧾',
            pagamento: '💰',
            emplacamento: '🔧',
            agendamento: '📅',
            patio: '🅿️',
            entrega: '🚗',
            avaliacao: '⭐',
            concluido: '✅'
          };

          const emoji = statusEmojis[order.current_status] || '🔔';

          sendNotification(
            `${emoji} Status Atualizado`,
            `${order.client_name}: ${order.status_publico || order.current_status}`,
            { orderId: order.id, url: `/orderdetails?id=${order.id}` }
          );
        }

        trackedOrders.set(order.id, order);
      }
    });

    setTrackedOrders(new Map(trackedOrders));
  }, [orders, user, preferences]);

  // Salvar preferências
  const updatePreferences = async (newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    
    try {
      await base44.auth.updateMe({ notification_preferences: updated });
      toast.success('Preferências salvas');
    } catch (err) {
      toast.error('Erro ao salvar preferências');
    }
  };

  const value = {
    permission,
    preferences,
    requestPermission,
    updatePreferences,
    sendNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}