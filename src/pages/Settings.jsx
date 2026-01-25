import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Volume2, VolumeX, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/components/NotificationProvider';
import { toast } from 'sonner';

export default function Settings() {
  const { permission, preferences, requestPermission, updatePreferences } = useNotifications();
  const [testNotification, setTestNotification] = useState(false);

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      toast.error('Ative as notificações primeiro');
      return;
    }

    setTestNotification(true);
    
    const notification = new Notification('🔔 Notificação de Teste', {
      body: 'Sistema de notificações funcionando corretamente!',
      icon: '/favicon.ico'
    });

    setTimeout(() => {
      notification.close();
      setTestNotification(false);
    }, 5000);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Configurações
        </h1>
        <p className="text-slate-500 mt-1">
          Gerencie suas preferências de notificação
        </p>
      </div>

      {/* Status das Notificações */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {permission === 'granted' ? (
              <Bell className="w-5 h-5 text-emerald-600" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
            Status das Notificações
          </CardTitle>
          <CardDescription>
            Receba alertas em tempo real sobre seus pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'default' && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p className="font-medium mb-2">Ative as notificações para:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Receber alertas de novos pedidos</li>
                  <li>Ser notificado sobre mudanças de status</li>
                  <li>Não perder atualizações importantes</li>
                  <li>Funciona mesmo com aba fechada</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {permission === 'denied' && (
            <Alert className="border-red-200 bg-red-50">
              <BellOff className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-medium">Notificações bloqueadas</p>
                <p className="text-sm mt-1">
                  Você bloqueou as notificações. Para ativar, clique no ícone de cadeado na barra de endereço
                  e permita notificações.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {permission === 'granted' && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <Bell className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                <p className="font-medium">✅ Notificações ativadas</p>
                <p className="text-sm mt-1">
                  Você receberá alertas em tempo real sobre seus pedidos
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            {permission !== 'granted' && (
              <Button onClick={requestPermission} className="gap-2">
                <Bell className="w-4 h-4" />
                Ativar Notificações
              </Button>
            )}
            
            {permission === 'granted' && (
              <Button 
                variant="outline" 
                onClick={handleTestNotification}
                disabled={testNotification}
                className="gap-2"
              >
                {testNotification ? '✓ Enviada!' : '🔔 Testar Notificação'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências de Notificação</CardTitle>
          <CardDescription>
            Escolha quais notificações deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <Label className="font-semibold text-base">Notificações Push</Label>
                <p className="text-sm text-slate-500">Ativar/desativar todas as notificações</p>
              </div>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={(checked) => updatePreferences({ enabled: checked })}
              disabled={permission !== 'granted'}
            />
          </div>

          <Separator />

          {/* Tipos de Notificação */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Tipos de Notificação</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Novos Pedidos</Label>
                <p className="text-sm text-slate-500">Quando um novo pedido é criado</p>
              </div>
              <Switch
                checked={preferences.newOrders}
                onCheckedChange={(checked) => updatePreferences({ newOrders: checked })}
                disabled={!preferences.enabled || permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Mudanças de Status</Label>
                <p className="text-sm text-slate-500">Quando um pedido muda de etapa</p>
              </div>
              <Switch
                checked={preferences.statusChanges}
                onCheckedChange={(checked) => updatePreferences({ statusChanges: checked })}
                disabled={!preferences.enabled || permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Pagamentos</Label>
                <p className="text-sm text-slate-500">Quando um pagamento é confirmado</p>
              </div>
              <Switch
                checked={preferences.payments}
                onCheckedChange={(checked) => updatePreferences({ payments: checked })}
                disabled={!preferences.enabled || permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Entregas</Label>
                <p className="text-sm text-slate-500">Agendamentos e entregas</p>
              </div>
              <Switch
                checked={preferences.deliveries}
                onCheckedChange={(checked) => updatePreferences({ deliveries: checked })}
                disabled={!preferences.enabled || permission !== 'granted'}
              />
            </div>
          </div>

          <Separator />

          {/* Som */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {preferences.sound ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <Label className="font-medium">Som das Notificações</Label>
                <p className="text-sm text-slate-500">Reproduzir som ao receber notificação</p>
              </div>
            </div>
            <Switch
              checked={preferences.sound}
              onCheckedChange={(checked) => updatePreferences({ sound: checked })}
              disabled={!preferences.enabled || permission !== 'granted'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Como funcionam as notificações:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Funcionam mesmo com a aba fechada</li>
                <li>Aparecem na área de notificações do sistema</li>
                <li>Clique na notificação para ir direto ao pedido</li>
                <li>São atualizadas em tempo real (10 segundos)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}