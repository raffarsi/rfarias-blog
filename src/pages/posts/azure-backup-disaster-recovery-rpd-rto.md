---
layout: ../../layouts/PostLayout.astro
title: "Backup e Disaster Recovery no Azure: RPO, RTO e como escolher a estratégia certa"
category: "Infra"
tag: "infra"
date: "22 Jan 2026"
readTime: "5 min"
description: "Backup e DR resolvem problemas diferentes, e o que decide a estratégia são dois números combinados com o negócio. Azure Backup, Site Recovery e replicação de dados, a proteção contra ransomware e o teste que quase ninguém faz."
---

O backup rodava todo dia, com relatório verde. Quando precisaram restaurar um servidor inteiro, descobriram que ninguém sabia quanto tempo aquilo levava. Levou a tarde toda, e o sistema que dependia dele ficou fora do ar enquanto isso.

Backup e disaster recovery costumam ser tratados como a mesma coisa, e não são. Backup protege contra perda de dados: alguém apagou, algo corrompeu, um ransomware criptografou. DR protege contra indisponibilidade: a região ficou fora, a zona caiu, o ambiente precisa subir em outro lugar. Os dois são necessários, e o que define cada um são dois números.

## RPO e RTO, combinados com o negócio

**RPO** é quanto dado se pode perder. Um RPO de 1 hora significa que, no pior caso, a última hora de dados some.

**RTO** é quanto tempo se pode ficar fora do ar. Um RTO de 4 horas significa que a recuperação completa precisa caber em 4 horas.

Quanto menores os dois números, mais cara a solução. Por isso eles não são decisão da equipe de TI sozinha: quem define é quem sente o impacto, e quem paga a conta precisa entender o que está comprando. O erro mais comum que eu vejo é o RPO e o RTO existirem só no contrato, sem nenhuma solução desenhada para cumpri-los.

## Azure Backup: proteção dos dados

O Azure Backup guarda cópias em cofres gerenciados. São dois tipos: o **Recovery Services vault**, para VMs, SQL Server e SAP HANA em VMs, Azure Files e servidores on-premises; e o **Backup vault**, para cargas mais novas, como Azure Disks, Blob, PostgreSQL e AKS. O Cosmos DB tem backup próprio, periódico ou contínuo, fora do Azure Backup.

Para VMs, há duas políticas. A **Standard** faz um backup por dia. A **Enhanced** permite várias por dia, a cada 4, 6, 8, 12 ou 24 horas, e é exigida por alguns tipos de disco, como Premium SSD v2 e Ultra Disk. Se o RPO do sistema é menor que um dia, a política Standard não cumpre.

```bash
az backup vault create \
  --name rsv-producao \
  --resource-group rg-backup \
  --location brazilsouth

az backup protection enable-for-vm \
  --vault-name rsv-producao \
  --resource-group rg-backup \
  --vm $(az vm show --name vm-erp01 --resource-group rg-erp --query id -o tsv) \
  --policy-name DefaultPolicy
```

A `DefaultPolicy` é a política Standard, com um backup por dia. Para RPO menor que isso, ou para VMs com Premium SSD v2 e Ultra Disk, crie e use uma política Enhanced.

Em escala, o caminho é Azure Policy: uma política que habilita o backup em toda VM com determinada tag evita a VM nova que ninguém lembrou de proteger.

## Backup que sobrevive a um ransomware

Um ataque de ransomware bem feito tenta apagar os backups antes de criptografar os dados. O Azure Backup tem três camadas para isso:

**Soft delete.** Backups apagados ficam recuperáveis por um período, de 14 dias em diante. É a rede de segurança contra exclusão, acidental ou não.

**Cofre imutável.** Impede que pontos de recuperação sejam apagados ou tenham a retenção reduzida antes do prazo. Na opção travada, nem o administrador consegue desfazer.

**Autorização multiusuário.** Operações destrutivas, como desligar o soft delete, exigem a aprovação de uma segunda pessoa, por meio de um Resource Guard em outra assinatura ou outro tenant. Uma credencial de administrador roubada, sozinha, não apaga os backups.

Para ambiente regulado, eu considero as três o mínimo.

## Site Recovery: a VM subindo em outra região

O Azure Site Recovery replica continuamente as VMs para outra região e permite o failover quando a região principal fica indisponível. Na replicação entre regiões do Azure, ele gera pontos de recuperação consistentes com falha (crash-consistent) a cada cinco minutos, o que coloca o RPO de VMs na casa dos minutos. Pontos consistentes com a aplicação têm frequência própria, configurada na política de replicação.

A configuração envolve várias peças (cofre na região de destino, política de replicação, mapeamento de rede), e a automação costuma ser feita por PowerShell, pela extensão `site-recovery` da CLI ou por template. O ponto que mais importa não é o comando: é o **plano de recuperação**, que define a ordem em que as VMs sobem, os scripts entre uma etapa e outra e o que muda de endereço na região de destino.

## Replicação dos dados

VM é só uma parte. Os dados têm os seus próprios mecanismos, e o RPO de cada um é diferente:

| Serviço | Mecanismo | O que esperar |
|---------|-----------|---------------|
| Azure SQL Database | Failover groups ou geo-replicação ativa | Replicação assíncrona; o RPO depende das alterações ainda não replicadas, e o atraso pode ser monitorado |
| Azure Storage | GRS ou GZRS | Replicação assíncrona; a propriedade Last Sync Time mostra até onde a cópia secundária está atualizada |
| Azure Cosmos DB | Múltiplas regiões | RPO abaixo de 15 minutos nos níveis de consistência mais usados |

A pergunta que a tabela responde: o dado mais crítico do sistema consegue cumprir o RPO combinado? Se a resposta depender de um mecanismo assíncrono, o RPO real é o atraso da replicação no pior momento, não no momento médio.

## Escolhendo por RPO e RTO

| RPO | RTO | Estratégia |
|-----|-----|------------|
| 24 horas | 1 dia | Azure Backup com política Standard e restauração manual |
| Algumas horas | Algumas horas | Backup com política Enhanced e Site Recovery para as VMs críticas |
| Minutos | Menos de 1 hora | Site Recovery com plano de recuperação testado e replicação dos dados |
| Próximo de zero | Minutos | Ativo-ativo em mais de uma região, com custo e complexidade à altura |

## O teste que quase ninguém faz

O RTO que vale é o medido, não o estimado. O Site Recovery permite um failover de teste numa rede isolada, sem afetar a produção. Fazer isso pelo menos uma vez por ano, com cronômetro, é o que transforma o número do contrato em um número verdadeiro. O mesmo vale para a restauração de backup: restaurar de verdade, não só conferir que o job terminou.

## O que fica

Backup e DR são decisões de negócio implementadas pela infraestrutura. Primeiro os números, combinados com quem sente o impacto; depois a solução que cumpre esses números; e, por fim, o teste que prova que ela cumpre.

Quando foi a última vez que alguém restaurou, de verdade, um sistema inteiro a partir do backup no seu ambiente?
