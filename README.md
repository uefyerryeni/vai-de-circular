# Vai de Circular

Ferramenta independente da Uefyerryeni para consulta de rotas e horários de referência do Circular da UFRN, diretamente no navegador, sem necessidade de instalação.

**Acesso:** https://uefyerryeni.github.io/vai-de-circular/

## O que faz
- Compara trajetos por origem e destino nos dias úteis.
- Mostra horários de referência, passagens estimadas e linhas.
- Oferece tema claro/escuro e consulta em celular ou computador.

## Atenção aos horários
- Não existe localização dos veículos nem confirmação de operação em tempo real.
- Direto e Inverso: tabelas de dias úteis conferidas no Terminal RU em outubro de 2026; a prestação efetiva do serviço pode mudar.
- Expressos: referências com trechos estimados em aproximadamente 15 minutos.
- Sábados: dados históricos sem operação confirmada; a ferramenta **não recomenda próximas saídas** aos sábados.
- Domingos: sem programação cadastrada. Isso não é confirmação oficial sobre existência ou ausência de serviço.
- Feriados, alterações de rotina, atrasos, cancelamentos e suspensões podem tornar as estimativas inadequadas. Confirme a operação antes de se deslocar.

## Privacidade e independência
Não solicita geolocalização, login ou dados pessoais. Preferências de tema, origem e destino podem ser armazenadas apenas no navegador do usuário (localStorage). Não é uma plataforma oficial da UFRN.

## Atualização editorial
Para corrigir horários ou itinerários, revise `app-data.js` indicando a origem e a data da conferência; teste cálculos do planejador antes de divulgar mudanças. Interfaces ficam em `index.html`, `styles.css` e `app.js`.

## Checklist antes de divulgação ampla
- [x] Identidade e avisos sobre estimativas
- [x] Alerta e bloqueio de recomendação automática aos sábados
- [x] Metadados de compartilhamento
- [ ] Teste presencial de horários e percursos (especialmente Expressos e sábados)
- [ ] Teste visual e funcional em dispositivos reais
- [ ] Conferência de disponibilidade da página pública

**Status:** versão candidata a lançamento 1.0; a publicação ampla deve considerar as pendências acima.

## Módulos opcionais da versão 1.1

Os módulos ficam isolados em `vdc-modules.js` e `vdc-modules.css`, sem alterar o planejador principal:
- `favorites`: favoritos locais de paradas (máximo de cinco)
- `stopDepartures`: passagens de referência por parada somente de segunda a sexta, nunca GPS ou confirmação de operação
- `serviceStatus`: faixa explicativa sobre dias úteis, sábado e domingo
- `sharing`: link de origem/destino com parâmetros `?origem=...&destino=...`

**Como reverter:** no fim de `index.html`, altere para `false` uma ou mais opções de `window.VDC_FEATURES`. Para remover completamente a expansão, exclua o `div#vdc-extras` e as referências aos dois arquivos `vdc-modules` no HTML. Os arquivos principais permanecem independentes. O compartilhamento exige que o módulo `sharing` esteja ligado no destino.

Observação: os horários calculados para paradas intermediárias são aproximações derivadas dos deslocamentos cadastrados no projeto. Não devem ser interpretados como localização ao vivo ou garantia de embarque. 
