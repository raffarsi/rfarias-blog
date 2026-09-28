---
layout: ../../layouts/PostLayout.astro
title: "Golden image no Azure: a esteira que faz duas VMs serem iguais de verdade"
category: "Infra"
tag: "infra"
date: "22 Out 2026"
readTime: "8 min"
description: "Quando cada VM recebe patches e agentes depois de criada, nenhuma fica igual à outra. Como montar uma esteira com Azure VM Image Builder e Azure Compute Gallery, da imagem de origem à aposentadoria da versão, com cadência mensal e versionamento que o scale set entende."
---

Cada VM nova levava a tarde toda para ficar pronta. A máquina subia com a imagem do Marketplace, e aí começava a lista: patches do mês, agente de monitoramento, agente de segurança, configuração, reinício. Quem fazia seguia um documento, e o documento nunca estava completo. Duas VMs criadas na mesma semana, para a mesma aplicação, tinham versões diferentes de pacote e às vezes um agente a menos. No papel eram iguais. Na prática, ninguém sabia dizer em que eram diferentes.

A saída é inverter a ordem: o que acontece depois de criar a VM passa a acontecer antes, uma vez, numa imagem padronizada, a golden image. Ela só funciona como produto de uma esteira, com versão, teste e data para sair de cena, e não como um snapshot tirado num dia bom.

No Azure, a esteira tem duas peças: o Azure VM Image Builder constrói a imagem, e a Azure Compute Gallery guarda, versiona e replica.

## Antes da esteira: a gallery e a definição

A **gallery** é o contêiner. A **image definition** agrupa os metadados que valem para todas as versões: sistema operacional, estado, geração de Hyper-V, recursos de segurança. A **image version** é o que de fato cria VMs.

Cada definição é identificada por publisher, offer e SKU, combinação única na gallery. A documentação recomenda manter esses valores coerentes com a imagem de origem do Marketplace. Eu sigo isso no offer e no SKU, e uso o publisher para dizer qual time é dono da imagem.

```bash
az sig create \
  --resource-group rg-imagens \
  --gallery-name galplataforma \
  --location brazilsouth

az sig image-definition create \
  --resource-group rg-imagens \
  --gallery-name galplataforma \
  --gallery-image-definition ubuntu-2204-base \
  --publisher plataforma \
  --offer 0001-com-ubuntu-server-jammy \
  --sku 22_04-lts-gen2 \
  --os-type Linux \
  --os-state Generalized \
  --hyper-v-generation V2 \
  --features SecurityType=TrustedLaunchSupported \
  --end-of-life-date 2027-12-31
```

Três escolhas nesse comando importam.

**Generalized, não specialized.** A imagem generalizada passa pelo Sysprep no Windows ou pelo deprovision do agente no Linux, que removem informações específicas da máquina. A especializada sobe mais rápido, mas carrega as contas da VM de origem para todas as cópias. Golden image é sempre generalizada, até porque o Image Builder só aceita imagens generalizadas como origem.

**TrustedLaunchSupported, não TrustedLaunch.** `TrustedLaunch` só permite criar VMs com Trusted Launch. `TrustedLaunchSupported` é uma imagem Gen2 genérica que aceita VMs Gen2 comuns ou com Trusted Launch. O motivo da escolha está na documentação do Image Builder: ele aceita `TrustedLaunchSupported` como origem e exige que origem e destino sejam ambos desse tipo; `TrustedLaunch` não é aceito como origem. Como eu quero construir imagens de aplicação em cima desta base, a definição precisa servir de origem. Na camada base, que parte do Marketplace, vale conferir nos features da imagem de origem (`az vm image show`) se ela se declara `TrustedLaunchSupported`, porque a regra de origem e destino do mesmo tipo vale também ali. O Trusted Launch vira exigência no momento de criar a VM, com `--security-type TrustedLaunch`.

**End of life date na definição.** É informativa: a plataforma não impede a criação de VMs depois dela. Mesmo assim eu preencho, porque deixa registrado no próprio recurso até quando aquela linha de imagem deveria existir.

## Etapa 1: a fonte

O template do Image Builder começa pela origem. Há três tipos: `PlatformImage` (Marketplace), `ManagedImage` e `SharedImageVersion` (uma versão da gallery). Com Marketplace e `"version": "latest"`, a versão é resolvida na hora do build, não na criação do template: o mesmo template roda todo mês e parte sempre da imagem mais recente do fornecedor.

Com `SharedImageVersion`, a origem é uma versão da própria gallery, inclusive `latest`. É assim que se monta a segunda camada: a base corporativa sai do Marketplace, e as imagens de aplicação saem da base. Uma restrição: a versão de origem precisa estar replicada na região do template.

## Etapa 2: a customização

Os customizers rodam na ordem em que aparecem, e se um falha, o build inteiro falha. Os tipos são `Shell` para Linux, `PowerShell`, `WindowsRestart` e `WindowsUpdate` para Windows, e `File`, que baixa um único arquivo pequeno, abaixo de 20 MB segundo a documentação (no Linux, só para `/tmp`).

A identidade é onde a maioria trava na primeira vez. O template precisa de uma identidade gerenciada user-assigned, e ela precisa, no resource group da gallery, das ações de leitura da gallery e da definição e de leitura e escrita de versões (`Microsoft.Compute/galleries/images/versions/write`). Se a origem for uma versão da gallery, precisa de leitura nela também. Se os scripts estiverem num storage account privado, precisa de leitura no blob. A documentação mostra como criar um papel customizado com essas ações, e eu prefiro isso a dar Contributor no resource group. Uma segunda identidade, opcional, vai na VM de build para buscar segredos no Key Vault; credencial nunca vai no template.

```json
{
  "type": "Microsoft.VirtualMachineImages/imageTemplates",
  "location": "brazilsouth",
  "identity": {
    "type": "UserAssigned",
    "userAssignedIdentities": {
      "/subscriptions/<sub>/resourceGroups/rg-imagens/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-image-builder": {}
    }
  },
  "properties": {
    "buildTimeoutInMinutes": 120,
    "source": {
      "type": "PlatformImage",
      "publisher": "Canonical",
      "offer": "0001-com-ubuntu-server-jammy",
      "sku": "22_04-lts-gen2",
      "version": "latest"
    },
    "customize": [
      {
        "type": "Shell",
        "name": "patches",
        "inline": [
          "sudo apt-get update",
          "sudo DEBIAN_FRONTEND=noninteractive apt-get -y upgrade"
        ]
      },
      {
        "type": "Shell",
        "name": "agentes",
        "scriptUri": "https://stimagensplataforma.blob.core.windows.net/artefatos/instalar-agentes.sh",
        "sha256Checksum": "<sha256 do script>"
      }
    ],
    "validate": {
      "continueDistributeOnFailure": false,
      "inVMValidations": [
        {
          "type": "Shell",
          "name": "checar-agentes",
          "scriptUri": "https://stimagensplataforma.blob.core.windows.net/artefatos/validar-imagem.sh"
        }
      ]
    },
    "distribute": [
      {
        "type": "SharedImage",
        "galleryImageId": "/subscriptions/<sub>/resourceGroups/rg-imagens/providers/Microsoft.Compute/galleries/galplataforma/images/ubuntu-2204-base",
        "runOutputName": "ubuntu-2204-base",
        "versioning": { "scheme": "Latest", "major": 1 },
        "excludeFromLatest": true,
        "targetRegions": [
          { "name": "brazilsouth", "replicaCount": 3, "storageAccountType": "Standard_ZRS" },
          { "name": "eastus2", "replicaCount": 1, "storageAccountType": "Standard_LRS" }
        ]
      }
    ]
  }
}
```

Um detalhe que muda o jeito de operar: quando o template é criado, os scripts referenciados são copiados para o resource group de staging que o serviço cria na sua assinatura. Por isso eu trato qualquer mudança de conteúdo como template novo, versionado no Git, e não como edição do script no storage. E esse resource group de staging é sensível: quem tem acesso a ele consegue interferir no build e nas identidades.

## Etapa 3: a validação

A seção `validate` roda scripts dentro da VM de build depois da customização. Com `continueDistributeOnFailure` em `false`, que é o padrão, uma validação que falha impede a distribuição. É o lugar para checar o que não pode faltar: agentes instalados e habilitados, kernel esperado, nenhum pacote pendente.

Só que validar dentro da VM de build não é testar a imagem: ela não roda com a rede, as extensões e o tamanho de produção. Por isso a distribuição sai com `excludeFromLatest: true`, e o teste de verdade acontece na etapa seguinte.

## Etapa 4: a distribuição

O destino `SharedImage` publica a versão na gallery e replica para as regiões de `targetRegions`, cada uma com seu número de réplicas e tipo de armazenamento. O padrão é Standard LRS. Em região com zonas de disponibilidade, eu uso ZRS, como a própria documentação recomenda. Para imagens de produção, a recomendação é manter no mínimo três réplicas, e uma réplica para cada 20 VMs criadas ao mesmo tempo. Cada região a mais aumenta o tempo do build, e a replicação pode levar horas.

O build é disparado com a CLI:

```bash
az image builder create \
  --resource-group rg-imagens \
  --name it-ubuntu-2204-base \
  --image-template ./ubuntu-2204-base.json

az image builder run \
  --resource-group rg-imagens \
  --name it-ubuntu-2204-base

az image builder show-runs \
  --resource-group rg-imagens \
  --name it-ubuntu-2204-base
```

A versão nasce fora do `latest`. Um scale set de teste aponta para o ID da versão específica, a aplicação sobe, os testes rodam. Passou, a versão é promovida:

```bash
az sig image-version update \
  --resource-group rg-imagens \
  --gallery-name galplataforma \
  --gallery-image-definition ubuntu-2204-base \
  --gallery-image-version 1.3.4 \
  --set publishingProfile.excludeFromLatest=false
```

## Etapa 5: o consumo

Há duas formas de apontar a imagem. Com o ID da definição, sem versão, a plataforma usa a mais recente; a documentação recomenda essa forma, porque uma versão fixa removida da região quebra a automação. Com o ID da versão, você sabe exatamente o que sobe.

Eu uso as duas, em lugares diferentes. O scale set de produção aponta para a definição, com upgrade automático de imagem do SO, que funciona com imagens da Compute Gallery: quando uma versão nova é publicada e replicada na região do scale set, as instâncias são atualizadas em lotes de até 20%, e, por padrão, o disco de SO anterior é restaurado se a instância não recuperar a saúde. O scale set precisa de health probe do Load Balancer ou da extensão Application Health. No modo de orquestração Flexible, o recurso ainda está em preview, o monitoramento de saúde é pela extensão Application Health e a versão da imagem configurada nas VMs precisa ser `latest`. Versões marcadas com exclude from latest não são distribuídas pelo upgrade automático. É essa trava que deixa o teste acontecer sem a produção receber a versão antes da hora.

## Etapa 6: a aposentadoria

Versão velha que ninguém aposenta vira VM nova com imagem antiga. Eu fecho o ciclo com três passos: marcar o end of life date na versão substituída, reduzir as regiões dela (a documentação sugere replicar a versão mais recente em várias regiões e manter as antigas em uma só, para economizar armazenamento) e excluir quando nenhum recurso depender dela. Para as versões que precisam ficar por um tempo, o `--block-deletion-before-end-of-life` impede exclusão acidental antes da data.

## Cadência e versionamento: o que eu adoto

**Rebuild mensal, sempre.** Mesmo sem mudança de conteúdo, a origem mudou: saíram patches. Fora do calendário, só vulnerabilidade crítica. Para as imagens de aplicação, o Image Builder tem triggers do tipo `SourceImage`, que disparam o build quando a imagem de origem na gallery ganha versão nova (a origem precisa apontar para `latest`).

**Versão semântica com significado.** O formato é sempre `Major.Minor.Patch`, e o `latest` é o maior número. Com `"scheme": "Latest"` e `major` fixo, o Image Builder gera sozinho o próximo número dentro daquele major. Então eu combino assim: o major muda quando muda o sistema base; o minor muda quando muda o conteúdo do template, e essa primeira versão eu publico com número explícito no `galleryImageId`; o patch é o rebuild mensal, que a esteira incrementa sem ninguém escolher número.

## O que fica

Golden image não é um projeto de imagem, é um processo de publicação. O valor está em saber, para qualquer VM rodando, de qual versão ela veio, quando essa versão foi construída, o que tinha dentro e se passou no teste antes de virar `latest`. Com essa rastreabilidade, ninguém discute se duas VMs são iguais: compara o número.

Se você precisasse recriar hoje uma VM de produção exatamente igual à que está rodando, de onde viria a imagem?
