---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall IDPS e Threat Intelligence: configuração prática e análise de alertas"
category: "Networking"
tag: "networking"
date: "29 Nov 2025"
readTime: "5 min"
description: "Ligar o IDPS em modo de bloqueio no primeiro dia é o jeito mais rápido de derrubar tráfego legítimo. A sequência que funciona: o que cada recurso faz, duas semanas lendo alertas, exceções com critério e só então o bloqueio."
---

"É para isso que pagamos o Premium." Com esse argumento, o IDPS do Azure Firewall vai direto para o modo de bloqueio no primeiro dia, e na manhã seguinte as VMs param de receber atualização, um agente de monitoramento para de reportar e ninguém entende por quê. O firewall estava fazendo exatamente o que foi mandado.

O cenário oposto também é comum: IDPS ligado só em alerta, centenas de alertas por dia, e ninguém olhando. Seis meses depois, alguém pergunta se o recurso está servindo para alguma coisa.

Os dois erros têm a mesma causa: tratar IDPS como uma chave de liga e desliga. Ele é um processo, e o processo tem uma ordem.

## Threat Intelligence e IDPS não são a mesma coisa

Os dois aparecem juntos na política do firewall e costumam ser configurados juntos, mas trabalham de jeitos diferentes.

**Threat Intelligence** compara origem e destino com uma lista da Microsoft de IPs, FQDNs e URLs conhecidos por atividade maliciosa. Existe também no Standard. Como a decisão é por reputação, falso positivo é raro, e na maioria dos ambientes dá para começar bloqueando.

**IDPS** existe só no Premium. Ele olha o conteúdo dos pacotes e compara com mais de 67.000 assinaturas em mais de 50 categorias. É muito mais granular, e por isso mesmo erra mais: uma assinatura genérica pode confundir tráfego legítimo com ataque.

Por isso cada um começa num modo diferente:

```bicep
resource politica 'Microsoft.Network/firewallPolicies@2025-09-01' = {
  name: 'afwp-hub'
  location: location
  properties: {
    sku: { tier: 'Premium' }
    threatIntelMode: 'Deny'      // reputação: pode bloquear desde o início
    intrusionDetection: {
      mode: 'Alert'              // conteúdo: começa só alertando
      configuration: {
        signatureOverrides: []
        bypassTrafficSettings: []
        privateRanges: [ '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16' ]
      }
    }
  }
}
```

No portal, o `Deny` aparece como "Alert and deny". Versões recentes da política também têm a propriedade `profile` do IDPS, que escolhe o conjunto de assinaturas (Core, Emerging ou Extended); vale conhecer antes de customizar assinatura por assinatura.

## O detalhe que muda tudo: os intervalos privados

O IDPS decide se um tráfego é de entrada, de saída ou interno olhando os intervalos de IP privados configurados. E cada assinatura vale para direções específicas: algumas só para entrada, outras só para tráfego interno, outras para qualquer uma.

O padrão são os intervalos da RFC 1918. Se a sua empresa usa outros endereços internos, como faixas públicas próprias no on-premises ou 100.64.0.0/10, o IDPS vai tratar esse tráfego como vindo da internet e aplicar as assinaturas erradas. Ajustar os intervalos privados é o primeiro passo, antes de ler qualquer alerta.

## O que o IDPS não enxerga

Sem TLS inspection, o IDPS vê só o que não está criptografado. Detecta em todas as portas e protocolos sem criptografia, mas num tráfego HTTPS ele enxerga pouco mais que endereços e o handshake.

Hoje, quase tudo que importa é HTTPS. Então vale ser honesto na hora de apresentar o IDPS para a gestão: sem TLS inspection, que exige certificado de autoridade intermediária e decisão sobre o que pode ser descriptografado, a cobertura é bem menor do que o nome sugere.

## Duas semanas lendo alertas

Com o IDPS em alerta, a tarefa é ler o que ele reporta. Eu uso as tabelas específicas do firewall no Log Analytics, que são as recomendadas hoje, em vez da `AzureDiagnostics` antiga:

```kql
AZFWIdpsSignature
| where TimeGenerated > ago(14d)
| summarize ocorrencias = count(),
            origens = dcount(SourceIp),
            destinos = dcount(DestinationIp)
    by SignatureId, Description, Severity, Action
| order by ocorrencias desc
| take 20
```

Para cada assinatura do topo, a pergunta é uma só: esse tráfego é legítimo? Ajuda muito olhar quem está na origem e no destino:

```kql
AZFWIdpsSignature
| where TimeGenerated > ago(14d) and SignatureId == "2008983"
| summarize ocorrencias = count() by SourceIp, DestinationIp, DestinationPort
| order by ocorrencias desc
```

Se todas as ocorrências vêm do servidor de atualização interno falando com um repositório conhecido, é falso positivo. Se vêm de uma VM que não deveria falar com aquele destino, é exatamente o que você queria encontrar.

## Exceções com critério

Para os falsos positivos confirmados, há dois caminhos, e escolher errado abre um buraco.

**Override de assinatura.** Muda o comportamento daquela assinatura específica, para qualquer tráfego. Serve quando a assinatura em si não faz sentido no seu ambiente. É possível personalizar até 10.000 assinaturas.

**Bypass list.** Exclui do IDPS um tráfego específico, por origem, destino e porta, para todas as assinaturas. Serve quando um fluxo conhecido e confiável dispara vários alertas.

A regra que eu sigo: prefira o override da assinatura a uma bypass list ampla. Bypass de uma sub-rede inteira tira toda a inspeção daquele tráfego, inclusive das assinaturas que estavam funcionando bem.

```bicep
intrusionDetection: {
  mode: 'Alert'
  configuration: {
    signatureOverrides: [
      { id: '2008983', mode: 'Off' }   // falso positivo confirmado nas duas semanas
    ]
  }
}
```

Uma limitação que a documentação deixa clara: algumas assinaturas existem para preparar o contexto das seguintes, e forçar essas assinaturas para bloqueio pode derrubar pacotes sem gerar alerta. Por isso o Azure impede o override de um pequeno conjunto delas. Se um override não aceita a mudança, é esse o motivo.

## A primeira semana em bloqueio

Depois das duas semanas e das exceções, mude o modo para bloqueio. Na primeira semana, a consulta muda de foco: o que importa agora é o que foi bloqueado.

```kql
// Confira antes quais valores de Action aparecem no seu ambiente:
// AZFWIdpsSignature | distinct Action
AZFWIdpsSignature
| where TimeGenerated > ago(1d) and Action has "Deny"
| summarize bloqueios = count() by SignatureId, Description, SourceIp, DestinationIp
| order by bloqueios desc
```

Combine com o time de operação um canal para "parou de funcionar depois da mudança do firewall". O primeiro chamado costuma chegar em horas, não em dias. Com a consulta pronta, a resposta sai em minutos.

## O que fica

O IDPS não é um recurso que se configura e esquece. Ele exige alguém lendo alertas, decidindo exceções e revisando essas decisões de tempos em tempos, porque as assinaturas mudam e o seu tráfego também.

No seu ambiente, quem é a pessoa que olha os alertas do IDPS, e quando foi a última vez que ela olhou?
