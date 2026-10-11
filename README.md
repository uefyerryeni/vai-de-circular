# Vai de Circular — UEFY
Ferramenta independente de consulta de horários e trajetos do Circular da UFRN. Sem instalação e sem localização de veículos em tempo real.

**Site:** https://uefyerryeni.github.io/vai-de-circular/

## Navegação
- **Consultar:** origem e destino, melhor opção estimada, percurso e próximos horários na parada de origem
- **Tabela:** horários de referência por linha e terminal, incluindo informação histórica de sábado
- **Mais ferramentas:** uma página separada (`extras.html`) para consulta de horários em outro dia, favoritos de paradas, consulta por parada e compartilhamento de trajetos

O conteúdo principal está em `index.html`. Os módulos complementares não são carregados ali.

## Identidade visual
A versão 1.3 usa **Swiss Transit Design**: sistema tipográfico e sinalização de transporte, com cor UEFY `#f4dd19`, superfícies sólidas, cabeçalho levemente translúcido e contraste reforçado. O arquivo **`swiss.css`** é a única folha de estilos carregada nas duas páginas. Os CSS antigos estão mantidos no repositório somente para eventual recuperação, sem uso nas páginas atuais.

Modo claro e escuro usam a mesma identidade: controles amarelos sempre com texto escuro. As cores das linhas foram mantidas.

## Dados, cálculo e confiabilidade
- `app-data.js`: tabelas, linhas e paradas. Direto e Inverso conferidos em tabelas do Terminal RU em outubro de 2026. Expressos têm estimativas.
- `vdc-core.js`: núcleo compartilhado de cálculos de horário por origem/destino, passagens por parada e identificação de feriados.
- `app.js`: interação da consulta principal.
- `vdc-modules.js`, `vdc-future.js`: ferramentas da segunda página.
- **Feriados nacionais e datas especiais de Natal/RN**, sábados e domingos: não há recomendação automática de ônibus sem operação confirmada. O calendário não acompanha automaticamente suspensões, recessos da UFRN ou mudanças publicadas pela STTU.
- **Horários de sábado são históricos**, sem confirmação de operação.
- Não há GPS de veículos. As passagens intermediárias, durações, chegadas e retornos dos Expressos são aproximações. A confirmação em campo continua indispensável.

## Compartilhamento
Os links gerados em Mais ferramentas abrem a consulta principal com os parâmetros `?origem=ID&destino=ID`, que têm prioridade sobre preferências locais quando válidos.

## Módulos opcionais
Ative ou desative individualmente em `window.VDC_FEATURES` no fim de `extras.html`: `favorites`, `stopDepartures`, `sharing` e `futurePlanner`. O módulo redundante `serviceStatus` permanece desativado. Nenhum deles altera o planejador principal.

## Privacidade
Não exige conta, não solicita geolocalização e não monitora ônibus. Preferências de tema, origem, destino e favoritos são salvas localmente no navegador do usuário quando o armazenamento está disponível.

## Validação e publicação
Testes de sintaxe e lógica de feriados, trajetos e estrutura executados em 11/10/2026. Antes de uma divulgação com promessa de precisão, conferir horários de operação em campo e fazer teste manual de interface em celular e computador. Não confundir uma tabela de referência com confirmação da viagem.

Projeto independente da UFRN e STTU.

## Consulta de outro dia (ajuste de usabilidade)
A ferramenta da segunda página foi renomeada de **Planejar viagem** para **Consultar outro dia**. O usuário informa origem, destino, data e horário a partir do qual pretende embarcar. O resultado evidencia a primeira opção por chegada estimada, com horário de embarque, chegada e lista de paradas recolhível; alternativas também ficam recolhidas. A consulta usa `vdc-core.js`, sem confirmar operação em tempo real. Feriados, sábados e domingos apresentam apenas avisos. O módulo segue reversível pela configuração `futurePlanner`.
