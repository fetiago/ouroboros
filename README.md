# Ouroboros 🐍💰

**Ouroboros** é um sistema de *Self-Banking* estático construído para capturar o *spread* bancário. 

Em vez de pagar taxas de juros abusivas (5% a 8% ao mês) em linhas de crédito de bancos ou carteiras digitais, você atua como seu próprio credor. Você financia suas compras à vista usando seu próprio capital (seu "pé de meia") e assume a dívida consigo mesmo, pagando as parcelas com os juros equivalentes aos do mercado. O lucro que iria para o banco volta para o seu próprio patrimônio, retroalimentando o seu ciclo de crédito.

## 🚀 Funcionalidades

- 📊 **Dashboard Financeiro:** Acompanhamento global do "capital na rua" e do lucro puro (juros) gerado para o seu fundo.
- 📈 **Juros Dinâmicos:** Simula o risco de crédito real. A taxa de juros aumenta progressivamente de acordo com o número de parcelas escolhidas.
- 📅 **Integração via `.ics`:** Gera um arquivo de calendário para exportar todas as parcelas futuras diretamente para o Google Calendar ou qualquer aplicativo de agenda.
- 📉 **Fluxo de Caixa Visual:** Gráfico dinâmico em CSS puro mostrando as projeções de quanto você deve repor no fundo nos próximos meses.
- 🔒 **Privacy First (Sem Banco de Dados):** O sistema não possui backend. Todo o estado é gerenciado no navegador e a persistência é feita manualmente via upload/download de um arquivo `.json`. Seus dados financeiros nunca saem da sua máquina.

## 🛠️ Tecnologias Utilizadas

Este projeto abraça a simplicidade e a portabilidade. Nenhuma etapa de *build* ou Node.js é necessária.

- **HTML5 & CSS3**
- **Vanilla JavaScript** (Toda a lógica e motor financeiro em um único arquivo `app.js`).
- **[Pico.css](https://picocss.com/)** (Framework CSS classless para um design moderno e responsivo com *dark mode* nativo, sem poluir o HTML).

## 🧮 A Matemática por Trás

### 1. Taxa de Juros Progressiva
Para simular o mercado real, o sistema aplica uma taxa base de **5% ao mês** ($i_0$) e adiciona uma penalidade de **0,5%** ($\alpha$) para cada parcela extra adicionada.

$$i(n) = i_0 + \alpha(n - 1)$$

*Exemplo: Em 1x a taxa é 5%. Em 12x, a taxa aplicada será de 10,5% ao mês.*

### 2. Tabela Price
O cálculo do valor fixo da parcela (PMT) utiliza a fórmula padrão de amortização francesa (Tabela Price), garantindo parcelas iguais do início ao fim:

$$PMT = P \times \frac{i(1+i)^n}{(1+i)^n - 1}$$

Onde $P$ é o valor à vista do produto, $i$ é a taxa calculada acima e $n$ é o número de parcelas.

## ⚙️ Como Usar

Como o projeto é totalmente estático, ele pode ser hospedado facilmente no **GitHub Pages**.

1. Acesse a página do projeto.
2. Na seção **Novo Financiamento**, insira o item, o valor à vista e teste a quantidade de parcelas no *preview* dinâmico.
3. Clique em **Confirmar Empréstimo**.
4. Use o botão **Exportar Lembretes** para baixar o arquivo `.ics` e popular sua agenda com as datas de pagamento.
5. Todo mês, ao repor o dinheiro no seu pé de meia, clique em **Pagar Parcela** para avançar o progresso.
6. **Importante:** Sempre clique em **Salvar & Baixar Dados** após fazer alterações para manter o seu backup atualizado. Na próxima vez que acessar, basta carregar o seu arquivo `.json`.

---
*O dinheiro sai, o dinheiro volta. Maior.*