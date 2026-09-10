---
layout: ../../layouts/PostLayout.astro
title: "Tokens e fluxos de autenticação no Entra ID: OAuth 2.0 e OIDC na prática"
category: "IAM"
tag: "iam"
date: "05 Fev 2026"
readTime: "10 min"
description: "Auth code flow, client credentials, on-behalf-of — como escolher o fluxo correto para cada tipo de aplicação no ecossistema Azure."
---
OAuth 2.0 e OpenID Connect são padrões, mas o Microsoft Entra ID tem suas particularidades — endpoints específicos, tokens com formato próprio e fluxos adaptados para o ecossistema Azure. Entender qual fluxo usar para cada tipo de aplicação evita implementações incorretas que parecem funcionar mas têm falhas de segurança sutis.

## Os tokens do Entra ID

O Entra ID emite três tipos de token:

**Access Token:** comprova autorização para acessar um recurso. Contém scopes (permissões), expiração (geralmente 1h) e o `aud` (audience — para qual API é válido). É um JWT.

**Refresh Token:** de longa duração (24h a semanas), usado para obter novos access tokens sem nova autenticação do usuário. Não deve ser loggado nem armazenado em cliente.

**ID Token:** contém informações do usuário autenticado (nome, email, objeto ID). Usado pela aplicação — não enviado para APIs.

```python
import jwt  # PyJWT

# Decodificar access token para inspecionar (sem validar — apenas debug)
token = "eyJ0eXAiOiJKV1QiLCJhb..."
decoded = jwt.decode(token, options={"verify_signature": False})

print(f"Usuário: {decoded.get('upn') or decoded.get('preferred_username')}")
print(f"Audience: {decoded.get('aud')}")
print(f"Scopes: {decoded.get('scp')}")
print(f"Expira: {decoded.get('exp')}")
print(f"Roles: {decoded.get('roles', [])}")
```

## Fluxo 1: Authorization Code Flow (aplicações web com usuário)

Para aplicações web onde um usuário faz login interativo:

```python
from msal import ConfidentialClientApplication

app = ConfidentialClientApplication(
    client_id="app-client-id",
    client_credential="app-secret",
    authority="https://login.microsoftonline.com/seu-tenant-id"
)

# 1. Gerar URL de login
auth_url = app.get_authorization_request_url(
    scopes=["User.Read", "https://graph.microsoft.com/Mail.Read"],
    redirect_uri="https://meuapp.com/callback",
    state="valor-aleatorio-csrf"
)
# Redirecionar o usuário para auth_url

# 2. No callback, trocar o code por tokens
result = app.acquire_token_by_authorization_code(
    code=request.args.get("code"),
    scopes=["User.Read"],
    redirect_uri="https://meuapp.com/callback"
)

access_token = result.get("access_token")
```

## Fluxo 2: Client Credentials (serviços sem usuário)

Para comunicação entre serviços — um backend chamando uma API interna, um agente de IA chamando Azure OpenAI:

```python
from msal import ConfidentialClientApplication
from azure.identity import ClientSecretCredential, ManagedIdentityCredential

# Opção A: Service Principal com secret (evitar em produção)
credential = ClientSecretCredential(
    tenant_id="seu-tenant-id",
    client_id="sp-client-id",
    client_secret="sp-secret"  # prefira certificado
)

# Opção B: Managed Identity (recomendado em produção)
credential = ManagedIdentityCredential()

# Obter token para uma API específica
token = credential.get_token("https://cognitiveservices.azure.com/.default")
```

Com Managed Identity não há secret para gerenciar — o Azure injeta o token automaticamente.

## Fluxo 3: On-Behalf-Of (cadeia de serviços)

Quando um usuário chama API A, e API A precisa chamar API B em nome do usuário — preservando a identidade original:

```python
from msal import ConfidentialClientApplication

def chamar_api_downstream(user_access_token: str) -> str:
    app = ConfidentialClientApplication(
        client_id="api-a-client-id",
        client_credential="api-a-secret",
        authority="https://login.microsoftonline.com/tenant-id"
    )

    # Trocar o token do usuário por um token para a API downstream
    result = app.acquire_token_on_behalf_of(
        user_assertion=user_access_token,
        scopes=["api://api-b-client-id/Leitura"]
    )

    if "access_token" not in result:
        raise Exception(f"OBO failed: {result.get('error_description')}")

    # Chamar API B com o novo token (identidade do usuário original preservada)
    return result["access_token"]
```

## Validando tokens recebidos

Quando sua API recebe um token, valide antes de processar:

```python
import jwt
from jwt import PyJWKClient

def validar_token(token: str, expected_audience: str) -> dict:
    jwks_client = PyJWKClient(
        "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys"
    )
    signing_key = jwks_client.get_signing_key_from_jwt(token)

    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=expected_audience,
        issuer=f"https://login.microsoftonline.com/{tenant_id}/v2.0"
    )

    return payload  # raise jwt.InvalidTokenError se inválido
```

## Quando usar cada fluxo

| Cenário | Fluxo |
|---------|-------|
| Usuário faz login em app web | Authorization Code + PKCE |
| App mobile/SPA sem backend | Authorization Code + PKCE |
| Serviço → API sem usuário | Client Credentials / Managed Identity |
| API A chama API B em nome do usuário | On-Behalf-Of |
| CLI ou ferramenta de dev | Device Code Flow |

<div class="callout">
<strong>PKCE é obrigatório para SPAs e mobile.</strong> Aplicações públicas (sem secret) devem usar PKCE (Proof Key for Code Exchange) com o Authorization Code Flow — nunca o Implicit Flow (deprecated). O PKCE evita ataques de interceptação do authorization code.
</div>

## Conclusão

Escolher o fluxo OAuth errado não impede o sistema de funcionar — mas cria vulnerabilidades que só aparecem em incidentes. Client Credentials quando deveria ser OBO vaza o contexto de usuário. Implicit Flow quando deveria ser Auth Code + PKCE expõe tokens na URL. A escolha certa do fluxo é parte da segurança da aplicação, não apenas um detalhe de implementação.
