import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, DollarSign, Calendar, Info, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IPVACalculator() {
  const [valorNota, setValorNota] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [resultado, setResultado] = useState(null);

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleValorChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    setValorNota(formatted);
  };

  const calcularIPVA = () => {
    if (!valorNota || !dataEmissao) {
      return;
    }

    const valorNumerico = parseFloat(valorNota.replace(/\./g, '').replace(',', '.'));
    const data = new Date(dataEmissao);
    const mesEmissao = data.getMonth() + 1; // 1-12

    // IPVA anual = 4% do valor da nota
    const ipvaAnual = valorNumerico * 0.04;

    // Meses devidos = 12 - (mês - 1)
    const mesesDevidos = 12 - (mesEmissao - 1);

    // IPVA proporcional
    const ipvaProporcional = (ipvaAnual / 12) * mesesDevidos;

    // Parcelamentos
    const parcelamentos = [1, 2, 3, 4, 5].map(parcelas => ({
      parcelas,
      valorParcela: ipvaProporcional / parcelas,
      valorTotal: ipvaProporcional
    }));

    setResultado({
      valorNota: valorNumerico,
      dataEmissao,
      mesEmissao,
      mesesDevidos,
      ipvaAnual,
      ipvaProporcional,
      parcelamentos
    });
  };

  useEffect(() => {
    if (valorNota && dataEmissao) {
      calcularIPVA();
    }
  }, [valorNota, dataEmissao]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-emerald-600" />
          Calculadora de IPVA
        </h1>
        <p className="text-slate-500 mt-1">
          Calcule o IPVA proporcional para veículos zero quilômetro em São Paulo
        </p>
      </div>

      {/* Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="w-5 h-5 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Alíquota SP:</strong> 4% para veículos zero quilômetro • 
          <strong className="ml-2">Pagamento proporcional:</strong> De acordo com o mês de emissão da nota fiscal
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dados do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-slate-500" />
                Valor da Nota Fiscal *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  R$
                </span>
                <Input
                  value={valorNota}
                  onChange={handleValorChange}
                  placeholder="0,00"
                  className="pl-10 text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Valor total da nota fiscal do veículo
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Data de Emissão da NF *
              </Label>
              <Input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="text-lg"
              />
              <p className="text-xs text-slate-500 mt-1">
                Data de emissão da nota fiscal
              </p>
            </div>

            {!resultado && (
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  Preencha os campos acima para calcular o IPVA
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        <AnimatePresence>
          {resultado && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg">Resumo do Cálculo</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Valor da Nota:</span>
                    <span className="font-semibold text-lg">
                      R$ {resultado.valorNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Mês de Emissão:</span>
                    <Badge variant="secondary">{resultado.mesEmissao}° mês</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Meses a Pagar:</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {resultado.mesesDevidos} meses
                    </Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">IPVA Anual (4%):</span>
                      <span className="text-slate-700">
                        R$ {resultado.ipvaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-900 font-semibold">IPVA Proporcional:</span>
                      <span className="text-2xl font-bold text-emerald-700">
                        R$ {resultado.ipvaProporcional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg">Opções de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {resultado.parcelamentos.map((opcao) => (
                      <div
                        key={opcao.parcelas}
                        className="flex justify-between items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {opcao.parcelas === 1 ? 'À Vista' : `${opcao.parcelas}x sem juros`}
                          </p>
                          {opcao.parcelas === 1 && (
                            <Badge className="bg-green-100 text-green-700 mt-1">
                              Desconto de 3%
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-800">
                            R$ {opcao.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {opcao.parcelas > 1 && (
                            <p className="text-xs text-slate-500">
                              Total: R$ {opcao.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avisos */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-500" />
            Informações Importantes
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>O IPVA é proporcional ao número de meses restantes do ano</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>Alíquota de 4% válida para veículos novos em São Paulo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>Pagamento à vista tem desconto de 3% sobre o valor total</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>Parcelamento disponível em até 5x sem juros</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-0.5">•</span>
              <span>Este cálculo é uma estimativa. Consulte a Secretaria da Fazenda para valores oficiais</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}