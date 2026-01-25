import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Car, User, CreditCard, ArrowLeft, ArrowRight, 
  Check, Loader2, FileText, Building2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { generateTrackingCode } from '@/components/workflow/WorkflowEngine';
import TradeInSection from '@/components/TradeInSection';

const STEPS = [
  { id: 'client', title: 'Dados do Cliente', icon: User },
  { id: 'vehicle', title: 'Dados do Veículo', icon: Car },
  { id: 'payment', title: 'Pagamento', icon: CreditCard },
  { id: 'review', title: 'Revisão', icon: Check }
];

export default function NewOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState({
    // Tipo de Pedido
    order_type: 'pedido_estoque',
    
    // Cliente
    client_name: '',
    client_email: '',
    client_phone: '',
    client_cpf: '',
    client_type: 'pf',
    
    // Veículo
    vehicle_model: '',
    vehicle_color: '',
    vehicle_year: '',
    
    // Pagamento
    payment_method: 'pix',
    financiamento_tipo: 'interno',
    financiamento_valor_total: '',
    financiamento_entrada: '',
    financiamento_parcelas: '',
    has_entrada: false,
    entrada_valor: '',
    
    // Trade-in
    has_trade_in: false,
    trade_in_plate: '',
    trade_in_owner_is_buyer: '',
    trade_in_has_bonus: '',
    trade_in_parentesco_type: '',
    trade_in_no_recent_transfer: false,
    trade_in_requires_manager_approval: false
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const trackingCode = generateTrackingCode();
      const now = new Date().toISOString();
      
      const orderData = {
        order_type: data.order_type || 'pedido_estoque',
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        client_cpf: data.client_cpf,
        client_type: data.client_type,
        vehicle_model: data.vehicle_model,
        vehicle_color: data.vehicle_color,
        vehicle_year: data.vehicle_year,
        payment_method: data.payment_method,
        financiamento_tipo: data.financiamento_tipo,
        financiamento_valor_total: data.financiamento_valor_total ? parseFloat(data.financiamento_valor_total) : null,
        financiamento_entrada: data.financiamento_entrada ? parseFloat(data.financiamento_entrada) : null,
        financiamento_parcelas: data.financiamento_parcelas ? parseInt(data.financiamento_parcelas) : null,
        financiamento_status: data.payment_method === 'financiamento' && data.financiamento_tipo === 'interno' ? 'pendente' : null,
        has_entrada: data.has_entrada || false,
        entrada_valor: data.entrada_valor ? parseFloat(data.entrada_valor) : null,
        has_trade_in: data.has_trade_in || false,
        trade_in_plate: data.trade_in_plate || null,
        trade_in_owner_is_buyer: data.trade_in_owner_is_buyer || null,
        trade_in_has_bonus: data.trade_in_has_bonus || null,
        trade_in_parentesco_type: data.trade_in_parentesco_type || null,
        trade_in_no_recent_transfer: data.trade_in_no_recent_transfer || false,
        trade_in_requires_manager_approval: data.trade_in_requires_manager_approval || false,
        tracking_code: trackingCode,
        current_status: 'pedido_criado',
        status_publico: 'Pedido Criado',
        payment_status: 'aguardando',
        last_updated_at: now,
        last_updated_by: 'system'
      };
      
      const order = await base44.entities.Order.create(orderData);
      
      // Notificar gerente se houver validação de trade-in
      if (data.trade_in_requires_manager_approval) {
        try {
          await base44.integrations.Core.SendEmail({
            to: 'gerente@concessionaria.com',
            subject: '🚨 URGENTE: Aprovação de Trade-In Necessária',
            body: `
Olá Gerente,

Um novo pedido requer sua aprovação urgente:

🚗 Pedido: ${trackingCode}
👤 Cliente: ${data.client_name}
🚙 Veículo: ${data.vehicle_model}

⚠️ MOTIVO: Veículo usado com bônus em nome de terceiro

📋 Parentesco: ${data.trade_in_parentesco_type}
🚗 Placa usado: ${data.trade_in_plate}

Acesse: ${window.location.origin}/orderdetails?id=${order.id}

Atenciosamente,
Sistema VeiculoTrack
            `
          });
        } catch (err) {
          console.warn('Erro ao enviar email:', err);
        }
      }
      
      await base44.entities.ActionLog.create({
        order_id: order.id,
        tracking_code: trackingCode,
        action: 'Pedido criado',
        user_email: 'admin',
        user_name: 'Administrador',
        details: JSON.stringify({ 
          client_name: data.client_name, 
          vehicle: data.vehicle_model,
          order_type: data.order_type 
        })
      });
      
      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Pedido criado com sucesso!', {
        description: `Código: ${order.tracking_code}`
      });
      navigate(createPageUrl(`OrderDetails?id=${order.id}`));
    },
    onError: (error) => {
      toast.error('Erro ao criar pedido', {
        description: error.message
      });
    }
  });

  const validateStep = (step) => {
    switch (step) {
      case 0: // Cliente
        if (!formData.client_name || !formData.client_email || !formData.client_phone) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
        if (!formData.client_email.includes('@')) {
          toast.error('Email inválido');
          return false;
        }
        return true;
      case 1: // Veículo
        if (!formData.vehicle_model || !formData.vehicle_color) {
          toast.error('Preencha o modelo e cor do veículo');
          return false;
        }
        return true;
      case 2: // Pagamento
        // Validar trade-in se necessário
        if (formData.has_trade_in) {
          if (!formData.trade_in_plate) {
            toast.error('Preencha a placa do veículo usado');
            return false;
          }
          if (!formData.trade_in_owner_is_buyer) {
            toast.error('Informe se o usado está no nome do cliente');
            return false;
          }
          if (formData.trade_in_owner_is_buyer === 'nao' && !formData.trade_in_has_bonus) {
            toast.error('Informe se há bônus na troca');
            return false;
          }
          if (formData.trade_in_has_bonus === 'sim') {
            if (!formData.trade_in_parentesco_type) {
              toast.error('Selecione o tipo de parentesco');
              return false;
            }
            if (!formData.trade_in_no_recent_transfer) {
              toast.error('Confirme que o veículo não foi transferido recentemente');
              return false;
            }
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Tipo de Pedido */}
            <div>
              <Label className="mb-2 block">Tipo de Pedido</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={formData.order_type === 'pedido_estoque' ? 'default' : 'outline'}
                  onClick={() => updateField('order_type', 'pedido_estoque')}
                  className="h-20 flex-col gap-2"
                >
                  <Car className="w-6 h-6" />
                  Veículo em Estoque
                </Button>
                <Button
                  type="button"
                  variant={formData.order_type === 'pedido_fabrica' ? 'default' : 'outline'}
                  onClick={() => updateField('order_type', 'pedido_fabrica')}
                  className="h-20 flex-col gap-2"
                >
                  <Building2 className="w-6 h-6" />
                  Encomendar de Fábrica
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.client_type === 'pf' ? 'default' : 'outline'}
                onClick={() => updateField('client_type', 'pf')}
                className="h-20 flex-col gap-2"
              >
                <User className="w-6 h-6" />
                Pessoa Física
              </Button>
              <Button
                type="button"
                variant={formData.client_type === 'pj' ? 'default' : 'outline'}
                onClick={() => updateField('client_type', 'pj')}
                className="h-20 flex-col gap-2"
              >
                <Building2 className="w-6 h-6" />
                Pessoa Jurídica
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.client_name}
                  onChange={(e) => updateField('client_name', e.target.value)}
                  placeholder="João da Silva"
                  className="mt-1"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => updateField('client_email', e.target.value)}
                    placeholder="joao@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.client_phone}
                    onChange={(e) => updateField('client_phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cpf">
                  {formData.client_type === 'pf' ? 'CPF' : 'CNPJ'}
                </Label>
                <Input
                  id="cpf"
                  value={formData.client_cpf}
                  onChange={(e) => updateField('client_cpf', e.target.value)}
                  placeholder={formData.client_type === 'pf' ? '000.000.000-00' : '00.000.000/0001-00'}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="model">Modelo do Veículo *</Label>
              <Input
                id="model"
                value={formData.vehicle_model}
                onChange={(e) => updateField('vehicle_model', e.target.value)}
                placeholder="Ex: Toyota Corolla XEi 2024"
                className="mt-1"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Cor *</Label>
                <Input
                  id="color"
                  value={formData.vehicle_color}
                  onChange={(e) => updateField('vehicle_color', e.target.value)}
                  placeholder="Ex: Branco Pérola"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  value={formData.vehicle_year}
                  onChange={(e) => updateField('vehicle_year', e.target.value)}
                  placeholder="Ex: 2024"
                  className="mt-1"
                />
              </div>
            </div>
            
            <TradeInSection 
              formData={formData}
              setFormData={setFormData}
              user={{}}
            />
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { id: 'financiamento', label: 'Financiamento', icon: '🏦' },
                  { id: 'vista', label: 'À Vista', icon: '💵' }
                ].map(method => (
                  <Button
                    key={method.id}
                    type="button"
                    variant={formData.payment_method === method.id ? 'default' : 'outline'}
                    onClick={() => updateField('payment_method', method.id)}
                    className="h-20 flex-col gap-2"
                  >
                    <span className="text-2xl">{method.icon}</span>
                    {method.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {formData.payment_method === 'financiamento' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 p-4 border rounded-lg bg-blue-50"
              >
                <div>
                  <Label>Tipo de Financiamento</Label>
                  <Select
                    value={formData.financiamento_tipo}
                    onValueChange={(v) => updateField('financiamento_tipo', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interno">Financiamento Interno</SelectItem>
                      <SelectItem value="externo">Financiamento Externo (Banco)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Valor Total</Label>
                    <Input
                      type="number"
                      value={formData.financiamento_valor_total}
                      onChange={(e) => updateField('financiamento_valor_total', e.target.value)}
                      placeholder="0,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Entrada</Label>
                    <Input
                      type="number"
                      value={formData.financiamento_entrada}
                      onChange={(e) => updateField('financiamento_entrada', e.target.value)}
                      placeholder="0,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Parcelas</Label>
                    <Input
                      type="number"
                      value={formData.financiamento_parcelas}
                      onChange={(e) => updateField('financiamento_parcelas', e.target.value)}
                      placeholder="48"
                      className="mt-1"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Entrada Opcional */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-slate-50">
              <Checkbox
                id="hasEntrada"
                checked={formData.has_entrada}
                onCheckedChange={(checked) => {
                  updateField('has_entrada', checked);
                  if (!checked) updateField('entrada_valor', '');
                }}
              />
              <div className="flex-1">
                <Label htmlFor="hasEntrada" className="font-medium cursor-pointer">
                  Valor de Entrada
                </Label>
                <p className="text-sm text-slate-500">
                  Marque se houver entrada separada
                </p>
              </div>
              {formData.has_entrada && (
                <Input
                  type="number"
                  value={formData.entrada_valor}
                  onChange={(e) => updateField('entrada_valor', e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-32"
                />
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Dados do Cliente
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Nome:</span>
                  <p className="font-medium">{formData.client_name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tipo:</span>
                  <p className="font-medium">{formData.client_type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="font-medium">{formData.client_email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Telefone:</span>
                  <p className="font-medium">{formData.client_phone}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-600" />
                Veículo
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Modelo:</span>
                  <p className="font-medium">{formData.vehicle_model}</p>
                </div>
                <div>
                  <span className="text-slate-500">Cor:</span>
                  <p className="font-medium">{formData.vehicle_color}</p>
                </div>
                {formData.vehicle_year && (
                  <div>
                    <span className="text-slate-500">Ano:</span>
                    <p className="font-medium">{formData.vehicle_year}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Usado na troca:</span>
                  <p className="font-medium">{formData.has_trade_in ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Pagamento
              </h3>
              <div className="text-sm">
                <span className="text-slate-500">Forma de pagamento:</span>
                <p className="font-medium capitalize">{formData.payment_method}</p>
                
                {formData.payment_method === 'financiamento' && (
                  <div className="mt-3 pt-3 border-t grid md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-500">Tipo:</span>
                      <p className="font-medium">
                        {formData.financiamento_tipo === 'interno' ? 'Interno' : 'Externo'}
                      </p>
                    </div>
                    {formData.financiamento_valor_total && (
                      <div>
                        <span className="text-slate-500">Valor:</span>
                        <p className="font-medium">
                          R$ {parseFloat(formData.financiamento_valor_total).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {formData.financiamento_parcelas && (
                      <div>
                        <span className="text-slate-500">Parcelas:</span>
                        <p className="font-medium">{formData.financiamento_parcelas}x</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${isCompleted ? 'bg-emerald-500 text-white' : 
                        isActive ? 'bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50' : 
                        'bg-slate-100 text-slate-400'}
                    `}>
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`
                      text-xs mt-2 font-medium hidden md:block
                      ${isActive ? 'text-emerald-600' : 'text-slate-400'}
                    `}>
                      {step.title}
                    </span>
                  </div>
                  
                  {index < STEPS.length - 1 && (
                    <div className={`
                      flex-1 h-1 mx-2 rounded-full
                      ${index < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}
                    `} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* Form Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription>
              Passo {currentStep + 1} de {STEPS.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              {currentStep === STEPS.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Criar Pedido
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={nextStep} className="gap-2">
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}