---
layout: ../../layouts/PostLayout.astro
title: "Azure Key Vault: boas práticas de gestão de secrets e certificados"
category: "Segurança"
tag: "seguranca"
date: "02 Out 2025"
readTime: "8 min"
description: "Rotação automática, acesso via Managed Identity, soft-delete e purge protection — o que configurar antes de guardar o primeiro secret."
---

O Azure Key Vault é o serviço de gestão de secrets, chaves criptográficas e certificados do Azure. Antes de guardar qualquer secret de produção, há configurações críticas que devem ser feitas, ignorá-las pode resultar em exclusões acidentais irreversíveis.

## Configurações que você deve habilitar antes de tudo

```bicep
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-producao'
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    
    // CRÍTICO: protege contra exclusão acidental
    softDeleteRetentionInDays: 90  // mínimo 7, máximo 90
    enableSoftDelete: true          // não pode ser desabilitado após habilitar
    enablePurgeProtection: true     // purge só após período de retenção
    
    // Acesso por RBAC (mais moderno que access policies)
    enableRbacAuthorization: true
    
    // Rede
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}
```

**Por que Purge Protection importa:** Com soft-delete sem purge protection, um admin pode excluir um secret, e 7 dias depois excluir permanentemente. Com purge protection habilitado, nem o admin pode fazer purge antes do período de retenção. Proteção contra insider threats e erros.

## Acesso via Managed Identity

```bash
# Dar acesso de leitura de secrets a uma App Service
APP_IDENTITY=$(az webapp show -n meu-app -g rg-app \
  --query identity.principalId -o tsv)

az role assignment create \
  --assignee $APP_IDENTITY \
  --role "Key Vault Secrets User" \
  --scope $(az keyvault show -n kv-producao -g rg-infra --query id -o tsv)
```

```python
# No código da aplicação, sem nenhuma API key
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

client = SecretClient(
    vault_url="https://kv-producao.vault.azure.net",
    credential=DefaultAzureCredential()
)

db_password = client.get_secret("db-password").value
```

## Rotação automática de secrets

O Key Vault suporta rotação automática de secrets via Event Grid e Azure Functions:

```bash
# Habilitar notificações de expiração
az keyvault secret set-attributes \
  --vault-name kv-producao \
  --name db-password \
  --expires "2025-12-31T00:00:00Z"  # data de expiração

# Configurar Event Grid para disparar quando secret está prestes a expirar
az eventgrid event-subscription create \
  --name rotacao-secrets \
  --source-resource-id $(az keyvault show -n kv-producao -g rg-infra --query id -o tsv) \
  --endpoint https://minha-func.azurewebsites.net/api/RotacaoSecret \
  --included-event-types Microsoft.KeyVault.SecretNearExpiry
```

## Conclusão

Key Vault bem configurado, com soft-delete, purge protection, RBAC e Private Endpoint, é o fundamento da gestão segura de credenciais no Azure. Configure tudo antes de criar o primeiro secret de produção.
