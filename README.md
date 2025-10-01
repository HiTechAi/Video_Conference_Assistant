# Video_Conference_Assistant - 화상 회의 도우미


>AI와 함께 더 스마트하고 생산적인 회의를 경험하세요.

![화상회의 이미지](https://github.com/user-attachments/assets/7fbb690b-b504-4515-a78c-000401547103)



## 프로젝트 소개

`화상 회의 도우미`는 단순한 영상 통화 서비스를 넘어, AI 기술을 접목하여 회의의 내용을 전사후 요약하여 보고서를 이용자에게 제공하는 회의 요약 솔루션입니다. 


<img width="1860" height="920" alt="project_meeting_helper2" src="https://github.com/user-attachments/assets/b4f859c7-4888-4294-9f4e-d35a9cd83734" />
<h2 align="center">팀원들과 화상회의를 하고</h2>




<br>


<img width="1280" height="698" alt="image (2)" src="https://github.com/user-attachments/assets/82748cf1-6623-4bbc-90c0-eba734f2936b" />
<img width="1278" height="546" alt="image (3)" src="https://github.com/user-attachments/assets/964031ed-dee7-4ec5-b191-bcf231e21863" />
<h2 align="center">보고서를 받아서 의사결정에 도움을 받으세요 </h2>

<br>

## 핵심 기능

- **실시간 화상 회의 및 텍스트 채팅**
    - WebRTC 기술을 통해 안정적인 다자간 영상 회의를 제공하며, 실시간 텍스트 채팅 기능으로 원활한 소통을 지원합니다.

- **AI 기반 회의록 자동 생성 (STT)**
    - OpenAI의 **Whisper** 모델이 회의 중 모든 발언을 높은 정확도로 텍스트로 변환하여, 수동 작업 없이 완벽한 회의록을 자동으로 생성합니다.

- **구조화된 회의 요약 (AI Summary)**
    - **Qwen3 LLM**이 회의록의 핵심 내용을 분석하여, 단순 요약을 넘어 **회의 주제, 핵심 이슈, 그리고 실행이 필요한 액션 아이템**으로 구조화하여 명확하게 정리합니다.

- **지능형 정보 제공 및 의사결정 지원 (RAG)**
    - LLM이 잘못된 정보를 생성하는 환각(Hallucination) 현상을 최소화하고, 회의 내용과 관련된 **최신 뉴스 기사 및 관련 논문**을 함께 제공합니다. 이를 통해 사용자는 회의 직후 더 넓은 관점에서 정확하고 신속한 의사결정을 내릴 수 있습니다.

## 어떻게 동작하나요?

이 서비스는 최신 웹 기술과 고성능 AI 모델들이 유기적으로 결합되어 작동합니다. 각 모듈은 명확히 분리된 역할을 수행하며, FastAPI와 소켓 통신을 통해 효율적으로 상호작용합니다.

1.  **데이터 수집 및 실시간 통신 (Node.js + Socket.IO)**
    - 사용자가 접속하는 웹 애플리케이션 서버입니다.
    - WebRTC를 통해 영상/음성 데이터를 P2P로 스트리밍하고, 채팅과 같은 실시간 이벤트는 **Socket.IO**를 이용해 서버와 클라이언트 간에 빠르고 안정적으로 전달합니다.

2.  **음성 처리 및 AI 분석 (Python )**
    - **STT (Speech-to-Text):** 녹음된 회의 음성 파일은 FastAPI 서버로 전송됩니다. 서버에서는 OpenAI의 **Whisper** 모델을 사용하여 음성을 매우 높은 정확도로 텍스트로 변환합니다.
    - **회의 내용 요약:** 텍스트로 변환된 회의록은 **Qwen3 LLM** 모델로 전달되어, 긴 내용을 **주제, 이슈, 액션 아이템**으로 구조화된 요약본으로 생성합니다.

3.  **외부 지식 처리 및 저장 (Airflow + Pinecone)**
    - 정기적으로 외부의 최신 뉴스나 내부 문서 같은 외부 지식을 수집하고 처리하기 위해 **Airflow**를 사용합니다.
    - Airflow는 데이터 수집, 가공, 임베딩, 저장의 과정을 **DAG(방향성 비순환 그래프)** 형태로 파이프라인화하여 자동적이고 안정적으로 관리합니다.
    - 처리된 데이터는 벡터 형태로 변환되어 **Pinecone** 벡터 데이터베이스에 저장되며, 이는 RAG 모델이 정보를 검색하는 데 사용됩니다.

4.  **모듈 간 통신 (FastAPI)**
    - 각 AI 기능(STT, 요약, RAG 등)은 독립적인 모듈로 구성되어 있으며, **FastAPI**를 통해 RESTful API 형태로 제공됩니다.
    - Node.js 서버는 필요할 때마다 이 API를 호출하여 AI 기능을 사용함으로써, 각 모듈이 독립적으로 확장되고 유지보수될 수 있는 유연한 아키텍처를 구현합니다.



## 화상회의 웹


## STT speech-to-text


## 회의내용 요약정리


## 백엔드 🛠️
[백엔드 보러가기](https://github.com/HiTechAi/Video_Conference_Assistant/blob/main/backends/README.md)
