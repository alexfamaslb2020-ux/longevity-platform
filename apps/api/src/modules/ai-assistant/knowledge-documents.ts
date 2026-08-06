export interface SyntheticDocument {
  title: string;
  category: string;
  content: string;
}

export const SYNTHETIC_DOCUMENTS: SyntheticDocument[] = [
  {
    title: "Programas e planos de subscrição",
    category: "PROGRAMAS",
    content: `A Clínica Vida Longa oferece dois planos de subscrição mensal para acompanhamento contínuo de saúde e longevidade.

O plano Essencial custa 49 euros por mês e inclui: um check-in semanal de saúde via WhatsApp, acesso ao portal do cliente com histórico de check-ins e consultas, e uma consulta de acompanhamento presencial a cada dois meses.

O plano Premium custa 119 euros por mês e inclui tudo o que está no plano Essencial, mais: consultas mensais presenciais com o médico de longevidade, sessões de treino e nutrição personalizadas, acompanhamento por assistente telefónico de IA, monitorização de indicadores de saúde com alertas, e prioridade no agendamento de consultas.

Não existe taxa de inscrição. A primeira consulta de avaliação inicial tem o valor de 79 euros, que é devolvido na totalidade se o cliente aderir a um plano no próprio dia. A avaliação inicial dura cerca de 45 minutos e inclui medição de composição corporal, análise de questionário de saúde e plano inicial.

O cancelamento da subscrição pode ser feito a qualquer momento com um pré-aviso de 30 dias, através do portal do cliente ou por contacto com a equipa.`,
  },
  {
    title: "Como funciona a inscrição e o primeiro contacto",
    category: "FUNCIONAMENTO",
    content: `O processo de entrada de um novo cliente na Clínica Vida Longa funciona em três passos simples.

Primeiro passo: o cliente preenche o formulário no site ou fala connosco por WhatsApp. A equipa responde em menos de uma hora em horário de funcionamento, que é de segunda a sexta entre as 9h e as 18h, e sábados entre as 9h e as 13h.

Segundo passo: é agendada uma avaliação inicial com um profissional de saúde. A avaliação pode ser presencial na clínica ou por videochamada. No final da avaliação, o profissional apresenta um plano personalizado e os resultados são enviados por email e ficam disponíveis no portal do cliente.

Terceiro passo: o cliente escolhe o plano de subscrição que melhor se adapta ao seu objetivo — Essencial ou Premium — e assina digitalmente. O primeiro check-in de saúde acontece na semana seguinte à ativação da subscrição.

Toda a comunicação pode ser feita por WhatsApp, email ou telefone. O assistente virtual responde a dúvidas sobre planos, preços, horários e marcação de consultas em qualquer altura, e quando o assunto precisa de uma pessoa, encaminha para a equipa.`,
  },
  {
    title: "Check-ins semanais de saúde",
    category: "CHECKINS",
    content: `O check-in semanal é o coração do acompanhamento contínuo na Clínica Vida Longa. Todas as segundas-feiras de manhã, cada cliente subscrito recebe uma mensagem de WhatsApp com uma pequena avaliação de 30 segundos.

O check-in pede ao cliente para classificar numa escala de 1 a 5 a energia, a qualidade do sono, o nível de stress e a disposição geral da semana. Pode ainda acrescentar dificuldades ou sintomas em texto livre, se assim o desejar.

As respostas são analisadas automaticamente e alimentam um score de risco de desistência e de necessidade de intervenção. Se a resposta indicar um padrão negativo durante duas semanas seguidas, o sistema cria um alerta de atenção para a equipa e sugere uma intervenção, como uma chamada de acompanhamento ou o agendamento de uma consulta.

O cliente pode responder ao check-in em menos de 30 segundos diretamente pelo WhatsApp, sem instalar qualquer aplicação. Se não responder até ao fim do dia, recebe um lembrete automático. O histórico completo fica disponível no portal do cliente, com gráficos de evolução semana a semana.

Os check-ins são dados de saúde de caráter pessoal e sensível. São tratados de forma confidencial e nunca são partilhados sem consentimento.`,
  },
  {
    title: "Perguntas frequentes",
    category: "FAQ",
    content: `Perguntas frequentes da Clínica Vida Longa.

A clínica fica na Avenida da Liberdade 145, em Lisboa. O estacionamento mais próximo é o parque do Marquês de Pombal. O metro mais próximo é a estação Avenida, a 3 minutos a pé.

O horário de funcionamento é de segunda a sexta das 9h às 18h e aos sábados das 9h às 13h. A receção atende chamadas no 210 123 456 e o WhatsApp está disponível no 912 345 678.

A primeira avaliação demora cerca de 45 minutos. É pedido ao cliente chegar 10 minutos antes para preencher o questionário de saúde inicial.

O acompanhamento é totalmente em português. As consultas presenciais acontecem na clínica, e os check-ins e conversas com o assistente acontecem por WhatsApp.

Os dados de saúde são protegidos de acordo com o RGPD. O cliente pode pedir exportação ou eliminação dos seus dados a qualquer momento através do portal do cliente.

A adesão não exige cartão de crédito durante o período de experimentação da primeira semana.`,
  },
  {
    title: "Agendamento de avaliações e consultas",
    category: "AGENDAMENTO",
    content: `As avaliações iniciais e as consultas de acompanhamento são agendadas de acordo com a disponibilidade da clínica.

O horário normal de marcação é de segunda a sexta entre as 9h e as 18h, em blocos de 30 minutos para consultas de acompanhamento e de 45 minutos para avaliações iniciais.

Para marcar, o cliente pode pedir ao assistente virtual os horários disponíveis. O assistente apresenta as próximas oportunidades de marcação e, após confirmação do cliente, cria o agendamento automaticamente no sistema.

Após o agendamento, o cliente recebe uma confirmação por WhatsApp com a data, a hora e o local. Pode cancelar ou remarcar sem custo até 24 horas antes da consulta. Faltas não avisadas podem implicar uma taxa de 25 euros.

Em caso de urgência, o cliente deve contactar a receção por telefone. O assistente virtual não substitui aconselhamento médico presencial nem gere situações de emergência.`,
  },
];
