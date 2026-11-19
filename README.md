# 🎬 CineMatch — Sistema de Recomendação de Filmes

Aplicação Full Stack de recomendação inteligente de filmes baseada em processamento de linguagem natural simples (tokenização, remoção de stopwords, mapeamento semântico de gêneros e cálculo de relevância) integrada em tempo real à API do **TMDB**.

## 🚀 Tecnologias Utilizadas
* **Back-end:** Java 17+, Spring Boot, RestClient, POO, Estruturas de Dados (`Map`, `Set`, `Comparator`)
* **Front-end:** React, Vite, Tailwind CSS
* **API Externa:** The Movie Database (TMDB)

## ⚙️ Como Executar Localmente

### 1. Back-end (`cinematch-api`)
1. Renomeie `src/main/resources/application-example.properties` para `application.properties`.
2. Insira sua chave gratuita da API do TMDB em `tmdb.api.key`.
3. Execute `./mvnw spring-boot:run`.

### 2. Front-end (`cinematch-web`)
1. Instale as dependências com `npm install`.
2. Inicie o servidor com `npm run dev` e acesse `http://localhost:5173`.