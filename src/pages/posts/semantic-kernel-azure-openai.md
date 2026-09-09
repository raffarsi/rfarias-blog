---
layout: ../../layouts/PostLayout.astro
title: "Semantic Kernel com Azure OpenAI: construindo agentes de IA em .NET"
category: "IA"
tag: "azure"
date: "07 Out 2025"
readTime: "10 min"
description: "Como usar o Semantic Kernel da Microsoft para orquestrar chamadas ao Azure OpenAI e construir agentes com plugins e memória."
---

O Semantic Kernel é o framework de IA da Microsoft para .NET (com suporte também a Python e Java). Ele orquestra chamadas a LLMs, gerencia plugins (funções que o modelo pode chamar), memória e planejamento. Para equipes .NET que adotam Azure OpenAI, é a opção mais integrada ao ecossistema Microsoft.

## Setup básico

```csharp
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Azure.Identity;

// Criar o kernel com Azure OpenAI
var builder = Kernel.CreateBuilder();

// Com Managed Identity (recomendado para produção)
var credential = new DefaultAzureCredential();
builder.AddAzureOpenAIChatCompletion(
    deploymentName: "gpt4o-prod",
    endpoint: "https://oai-producao.openai.azure.com",
    credentials: credential
);

var kernel = builder.Build();
```

## Plugins: funções que o modelo pode chamar

```csharp
public class AzurePlugin
{
    [KernelFunction("get_resource_info")]
    [Description("Obtém informações sobre um recurso Azure pelo nome")]
    public async Task<string> GetResourceInfo(
        [Description("Nome do recurso Azure")] string resourceName,
        [Description("Resource Group")] string resourceGroup)
    {
        // Chamar Azure Resource Manager API
        var client = new ResourcesManagementClient(new DefaultAzureCredential());
        // ... implementação
        return $"Recurso {resourceName} no grupo {resourceGroup}: ativo, região Brazil South";
    }
}

// Registrar o plugin no kernel
kernel.Plugins.AddFromObject(new AzurePlugin(), "AzureTools");
```

## Invocação com auto-invocação de funções

```csharp
// O modelo decide quando chamar o plugin baseado na pergunta
var settings = new OpenAIPromptExecutionSettings
{
    ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
};

var response = await kernel.InvokePromptAsync(
    "Qual é o status da VM 'vm-producao' no Resource Group 'rg-app'?",
    new KernelArguments(settings)
);

Console.WriteLine(response.ToString());
// O modelo chamará automaticamente get_resource_info e incorporará o resultado
```

## Memória com Azure AI Search

```csharp
// Adicionar memória com Azure AI Search como backend
builder.AddAzureAISearchVectorStore(
    new Uri("https://search-ia-prod.search.windows.net"),
    new DefaultAzureCredential()
);

// Uso
var memory = kernel.GetRequiredService<IVectorStore>();
// Salvar memória
await memory.GetCollection<string, TextSnippet>("conversas")
    .UpsertAsync(new TextSnippet { Key = "conv-1", Text = "usuário preferiu respostas curtas" });
```

## Conclusão

O Semantic Kernel oferece uma abstração de alto nível para orquestração de IA em .NET, com integração nativa com Azure OpenAI, AI Search e outros serviços cognitivos. Para equipes que já trabalham com .NET e Azure, é a escolha natural.
