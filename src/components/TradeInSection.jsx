import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Upload, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TradeInSection({ formData, setFormData, user }) {
  const [showFields, setShowFields] = useState(formData.has_trade_in || false);
  const [showBonusQuestion, setShowBonusQuestion] = useState(
    formData.has_trade_in && formData.trade_in_owner_is_buyer === 'nao'
  );
  const [showValidation, setShowValidation] = useState(
    formData.has_trade_in && 
    formData.trade_in_owner_is_buyer === 'nao' && 
    formData.trade_in_has_bonus === 'sim'
  );

  // Auto-formatar placa
  const formatPlate = (value) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 7) return clean.slice(0, 3) + '-' + clean.slice(3);
    return clean.slice(0, 3) + '-' + clean.slice(3, 7);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    setShowFields(formData.has_trade_in);
  }, [formData.has_trade_in]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🚗 Veículo Usado na Troca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* CHECKBOX INICIAL */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={formData.has_trade_in}
            onCheckedChange={(checked) => {
              updateField('has_trade_in', checked);
              setShowFields(checked);
              if (!checked) {
                // Limpar campos
                updateField('trade_in_plate', '');
                updateField('trade_in_owner_is_buyer', '');
                updateField('trade_in_has_bonus', '');
                updateField('trade_in_parentesco_type', '');
                updateField('trade_in_no_recent_transfer', false);
                updateField('trade_in_requires_manager_approval', false);
                setShowBonusQuestion(false);
                setShowValidation(false);
              }
            }}
          />
          <Label className="cursor-pointer">Cliente está dando um veículo usado como entrada</Label>
        </div>

        <AnimatePresence>
          {showFields && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* PLACA */}
              <div>
                <Label>Placa do Veículo Usado *</Label>
                <Input
                  placeholder="SVJ-3G87"
                  maxLength={8}
                  value={formData.trade_in_plate || ''}
                  onChange={(e) => {
                    const formatted = formatPlate(e.target.value);
                    updateField('trade_in_plate', formatted);
                  }}
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Ex: SVJ-3G87 ou ABC-1D23
                </p>
              </div>

              {/* PERGUNTA: NO NOME DO CLIENTE? */}
              <div>
                <Label className="mb-2 block">O usado está em nome do cliente acima na proposta? *</Label>
                <RadioGroup
                  value={formData.trade_in_owner_is_buyer || ''}
                  onValueChange={(value) => {
                    updateField('trade_in_owner_is_buyer', value);
                    if (value === 'sim') {
                      setShowBonusQuestion(false);
                      setShowValidation(false);
                      updateField('trade_in_has_bonus', '');
                      updateField('trade_in_parentesco_type', '');
                      updateField('trade_in_no_recent_transfer', false);
                      updateField('trade_in_requires_manager_approval', false);
                    } else {
                      setShowBonusQuestion(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                    <RadioGroupItem value="sim" id="owner-sim" />
                    <Label htmlFor="owner-sim" className="flex-1 cursor-pointer">
                      ✅ SIM - Está no nome do cliente
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border-2 border-amber-300 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                    <RadioGroupItem value="nao" id="owner-nao" />
                    <Label htmlFor="owner-nao" className="flex-1 cursor-pointer">
                      ⚠️ NÃO - Está em nome de outra pessoa
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <AnimatePresence>
                {showBonusQuestion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {/* PERGUNTA: TEM BÔNUS? */}
                    <div>
                      <Label className="mb-2 block">Tem bônus de usado na troca? *</Label>
                      <RadioGroup
                        value={formData.trade_in_has_bonus || ''}
                        onValueChange={(value) => {
                          updateField('trade_in_has_bonus', value);
                          const needsValidation = value === 'sim';
                          setShowValidation(needsValidation);
                          updateField('trade_in_requires_manager_approval', needsValidation);
                          
                          if (!needsValidation) {
                            updateField('trade_in_parentesco_type', '');
                            updateField('trade_in_no_recent_transfer', false);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                          <RadioGroupItem value="nao" id="bonus-nao" />
                          <Label htmlFor="bonus-nao" className="flex-1 cursor-pointer">
                            ❌ NÃO - Sem bônus
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                          <RadioGroupItem value="sim" id="bonus-sim" />
                          <Label htmlFor="bonus-sim" className="flex-1 cursor-pointer">
                            ⚠️ SIM - Tem bônus
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-slate-500 mt-2">
                        Bônus = desconto ou valor extra dado pelo usado
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showValidation && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* ALERTA */}
                    <Alert className="border-4 border-red-500 bg-red-50">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                      <AlertDescription>
                        <h3 className="font-bold text-lg text-red-900 mb-3">
                          🚨 VALIDAÇÃO DE PARENTESCO OBRIGATÓRIA
                        </h3>
                        
                        {/* ACEITOS */}
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="font-semibold text-green-900 mb-2">✅ ACEITOS:</p>
                          <ul className="space-y-1 text-sm">
                            <li>💍 Cônjuge (escritura casamento)</li>
                            <li>💑 União Estável (escritura pública)</li>
                            <li>👨‍👩‍👧 Pai/Mãe do comprador</li>
                            <li>👶 Filho(a) do comprador</li>
                          </ul>
                        </div>
                        
                        {/* NÃO ACEITOS */}
                        <div className="bg-white rounded-lg p-4">
                          <p className="font-semibold text-red-900 mb-2">❌ NÃO ACEITOS:</p>
                          <p className="text-sm text-red-800">
                            Irmão, Tio, Sogro, Cunhado, Avô, Primo, Amigo, etc.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* TIPO DE PARENTESCO */}
                    <div>
                      <Label>Tipo de Parentesco *</Label>
                      <Select
                        value={formData.trade_in_parentesco_type || ''}
                        onValueChange={(value) => updateField('trade_in_parentesco_type', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione o parentesco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conjuge">💍 Cônjuge</SelectItem>
                          <SelectItem value="uniao_estavel">💑 União Estável</SelectItem>
                          <SelectItem value="pai_mae">👨‍👩‍👧 Pai/Mãe</SelectItem>
                          <SelectItem value="filho">👶 Filho(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CONFIRMAÇÃO: NÃO TRANSFERIDO */}
                    <div className="flex items-start gap-2 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                      <Checkbox
                        id="no-transfer"
                        checked={formData.trade_in_no_recent_transfer || false}
                        onCheckedChange={(checked) =>
                          updateField('trade_in_no_recent_transfer', checked)
                        }
                      />
                      <Label htmlFor="no-transfer" className="leading-tight cursor-pointer">
                        Confirmo que o veículo NÃO foi transferido nos últimos 3 meses
                        <span className="text-xs text-amber-700 block mt-1">
                          Verificar no Laudo de Pesquisa de Proprietário
                        </span>
                      </Label>
                    </div>

                    {/* INFO DICA */}
                    <Alert className="border-blue-200 bg-blue-50">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>💡 IMPORTANTE:</strong> Você precisará fazer upload dos seguintes documentos
                        na tela de Detalhes do Pedido:
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Laudo de Pesquisa de Proprietário</li>
                          <li>Documento de Parentesco (certidão ou escritura)</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* AVISO GERENTE */}
                    <Alert className="border-2 border-purple-500 bg-purple-50">
                      <AlertCircle className="w-5 h-5 text-purple-600" />
                      <AlertDescription className="text-purple-900">
                        <strong>⚠️ O gerente será notificado</strong> e precisará aprovar este pedido 
                        antes de prosseguir com o processo.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}