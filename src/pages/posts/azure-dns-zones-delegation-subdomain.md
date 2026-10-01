---
layout: ../../layouts/PostLayout.astro
title: "Azure DNS: delegação de subdomínios para que cada time cuide da própria zona"
category: "Networking"
tag: "networking"
date: "22 Nov 2025"
readTime: "9 min"
description: "Quando todo registro DNS passa pelo time central, cada certificado novo vira chamado. Como funciona a delegação de zonas no Azure DNS público, como criar zonas filhas com Azure CLI e como proteger o registro NS que segura tudo de pé."
---

O time de dados precisa publicar um TXT para validar o certificado de `api.dados.empresa.com.br`. O registro leva um minuto, mas a zona `empresa.com.br` é do time de plataforma, então o pedido vira chamado e espera na fila. Na semana seguinte é um CNAME, depois um A. O time central opera registros que não são dele, e o time de dados espera.

A saída não é dar escrita na zona principal para todo mundo. É delegar `dados.empresa.com.br` para uma zona que o time de dados administra sozinho, enquanto a pai continua com quem cuida do domínio. O Azure DNS faz isso bem, mas a delegação depende de um único registro NS que quase ninguém protege.

## Como a delegação funciona

O Azure DNS é um serviço autoritativo: ele hospeda zonas e responde pelos registros delas. Ele não é registrador nem resolvedor recursivo público. Quem consulta um nome é um servidor recursivo, que parte da raiz, desce até os servidores de `empresa.com.br` e só então pergunta pelo registro.

O que liga cada nível ao seguinte é o registro NS. A zona pai guarda um conjunto NS com o nome da filha apontando para os servidores de nomes que hospedam essa filha. Configurar esse NS na pai é o que se chama delegar. A documentação lembra que toda delegação tem duas cópias: o NS na zona pai, apontando para a filha, e o NS autoritativo no apex da própria filha.

Ao criar uma zona, o Azure atribui quatro servidores de nomes de um pool (como `ns1-37.azure-dns.com` e `ns2-37.azure-dns.net`) e cria sozinho o NS do apex. Três detalhes importam:

**Use os quatro servidores.** A documentação pede a delegação para todos eles, por isolamento de falhas, e isso é condição para o SLA.

**Copie o ponto final.** Ele indica FQDN, e nem todo registrador o acrescenta.

**Nada de vanity name servers.** Delegar para servidores com nomes dentro do seu próprio domínio não é suportado no Azure DNS.

## Zona pai e zonas filhas

Para o domínio principal, o NS fica no registrador, que o publica na zona do TLD. Para os subdomínios, a zona pai já está no Azure, e a delegação vira um record set NS comum dentro dela. Esse é o modelo que eu uso:

| Zona | Dono | Onde está o NS que delega |
|------|------|---------------------------|
| `empresa.com.br` | Time de plataforma | No registrador |
| `dados.empresa.com.br` | Time de dados | Record set `dados` em `empresa.com.br` |
| `ia.empresa.com.br` | Time de IA | Record set `ia` em `empresa.com.br` |

Cada zona filha é um recurso separado, que pode ficar em outro resource group ou assinatura. A zona pai fica pequena: apex, `www`, e-mail e os NS das delegações.

No portal, o caminho mais curto é o botão **+ Child zone** na visão geral da zona pai, que cria a filha e o NS da delegação. A tela de criação de zona também tem a opção "This zone is a child of an existing zone already hosted in Azure DNS", que faz o mesmo.

## A delegação na prática

Na CLI, o `az network dns zone create` tem o parâmetro `--parent-name` (`-p`). Ele cria a zona e, em seguida, adiciona na pai um NS com os servidores da filha. Um detalhe do código-fonte que faz diferença: se você passar só o nome da pai, a CLI assume que ela está no mesmo resource group da filha, na assinatura atual. Com zonas em resource groups ou assinaturas diferentes, passe o ID completo do recurso, como no próprio exemplo de ajuda do comando.

```bash
# Zona pai, já delegada no registrador
az network dns zone create \
  --resource-group rg-dns-central \
  --name empresa.com.br

# Zona filha em outro resource group, com a delegação criada na pai
PARENT_ID=$(az network dns zone show \
  --resource-group rg-dns-central \
  --name empresa.com.br \
  --query id -o tsv)

az network dns zone create \
  --resource-group rg-dns-dados \
  --name dados.empresa.com.br \
  --parent-name "$PARENT_ID"
```

Esse comando escreve na zona pai, então quem o executa precisa de permissão nas duas. E se a escrita na pai falhar, a filha já foi criada: a CLI registra o erro, imprime "Could not add delegation in ..." e o comando termina devolvendo a zona nova, sem desfazer nada. Quem roda isso em pipeline pode não perceber que a delegação ficou faltando. Por isso eu prefiro deixar as duas etapas explícitas quando o time de dados cria a própria zona: ele cria a filha sem `-p`, e o time de plataforma adiciona o NS na pai.

```bash
for ns in $(az network dns zone show \
    --resource-group rg-dns-dados \
    --name dados.empresa.com.br \
    --query "nameServers" -o tsv); do
  az network dns record-set ns add-record \
    --resource-group rg-dns-central \
    --zone-name empresa.com.br \
    --record-set-name dados \
    --nsdname "$ns"
done
```

O resultado é o mesmo do **+ Child zone**: um NS `dados` com os quatro servidores da filha.

## O que muda dentro da zona filha

Com a delegação feita, dois recursos merecem atenção na zona filha.

**Registros alias.** Um record set A, AAAA ou CNAME pode apontar para um recurso do Azure em vez de um valor fixo: um IP público Standard, um endpoint do Front Door, um endpoint de CDN ou outro record set da mesma zona. Se o IP muda, o registro acompanha; se o recurso é apagado, o record set fica vazio em vez de apontar para um endereço que pode acabar com outra aplicação. O alias também resolve o apex, onde o padrão DNS não permite CNAME porque ali já existem NS e SOA. Na CLI, é o parâmetro `--target-resource` do `az network dns record-set a create`, com o ID do recurso. Há um limite de 50 alias por recurso.

**TTL e propagação.** No Azure DNS, o TTL é do record set, não de cada registro, e aceita valores de 1 a 2.147.483.647 segundos (o padrão da CLI é 3600). Registros novos ou alterados aparecem nos servidores do Azure em até 60 segundos. O que demora é o cache dos resolvedores recursivos, que respeita o TTL anterior. Antes de uma migração, eu costumo reduzir o TTL dos registros que vão mudar com antecedência; o guia de design de rede entre nuvens da Microsoft traz a mesma orientação no checklist de cutover de DNS, e a documentação de confiabilidade do Azure DNS resume o equilíbrio: TTL baixo faz a mudança chegar antes, ao custo de mais consultas.

## Governança: RBAC e lock

A delegação só traz autonomia com as permissões certas. O papel **DNS Zone Contributor** dá controle total sobre zonas DNS públicas e pode ser atribuído no escopo de uma zona específica, não só do resource group. Ele não vale para zonas privadas, que têm papel próprio.

```bash
ZONE_ID=$(az network dns zone show \
  --resource-group rg-dns-dados \
  --name dados.empresa.com.br \
  --query id -o tsv)

az role assignment create \
  --assignee <id-do-grupo-time-dados> \
  --role "DNS Zone Contributor" \
  --scope "$ZONE_ID"
```

O time de dados ganha a própria zona e nenhum acesso à pai. Papéis customizados permitem ir além, como gerenciar só CNAMEs sem poder apagar a zona.

Agora a peça que eu considero mais crítica: o NS `dados` dentro de `empresa.com.br`. Se alguém o apaga ou edita, o subdomínio inteiro some da internet, e o time de dados não tem permissão para consertar. Para record sets, o lock certo é **ReadOnly**. A documentação avisa que CanNotDelete num record set é ineficaz, porque ainda dá para remover todos os registros dele, o que tem o mesmo efeito de apagar. E, segundo a documentação, o lock em record set hoje só é configurado por Azure PowerShell; portal e CLI não suportam esse nível:

```powershell
New-AzResourceLock -LockLevel ReadOnly -LockName lock-ns-dados `
  -ResourceName "empresa.com.br/dados" `
  -ResourceType "Microsoft.Network/DNSZones/NS" `
  -ResourceGroupName rg-dns-central
```

Do lado da filha, o risco é a exclusão. Os servidores são atribuídos a cada criação, então uma zona recriada pode receber outros, e o NS da pai passa a apontar para o lugar errado. A recomendação da documentação é um lock CanNotDelete no record set SOA (`dados.empresa.com.br/@`, tipo `Microsoft.Network/DNSZones/SOA`): a zona não pode ser apagada sem apagar o SOA, e os demais registros continuam editáveis.

## DNSSEC na cadeia de delegação

O Azure DNS público suporta DNSSEC (`az network dns dnssec-config create` assina a zona), e a delegação ganha mais um registro: para a validação funcionar, a zona pai também precisa estar assinada e ter um registro DS da filha. O Azure só aceita criar DS numa zona já assinada, então a ordem é assinar a pai, assinar a filha, ler as informações de delegação da filha (o `az network dns zone show` traz em `signingKeys` o `delegationSignerInfo`) e só então o time de plataforma cria o DS na pai com `az network dns record-set ds add-record`. Até lá, o portal mostra a filha como "Signed but not delegated".

Sem DS, o resolvedor validador trata a filha como não assinada. Com um DS que não bate com a chave da filha, a cadeia de confiança quebra, a validação falha e quem valida recebe SERVFAIL. Isso volta a importar em três momentos: na troca da KSK (que a documentação diz ser feita via suporte e exige atualizar o DS), ao desligar o DNSSEC da filha (primeiro se remove o DS da pai e se espera o TTL dele expirar) e na zona filha recriada, que precisa ser assinada de novo e ter o DS refeito com os dados novos. Vale lembrar também que o resolvedor padrão fornecido pelo Azure não faz validação DNSSEC.

## Como verificar

Consulte o SOA sem indicar servidor: se vier o servidor primário do Azure, a cadeia funciona. A documentação sugere esperar ao menos dez minutos.

```bash
nslookup -type=SOA dados.empresa.com.br

# Mostra cada salto da raiz até a zona filha
dig +trace NS dados.empresa.com.br
```

No `dig +trace`, a resposta de `empresa.com.br` precisa listar os mesmos quatro servidores que aparecem em `az network dns zone show` da filha. Divergência ali é delegação desatualizada.

## A fronteira com o DNS privado

Tudo isso é DNS público. Se `dados.empresa.com.br` precisa responder IPs privados para quem está dentro das VNets, a resposta é split-horizon: uma zona privada com o mesmo nome, vinculada às VNets, que responde de dentro enquanto a pública responde da internet. Como isso se combina com o resolver no hub e com o on-premises está em [Azure Private DNS Resolver: resolução de nomes centralizada no hub](/posts/azure-private-dns-resolver-arquitetura/).

## O que fica

Delegar subdomínios tira o time central da fila de registros, mas concentra o risco num record set NS que ninguém olha até ele quebrar. Na minha revisão de qualquer ambiente com delegação, a primeira coisa que confiro é se esse NS tem lock ReadOnly e se bate com os servidores atuais da zona filha.

Quantas delegações no seu domínio hoje dependem de um registro NS que qualquer pessoa com acesso à zona pai pode apagar sem perceber?
