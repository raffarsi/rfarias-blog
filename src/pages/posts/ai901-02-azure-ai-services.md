---
layout: ../../layouts/PostLayout.astro
title: "AI-901 na prática [2] — Azure AI Services: visão e fala"
category: "IA"
tag: "ia"
serie: "AI-901 na prática"
serieNum: 2
date: "28 Mar 2026"
readTime: "9 min"
description: "Azure Computer Vision, Custom Vision, Face API e Azure Speech Services na prática."
prev:
  title: "AI-901 na prática [1] — Fundamentos de IA"
  slug: "ai901-01-fundamentos-ia"
next:
  title: "AI-901 na prática [3] — Linguagem natural e IA Generativa"
  slug: "ai901-03-linguagem-ia-generativa"
---

Os Azure AI Services (anteriormente Cognitive Services) são APIs pré-construídas que permitem adicionar capacidades de IA a aplicações sem treinar modelos do zero.

## Azure Computer Vision

Analisa imagens e vídeos para extrair informações:

```bash
# Criar recurso Computer Vision
az cognitiveservices account create \
  --name meu-vision \
  --resource-group meu-rg \
  --kind ComputerVision \
  --sku S1 \
  --location brazilsouth

# Obter endpoint e chave
az cognitiveservices account show \
  --name meu-vision \
  --resource-group meu-rg \
  --query "properties.endpoint"
```

**Capacidades:**
- Descrição automática de imagens em linguagem natural
- Detecção de objetos com bounding boxes
- OCR (leitura de texto em imagens e documentos)
- Reconhecimento de marcas e logotipos
- Detecção de conteúdo adulto ou perturbador
- Análise de imagens médicas (radiografias)

```python
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from msrest.authentication import CognitiveServicesCredentials

client = ComputerVisionClient(
    endpoint="https://meu-vision.cognitiveservices.azure.com/",
    credentials=CognitiveServicesCredentials("MINHA_CHAVE")
)

# Analisar imagem
result = client.analyze_image(
    url="https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg",
    visual_features=["Description", "Tags", "Objects"]
)
print(result.description.captions[0].text)
```

## Azure Custom Vision

Treine seu próprio classificador de imagens ou detector de objetos com suas próprias categorias:

1. Upload de imagens rotuladas
2. Treinamento com um clique
3. Avaliação do modelo (precisão, recall)
4. Publicação como API

**Diferença:** Computer Vision usa modelos pré-treinados pela Microsoft; Custom Vision você treina com seus próprios dados para categorias específicas do seu negócio.

## Azure Face API

Detecção e análise de rostos em imagens:

```python
from azure.cognitiveservices.vision.face import FaceClient
from msrest.authentication import CognitiveServicesCredentials

face_client = FaceClient(
    endpoint="https://meu-face.cognitiveservices.azure.com/",
    credentials=CognitiveServicesCredentials("MINHA_CHAVE")
)

# Detectar rostos
faces = face_client.face.detect_with_url(
    url="https://exemplo.com/foto.jpg",
    return_face_attributes=["Age", "Emotion", "Glasses"]
)

for face in faces:
    print(f"Idade estimada: {face.face_attributes.age}")
    print(f"Emoção dominante: {max(face.face_attributes.emotion.__dict__, key=lambda x: getattr(face.face_attributes.emotion, x))}")
```

<div class="callout">
<strong>IA Responsável:</strong> A Microsoft restringe o uso da Face API para reconhecimento facial de pessoas específicas apenas a clientes aprovados (lei enforcement, acessibilidade). Identificação de celebridades foi removida. O AI-901 pode testar essas limitações éticas.
</div>

## Azure Document Intelligence (Form Recognizer)

Extrai dados estruturados de documentos: formulários, recibos, notas fiscais, carteiras de identidade.

```python
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

client = DocumentAnalysisClient(
    endpoint="https://meu-form.cognitiveservices.azure.com/",
    credential=AzureKeyCredential("MINHA_CHAVE")
)

# Analisar nota fiscal
with open("nota-fiscal.pdf", "rb") as f:
    poller = client.begin_analyze_document("prebuilt-invoice", f)
    result = poller.result()

for invoice in result.documents:
    print(f"Fornecedor: {invoice.fields.get('VendorName').value}")
    print(f"Total: {invoice.fields.get('InvoiceTotal').value}")
```

## Azure Speech Services

**Speech-to-Text** — transcreve áudio para texto em tempo real ou batch.
**Text-to-Speech** — converte texto em voz natural (Neural TTS).
**Speaker Recognition** — identifica ou verifica quem está falando.
**Speech Translation** — traduz fala em tempo real.

```python
import azure.cognitiveservices.speech as speechsdk

speech_config = speechsdk.SpeechConfig(
    subscription="MINHA_CHAVE",
    region="brazilsouth"
)
speech_config.speech_recognition_language = "pt-BR"

recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config)
result = recognizer.recognize_once()
print(f"Texto reconhecido: {result.text}")
```

## O que cai no exame

- Computer Vision (imagens pré-treinadas) vs Custom Vision (suas categorias)
- Face API e suas restrições éticas
- Document Intelligence para formulários e documentos
- Speech Services: STT, TTS, tradução de fala
- Que AI Services são APIs pré-construídas — você não treina modelos do zero
