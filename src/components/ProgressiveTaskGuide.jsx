import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  CheckCircle2, 
  Lock, 
  AlertCircle, 
  Lightbulb,
  ArrowRight,
  FileText,
  CreditCard,
  Car,
  Calendar,
  Factory
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ========== GUIAS POR ETAPA ==========
const TASK_GUIDES = {
  pedido_criado: {
    icon: CheckCircle2,
    title: 'Pedido Criado com Sucesso!',
    color: 'emerald',
    completed: true
  },
  
  financiamento_interno: {
    icon: CreditCard,
    title: 'Análise de Financiamento Interno',
    color: 'blue',
    instructions: {
      title: '💰 Você precisa analisar o crédito do cliente',
      steps: [
        'Acesse o sistema de análise de crédito',
        'Verifique o score e histórico do cliente',
        'Preencha o valor total, entrada e parcelas',
        'Clique em "Aprovar" ou "Recusar" o financiamento'
      ],
      warning: '⚠️ Se recusar, o pedido ficará travado e você precisará ajustar a forma de pagamento.',
      whatHappens: '✅ Quando aprovar, o sistema avança automaticamente para "Documentação"'
    }
  },
  
  fabrica_documentacao: {
    icon: Factory,
    title: 'Fábrica - Documentação',
    color: 'blue',
    instructions: {
      title: '📋 Colete os documentos antes de encomendar',
      steps: [
        'Entre em contato com o cliente',
        'Solicite os documentos listados abaixo',
        'Marque cada checkbox conforme recebe',
        'Quando completo, avança para "Encomendado"'
      ],
      tip: '💡 Para pedidos de fábrica, precisamos documentação antes',
      whatHappens: '✅ Quando completo, pode encomendar na montadora'
    }
  },
  
  fabrica_encomendado: {
    icon: Factory,
    title: 'Fábrica - Encomendado',
    color: 'purple',
    instructions: {
      title: '🏭 Pedido realizado na montadora',
      steps: [
        'Preencha data do pedido na montadora',
        'Informe número do pedido',
        'Adicione prazo estimado de chegada',
        'Aguarde faturamento da montadora'
      ],
      whatHappens: '✅ Quando montadora faturar, avance para próxima etapa'
    }
  },
  
  fabrica_faturado: {
    icon: Factory,
    title: 'Fábrica - Faturado',
    color: 'green',
    instructions: {
      title: '🚚 Veículo faturado pela montadora',
      steps: [
        'Preencha NF da montadora',
        'Informe data de faturamento',
        'Aguarde chegada do veículo',
        'Quando chegar, marque "Veículo Chegou"'
      ],
      tip: '💡 Sistema converterá automaticamente para fluxo normal',
      whatHappens: '✅ Quando marcar, avança para "Pagamento"'
    }
  },
  
  documentos_cliente: {
    icon: FileText,
    title: 'Documentação do Cliente',
    color: 'amber',
    instructions: {
      title: '📋 Você precisa coletar os documentos do cliente',
      steps: [
        'Entre em contato com o cliente',
        'Solicite os documentos listados abaixo',
        'Verifique se estão legíveis e dentro da validade',
        'Marque cada checkbox conforme recebe o documento',
        'Sistema avança automaticamente quando todos estiverem ✓'
      ],
      tip: '💡 DICA: Você pode enviar um email automático ao cliente',
      whatHappens: '✅ Quando todos os documentos estiverem marcados, avança para "Nota Fiscal"'
    }
  },
  
  nota_fiscal: {
    icon: FileText,
    title: 'Emissão de Nota Fiscal',
    color: 'purple',
    instructions: {
      title: '🧾 Você precisa emitir a Nota Fiscal',
      steps: [
        'Acesse o sistema fiscal da empresa',
        'Gere a nota fiscal com os dados do cliente',
        'Preencha os campos abaixo com os dados da NF',
        'Marque como "Emitida"',
        'Sistema avança automaticamente para "Pagamento"'
      ],
      warning: '⚠️ Verifique os dados antes de emitir. Erros na NF causam problemas!',
      whatHappens: '✅ Quando marcar como emitida, avança para "Pagamento"'
    }
  },
  
  pagamento: {
    icon: CreditCard,
    title: 'Confirmação de Pagamento',
    color: 'green',
    instructions: {
      title: '💰 Você precisa confirmar o pagamento',
      steps: [
        'Aguarde o cliente efetuar o pagamento',
        'Verifique o comprovante no sistema bancário',
        'Preencha os dados de confirmação',
        'Marque "Pagamento Total Confirmado"',
        'Sistema avança automaticamente para "Emplacamento"'
      ],
      tip: '💡 FORMAS: PIX, Boleto, Financiamento ou À Vista',
      whatHappens: '✅ Quando confirmar, avança para "Emplacamento"'
    }
  },
  
  emplacamento: {
    icon: Car,
    title: 'Emplacamento do Veículo',
    color: 'blue',
    instructions: {
      title: '🚗 Você precisa emplacar o veículo',
      steps: [
        'Envie documentação para o despachante',
        'Aguarde emissão da placa',
        'Quando receber, insira a placa no sistema',
        'Marque como "Concluído"',
        'Sistema avança automaticamente para "Agendamento"'
      ],
      tip: '💡 Prazo médio: 5-7 dias úteis',
      whatHappens: '✅ Quando concluir, o cliente poderá agendar a retirada'
    }
  },
  
  agendamento: {
    icon: Calendar,
    title: 'Agendamento de Entrega',
    color: 'teal',
    instructions: {
      title: '📅 Aguardando cliente agendar a retirada',
      steps: [
        'Sistema enviará email ao cliente quando você liberar',
        'Cliente acessará o link e escolherá data/hora',
        'Você será notificado quando cliente agendar',
        'Sistema avança automaticamente para "Pátio"'
      ],
      tip: '💡 Libere o agendamento quando veículo estiver pronto',
      whatHappens: '✅ Quando cliente agendar, avança para "Pátio"'
    }
  },
  
  patio: {
    icon: Car,
    title: 'Veículo no Pátio',
    color: 'indigo',
    instructions: {
      title: '🏢 Aguardando dia da entrega',
      steps: [
        'Veículo deve estar no pátio',
        'Entregador preparará o veículo',
        'No dia agendado (ou véspera), passe para "Entrega"',
        'Sistema permite avançar apenas no dia correto'
      ],
      tip: '💡 Só pode avançar no dia da entrega ou 1 dia antes',
      whatHappens: '✅ No dia certo, pode iniciar a entrega'
    }
  },
  
  entrega: {
    icon: CheckCircle2,
    title: 'Entrega do Veículo',
    color: 'emerald',
    instructions: {
      title: '🚚 Entregador está realizando a entrega',
      steps: [
        'Entregador entrega o veículo ao cliente',
        'Explica funcionamento e características',
        'Marca como "Entregue" no sistema',
        'Sistema avança automaticamente para "Avaliação"'
      ],
      whatHappens: '✅ Cliente receberá email para avaliar a experiência'
    }
  }
};

export default function ProgressiveTaskGuide({ order, onUpdate }) {
  const currentStage = order.current_status;
  const guide = TASK_GUIDES[currentStage];
  
  // Não mostrar guia para etapas que não requerem ação do usuário
  if (!guide || currentStage === 'concluido' || currentStage === 'cancelado' || currentStage === 'avaliacao' || currentStage === 'pedido_criado') {
    return null;
  }

  // ========== INSTRUÇÕES ==========
  const renderInstructions = () => {
    if (!guide.instructions) return null;
    
    return (
      <Alert className="border-2 border-amber-200 bg-amber-50">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <AlertDescription>
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-amber-900">
              {guide.instructions.title}
            </h3>
            
            <div className="space-y-2">
              <p className="font-semibold text-amber-800">📝 PASSOS:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                {guide.instructions.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
            
            {guide.instructions.tip && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {guide.instructions.tip}
                </p>
              </div>
            )}
            
            {guide.instructions.warning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  {guide.instructions.warning}
                </p>
              </div>
            )}
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-800 flex items-start gap-2">
                <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {guide.instructions.whatHappens}
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // ========== CAMPOS DA ETAPA ==========
  const renderTaskFields = () => {
    // Documentação
    if (currentStage === 'documentos_cliente' || currentStage === 'fabrica_documentacao') {
      const clientType = order.client_type;
      
      const docsPF = [
        { field: 'docs_rg', label: 'RG (frente e verso)', helper: 'Original ou cópia autenticada' },
        { field: 'docs_cpf', label: 'CPF', helper: 'Original ou cópia' },
        { field: 'docs_cnh', label: 'CNH (válida)', helper: 'Dentro da validade' },
        { field: 'docs_comprovante_residencia', label: 'Comprovante de Residência', helper: 'Até 3 meses' }
      ];
      
      const docsPJ = [
        { field: 'docs_contrato_social', label: 'Contrato Social', helper: 'Atualizado e registrado' },
        { field: 'docs_cnpj', label: 'Cartão CNPJ', helper: 'Original ou cópia' }
      ];
      
      const docsTradeIn = [
        { field: 'docs_laudo_usado', label: 'Laudo do Veículo Usado', helper: 'Vistoria técnica' },
        { field: 'docs_pesquisa_debitos', label: 'Pesquisa de Débitos', helper: 'Atualizada' },
        { field: 'docs_dut_reconhecido', label: 'DUT com Firma Reconhecida', helper: 'Cartório' },
        { field: 'docs_multas_pagas', label: 'Comprovante de Multas Pagas', helper: 'Todas quitadas' }
      ];
      
      const checks = clientType === 'pf' ? docsPF : docsPJ;
      
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos Necessários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="font-semibold text-sm text-slate-700">
                {clientType === 'pf' ? 'Pessoa Física:' : 'Pessoa Jurídica:'}
              </p>
              {checks.map(check => (
                <div key={check.field} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={order[check.field] || false}
                    onCheckedChange={(checked) => onUpdate({ [check.field]: checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label className="font-medium text-sm cursor-pointer">
                      {check.label}
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">{check.helper}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {order.has_trade_in && (
              <div className="space-y-3 pt-4 border-t">
                <p className="font-semibold text-sm text-slate-700">
                  Veículo Usado (Troca):
                </p>
                {docsTradeIn.map(check => (
                  <div key={check.field} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <Checkbox
                      checked={order[check.field] || false}
                      onCheckedChange={(checked) => onUpdate({ [check.field]: checked })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label className="font-medium text-sm cursor-pointer">
                        {check.label}
                      </Label>
                      <p className="text-xs text-amber-600 mt-1">{check.helper}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Banner GIGANTE de Ação */}
      <Card className="border-4 border-blue-500 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0"
            >
              <Clock className="w-12 h-12 text-white" />
            </motion.div>
            <div className="flex-1">
              <motion.h2
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg"
              >
                👉 VOCÊ ESTÁ AQUI
              </motion.h2>
              <p className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                {guide.title}
              </p>
              <p className="text-white/90 text-xl mt-3 font-semibold">
                Complete as tarefas abaixo para avançar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderInstructions()}
      {renderTaskFields()}
    </motion.div>
  );
}