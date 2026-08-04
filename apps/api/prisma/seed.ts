import { PrismaClient, UserRole, LeadStatus, LeadSource, CustomerStatus, ConversationChannel, MessageRole, CallDirection, CallStatus, AppointmentStatus, CheckInStatus, CheckInChannel, AlertLevel, AlertType, TaskStatus, TaskPriority, ConsentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.workflowExecution.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.call.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.task.deleteMany();
  await prisma.note.deleteMany();
  await prisma.questionnaireResponse.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.service.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.questionnaire.deleteMany();

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Clínica Vida Longa',
      email: 'demo@longevity.local',
      settings: {
        timezone: 'Europe/Lisbon',
        locale: 'pt-PT',
        currency: 'EUR',
      },
    },
  });
  console.log(`  Organization: ${org.name} (${org.id})`);

  // 2. Users (profiles)
  const passwordHash = await bcrypt.hash('dev-password-123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@longevity.local',
      name: 'Admin Longevity',
      passwordHash,
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: 'sales@longevity.local',
      name: 'Carlos Vendas',
      passwordHash,
      role: UserRole.SALES,
      organizationId: org.id,
    },
  });

  const professional = await prisma.user.create({
    data: {
      email: 'prof@longevity.local',
      name: 'Dra. Ana Saúde',
      passwordHash,
      role: UserRole.PROFESSIONAL,
      organizationId: org.id,
    },
  });

  const support = await prisma.user.create({
    data: {
      email: 'support@longevity.local',
      name: 'Rui Apoio',
      passwordHash,
      role: UserRole.SUPPORT,
      organizationId: org.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@longevity.local',
      name: 'Sofia Gestão',
      passwordHash,
      role: UserRole.MANAGER,
      organizationId: org.id,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'cliente@longevity.local',
      name: 'Maria Cliente',
      passwordHash,
      role: UserRole.CLIENT,
      organizationId: org.id,
    },
  });

  console.log(`  Users: admin, sales, professional, support, manager, client`);

  // 3. Pipeline with 12 stages
  const pipeline = await prisma.pipeline.create({
    data: { name: 'Pipeline Comercial', organizationId: org.id },
  });

  const stageData = [
    { key: 'NEW_LEAD', name: 'Novo Lead', order: 0, color: '#6366f1' },
    { key: 'CONTACT_INITIATED', name: 'Contacto Iniciado', order: 1, color: '#8b5cf6' },
    { key: 'QUALIFYING', name: 'Em Qualificação', order: 2, color: '#a855f7' },
    { key: 'EVALUATION_SCHEDULED', name: 'Avaliação Agendada', order: 3, color: '#d946ef' },
    { key: 'EVALUATION_DONE', name: 'Avaliação Realizada', order: 4, color: '#ec4899' },
    { key: 'PROPOSAL_SENT', name: 'Proposta Enviada', order: 5, color: '#f43f5e' },
    { key: 'DECISION', name: 'Em Decisão', order: 6, color: '#e11d48' },
    { key: 'ACTIVE', name: 'Cliente Ativo', order: 7, color: '#10b981' },
    { key: 'FOLLOW_UP', name: 'Em Acompanhamento', order: 8, color: '#14b8a6' },
    { key: 'RENEWAL', name: 'Renovação', order: 9, color: '#06b6d4' },
    { key: 'INACTIVE', name: 'Inativo', order: 10, color: '#6b7280' },
    { key: 'LOST', name: 'Perdido', order: 11, color: '#ef4444' },
  ];

  const stages: Record<string, string> = {};
  for (const s of stageData) {
    const stage = await prisma.pipelineStage.create({
      data: { pipelineId: pipeline.id, ...s },
    });
    stages[s.key] = stage.id;
  }
  console.log(`  Pipeline: ${pipeline.name} (${stageData.length} stages)`);

  // 4. Services
  const serviceBasic = await prisma.service.create({
    data: {
      organizationId: org.id,
      name: 'Acompanhamento Básico',
      description: 'Check-ins semanais e suporte por WhatsApp',
      price: 49.90,
      duration: 30,
    },
  });

  const servicePremium = await prisma.service.create({
    data: {
      organizationId: org.id,
      name: 'Acompanhamento Premium',
      description: 'Check-ins diários, chamadas de voz IA, relatórios mensais',
      price: 99.90,
      duration: 45,
    },
  });
  console.log(`  Services: ${serviceBasic.name}, ${servicePremium.name}`);

  // 5. Leads (20)
  const leadNames = [
    { name: 'João Silva', email: 'joao@email.com', phone: '+351911111111', source: LeadSource.WEBSITE, score: 85, stage: 'EVALUATION_SCHEDULED', status: LeadStatus.QUALIFIED },
    { name: 'Maria Santos', email: 'maria@email.com', phone: '+351911111112', source: LeadSource.REFERRAL, score: 92, stage: 'DECISION', status: LeadStatus.QUALIFIED },
    { name: 'Pedro Costa', email: 'pedro@email.com', phone: '+351911111113', source: LeadSource.SOCIAL_MEDIA, score: 45, stage: 'QUALIFYING', status: LeadStatus.QUALIFYING },
    { name: 'Ana Pereira', email: 'ana@email.com', phone: '+351911111114', source: LeadSource.WHATSAPP, score: 70, stage: 'PROPOSAL_SENT', status: LeadStatus.QUALIFIED },
    { name: 'Rui Rodrigues', email: 'rui@email.com', phone: '+351911111115', source: LeadSource.AD, score: 30, stage: 'NEW_LEAD', status: LeadStatus.NEW },
    { name: 'Carla Mendes', email: 'carla@email.com', phone: '+351911111116', source: LeadSource.EVENT, score: 60, stage: 'CONTACT_INITIATED', status: LeadStatus.CONTACTED },
    { name: 'Miguel Martins', email: 'miguel@email.com', phone: '+351911111117', source: LeadSource.PARTNER, score: 78, stage: 'EVALUATION_DONE', status: LeadStatus.QUALIFIED },
    { name: 'Sofia Almeida', email: 'sofia@email.com', phone: '+351911111118', source: LeadSource.WEBSITE, score: 25, stage: 'NEW_LEAD', status: LeadStatus.NEW },
    { name: 'Tiago Ferreira', email: 'tiago@email.com', phone: '+351911111119', source: LeadSource.REFERRAL, score: 55, stage: 'QUALIFYING', status: LeadStatus.QUALIFYING },
    { name: 'Inês Cardoso', email: 'ines@email.com', phone: '+351911111120', source: LeadSource.LANDING_PAGE, score: 40, stage: 'QUALIFYING', status: LeadStatus.QUALIFYING },
    { name: 'Hugo Nunes', email: 'hugo@email.com', phone: '+351911111121', source: LeadSource.CALL, score: 15, stage: 'NEW_LEAD', status: LeadStatus.NEW },
    { name: 'Lara Batista', email: 'lara@email.com', phone: '+351911111122', source: LeadSource.SOCIAL_MEDIA, score: 35, stage: 'CONTACT_INITIATED', status: LeadStatus.CONTACTED },
    { name: 'Diogo Castro', email: 'diogo@email.com', phone: '+351911111123', source: LeadSource.WEBSITE, score: 88, stage: 'DECISION', status: LeadStatus.QUALIFIED },
    { name: 'Marta Reis', email: 'marta@email.com', phone: '+351911111124', source: LeadSource.PARTNER, score: 72, stage: 'PROPOSAL_SENT', status: LeadStatus.QUALIFIED },
    { name: 'Bruno Lopes', email: 'bruno@email.com', phone: '+351911111125', source: LeadSource.AD, score: 20, stage: 'LOST', status: LeadStatus.LOST },
    { name: 'Teresa Soares', email: 'teresa@email.com', phone: '+351911111126', source: LeadSource.REFERRAL, score: 65, stage: 'EVALUATION_SCHEDULED', status: LeadStatus.QUALIFIED },
    { name: 'Filipe Tavares', email: 'filipe@email.com', phone: '+351911111127', source: LeadSource.WHATSAPP, score: 50, stage: 'QUALIFYING', status: LeadStatus.QUALIFYING },
    { name: 'Rita Gomes', email: 'rita@email.com', phone: '+351911111128', source: LeadSource.EVENT, score: 42, stage: 'CONTACT_INITIATED', status: LeadStatus.CONTACTED },
    { name: 'André Moreira', email: 'andre@email.com', phone: '+351911111129', source: LeadSource.LANDING_PAGE, score: 10, stage: 'NEW_LEAD', status: LeadStatus.NEW },
    { name: 'Patrícia Cruz', email: 'patricia@email.com', phone: '+351911111130', source: LeadSource.WEBSITE, score: 80, stage: 'EVALUATION_DONE', status: LeadStatus.QUALIFIED },
  ];

  const leads: any[] = [];
  for (const l of leadNames) {
    const lead = await prisma.lead.create({
      data: {
        name: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        score: l.score,
        status: l.status,
        pipelineStageId: stages[l.stage],
        organizationId: org.id,
        assignedToId: l.score > 60 ? sales.id : undefined,
        metadata: { sourceDetail: `Seed demo - ${l.source}` },
        lastContactedAt: l.status !== LeadStatus.NEW ? new Date(Date.now() - Math.random() * 7 * 86400000) : undefined,
      },
    });
    leads.push(lead);
  }
  console.log(`  Leads: ${leads.length} created`);

  // 6. Customers (10 from leads)
  const customerLeads = [leads[0], leads[1], leads[3], leads[6], leads[12], leads[13], leads[15], leads[17], leads[19], leads[4]].filter(Boolean);
  const customers: any[] = [];

  for (let i = 0; i < customerLeads.length; i++) {
    const cl = customerLeads[i];
    const isActive = i < 7;
    const customer = await prisma.customer.create({
      data: {
        leadId: cl.id,
        organizationId: org.id,
        responsibleUserId: i < 4 ? professional.id : (i < 7 ? sales.id : undefined),
        status: isActive ? CustomerStatus.ACTIVE : (i === 7 ? CustomerStatus.INACTIVE : CustomerStatus.CHURNED),
        churnRisk: isActive ? Math.random() * 0.4 : (i === 7 ? 0.2 : 0.85),
        internalNotes: isActive ? 'Cliente a responder bem ao programa' : 'Perdemos contacto com este cliente',
        lastCheckInAt: isActive ? new Date(Date.now() - Math.random() * 5 * 86400000) : undefined,
        lastContactAt: new Date(Date.now() - Math.random() * 3 * 86400000),
        tags: isActive ? ['programa-ativo', 'checkins-semanais'] : ['inativo'],
      },
    });

    // Update lead to CONVERTED
    await prisma.lead.update({
      where: { id: cl.id },
      data: { status: LeadStatus.CONVERTED, pipelineStageId: stages.ACTIVE },
    });

    // Subscription
    await prisma.subscription.create({
      data: {
        customerId: customer.id,
        serviceId: i < 4 ? servicePremium.id : serviceBasic.id,
        status: isActive ? 'ACTIVE' as any : 'CANCELLED' as any,
        startDate: new Date(Date.now() - (30 + i * 15) * 86400000),
        renewalDate: isActive ? new Date(Date.now() + (30 - i) * 86400000) : undefined,
        autoRenew: isActive,
      },
    });

    customers.push(customer);
  }

  // Link the client portal user to the first (active, premium) customer
  await prisma.customer.update({
    where: { id: customers[0].id },
    data: { userId: clientUser.id },
  });
  console.log(`  Customers: ${customers.length} created (portal ligado a ${customers[0].id})`);

  // 7. Check-ins (5 customers with history)
  for (let i = 0; i < Math.min(5, customers.length); i++) {
    const customer = customers[i];
    for (let d = 7; d >= 0; d--) {
      const energy = Math.max(1, Math.min(5, Math.round(3 + Math.random() * 2 - (i > 2 ? 0.5 : 0))));
      const sleep = Math.max(1, Math.min(5, Math.round(3 + Math.random() * 2)));
      const stress = Math.max(1, Math.min(5, Math.round(2 + Math.random() * 2 + (i > 3 ? 0.5 : 0))));
      const mood = Math.max(1, Math.min(5, Math.round(3 + Math.random() * 2)));
      const adherence = Math.max(1, Math.min(5, Math.round(3 + Math.random() * 2)));

      await prisma.checkIn.create({
        data: {
          customerId: customer.id,
          type: 'daily',
          channel: CheckInChannel.WHATSAPP,
          status: CheckInStatus.COMPLETED,
          scheduledAt: new Date(Date.now() - d * 86400000),
          completedAt: new Date(Date.now() - d * 86400000 + 3600000),
          responses: {
            energy, sleep, stress, mood, adherence,
            difficulties: d % 3 === 0 ? 'Senti alguma fadiga' : 'Nenhuma',
            satisfaction: Math.max(1, Math.min(5, Math.round(3 + Math.random() * 2))),
            support_needed: false,
          },
          alertLevel: energy <= 2 || stress >= 4 ? AlertLevel.ATTENTION : AlertLevel.NORMAL,
        },
      });
    }

    // One overdue check-in
    await prisma.checkIn.create({
      data: {
        customerId: customer.id,
        type: 'weekly',
        channel: CheckInChannel.WHATSAPP,
        status: CheckInStatus.OVERDUE,
        scheduledAt: new Date(Date.now() - 2 * 86400000),
        alertLevel: AlertLevel.ATTENTION,
      },
    });
  }
  console.log(`  Check-ins: created for ${Math.min(5, customers.length)} customers`);

  // 8. Alerts (3 customers)
  for (let i = 0; i < Math.min(3, customers.length); i++) {
    await prisma.alert.create({
      data: {
        customerId: customers[i].id,
        type: i === 0 ? AlertType.LOW_ADHERENCE : (i === 1 ? AlertType.NEGATIVE_FEEDBACK : AlertType.CHURN_RISK),
        level: i === 0 ? AlertLevel.ATTENTION : (i === 1 ? AlertLevel.PRIORITY : AlertLevel.URGENT),
        title: i === 0 ? 'Baixa adesão ao programa' : (i === 1 ? 'Feedback negativo no check-in' : 'Risco de desistência elevado'),
        message: i === 0 ? 'Cliente reportou cansaço nos últimos 3 check-ins' : (i === 1 ? 'Satisfação diminuiu para 2/5' : 'Cliente não responde a check-ins há 5 dias'),
        metadata: { factors: i === 0 ? ['energy:2', 'sleep:2'] : (i === 1 ? ['satisfaction:2'] : ['missed:5']) },
      },
    });
  }
  console.log('  Alerts: created');

  // 9. Tasks (5)
  const taskData = [
    { title: 'Contactar lead prioritário', description: 'João Silva está aguardando proposta', priority: TaskPriority.HIGH, relatedTo: 'lead', relatedId: leads[0].id, assignedToId: sales.id },
    { title: 'Follow-up avaliação', description: 'Ligar para Maria Santos para confirmar avaliação', priority: TaskPriority.MEDIUM, relatedTo: 'lead', relatedId: leads[1].id, assignedToId: sales.id },
    { title: 'Preparar relatório mensal', description: 'Relatório de progresso para cliente premium', priority: TaskPriority.MEDIUM, relatedTo: 'customer', relatedId: customers[0].id, assignedToId: professional.id },
    { title: 'Rever alerta de risco', description: 'Analisar situação de cliente com churn alto', priority: TaskPriority.URGENT, relatedTo: 'customer', relatedId: customers[2].id, assignedToId: professional.id },
    { title: 'Atualizar pipeline', description: 'Mover leads da etapa de proposta para decisão', priority: TaskPriority.LOW, relatedTo: 'pipeline', assignedToId: sales.id },
  ];

  for (const t of taskData) {
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.priority === TaskPriority.URGENT ? TaskStatus.PENDING : TaskStatus.PENDING,
        assignedToId: t.assignedToId,
        relatedTo: t.relatedTo,
        relatedId: t.relatedId,
        dueDate: new Date(Date.now() + (t.priority === TaskPriority.URGENT ? 1 : 3) * 86400000),
      },
    });
  }
  console.log('  Tasks: created');

  // 10. Conversations & Messages (fictitious)
  const conversationScripts = [
    {
      lead: leads[2], // Pedro Costa
      aiHandled: true,
      summary: 'Conversa gerida por IA. Apresentados planos (49,90 €/99,90 €) e registado pedido de avaliação inicial.',
      messages: [
        { role: MessageRole.USER, content: 'Olá! Vi o vosso anúncio no Instagram e fiquei curioso. O que é que a clínica faz exatamente?' },
        { role: MessageRole.AI, content: 'Olá Pedro! A Clínica Vida Longa acompanha a sua longevidade: plano de treino e nutrição personalizado, monitorização biométrica mensal e acompanhamento contínuo por especialistas. Posso ajudar com mais algum detalhe?' },
        { role: MessageRole.USER, content: 'E quanto custa? Queria perceber se cabe no orçamento.' },
        { role: MessageRole.AI, content: 'Temos dois planos: o Mensal por 49,90 €/mês, sem fidelização e cancelamento em qualquer altura, e o Anual por 99,90 €/mês, com faturação anual, que é o mais vantajoso. Ambos incluem avaliação inicial e monitorização mensal.' },
        { role: MessageRole.USER, content: 'Parece interessante. Podem marcar uma avaliação inicial para a próxima semana?' },
        { role: MessageRole.AI, content: 'Claro! Deixei registado o seu pedido de avaliação inicial. A nossa equipa vai confirmar a disponibilidade e entra em contacto consigo. Obrigado, Pedro!' },
      ],
    },
    {
      lead: leads[3], // Ana Pereira (cliente ativa)
      aiHandled: true,
      summary: 'Conversa gerida por IA. Cliente com dúvidas sobre renovação e interesse no plano anual.',
      messages: [
        { role: MessageRole.USER, content: 'Bom dia! Queria perceber se o meu plano renova automaticamente.' },
        { role: MessageRole.AI, content: 'Bom dia Ana! Sim, o seu plano tem renovação automática, mas pode cancelar em qualquer altura, sem fidelização. Precisa de mais alguma coisa?' },
        { role: MessageRole.USER, content: 'E o plano anual, quanto fica? Estou a pensar mudar.' },
        { role: MessageRole.AI, content: 'O Plano Anual fica em 99,90 € por mês, com faturação anual. É o plano mais vantajoso e inclui tudo o que já tem, com prioridade no agendamento. Quer que deixe registado o interesse?' },
        { role: MessageRole.USER, content: 'Sim, por favor!' },
        { role: MessageRole.AI, content: 'Feito! Deixei registado o seu interesse no plano anual e a equipa comercial vai entrar em contacto. Obrigada, Ana!' },
      ],
    },
    {
      lead: leads[5], // Carla Mendes
      aiHandled: true,
      summary: 'Conversa gerida por IA. Seguimento de check-ins, energia em melhoria e confirmação da próxima avaliação.',
      messages: [
        { role: MessageRole.USER, content: 'Olá! Obrigada pelo acompanhamento. A minha energia tem estado melhor esta semana.' },
        { role: MessageRole.AI, content: 'Que bom, Carla! Fico contente que esteja a notar melhorias. Os seus últimos check-ins mostraram menos fadiga — o ajuste no plano está a resultar.' },
        { role: MessageRole.USER, content: 'Sim! Só queria confirmar a próxima avaliação, está marcada para quando?' },
        { role: MessageRole.AI, content: 'A sua próxima avaliação está agendada para daqui a 2 semanas. Quer que a confirme por aqui quando for marcada? Até lá, mantenha os check-ins diários!' },
        { role: MessageRole.USER, content: 'Perfeito, muito obrigada!' },
        { role: MessageRole.AI, content: 'De nada, Carla! Estamos aqui para o que precisar. Bons treinos!' },
      ],
    },
    {
      lead: leads[9], // Inês Cardoso
      aiHandled: false,
      summary: 'Transferido para humano. Cliente com dúvidas sobre planos e acompanhamento de nutrição.',
      messages: [
        { role: MessageRole.USER, content: 'Olá! Queria falar com uma pessoa, por favor. Tenho dúvidas sobre os planos.' },
        { role: MessageRole.AI, content: 'Claro, Inês! Vou transferir a conversa para um dos nossos consultores, que continua por aqui. Obrigado pela paciência!' },
        { role: MessageRole.HUMAN, content: 'Boa tarde Inês, aqui é o Carlos, da equipa comercial. Em que posso ajudar?' },
        { role: MessageRole.USER, content: 'Queria perceber se o plano inclui acompanhamento de nutrição.' },
        { role: MessageRole.HUMAN, content: 'Sim! Todos os planos incluem plano de nutrição e treino personalizados. O Plano Anual (99,90 €/mês) dá ainda prioridade no agendamento. Quer que marque uma avaliação?' },
        { role: MessageRole.USER, content: 'Sim, gostava. Pode ser para a próxima semana?' },
        { role: MessageRole.HUMAN, content: 'Perfeito! Vou confirmar a disponibilidade e envio a proposta por aqui. Até já!' },
      ],
    },
    {
      lead: leads[16], // Filipe Tavares
      aiHandled: false,
      summary: 'Transferido para humano. Confirmadas condições dos planos; cliente fica a decidir.',
      messages: [
        { role: MessageRole.USER, content: 'Olá! A vossa assistente disse que o plano é 49,90 € mas queria confirmar se há algum custo de adesão.' },
        { role: MessageRole.AI, content: 'Boa tarde Filipe! Não, não há qualquer custo de adesão. O Plano Mensal é 49,90 €/mês e o Anual 99,90 €/mês, ambos sem fidelização. Quer que transfira a conversa para um consultor?' },
        { role: MessageRole.USER, content: 'Sim, por favor.' },
        { role: MessageRole.HUMAN, content: 'Olá Filipe, sou o Carlos. Confirmo o que a assistente disse: sem custos de adesão e sem fidelização. Posso ajudar com mais alguma coisa?' },
        { role: MessageRole.USER, content: 'Não, obrigado. Vou pensar e dou-lhe resposta.' },
        { role: MessageRole.HUMAN, content: 'Combinado! Fico a aguardar o seu contacto. Tenha um bom dia!' },
      ],
    },
  ];

  const createdConversations: string[] = [];
  for (const script of conversationScripts) {
    const conv = await prisma.conversation.create({
      data: {
        channel: ConversationChannel.WHATSAPP,
        leadId: script.lead.id,
        status: 'active',
        aiHandled: script.aiHandled,
        summary: script.summary,
        metadata: { waContactName: script.lead.name },
      },
    });
    createdConversations.push(conv.id);

    const messageCount = script.messages.length;
    for (let m = 0; m < messageCount; m++) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          content: script.messages[m].content,
          role: script.messages[m].role,
          sentAt: new Date(Date.now() - (messageCount - m) * 3600000),
        },
      });
    }
  }
  console.log('  Conversations & Messages: created');

  // 11. Calls (fictitious)
  const callData = [
    {
      conversationId: createdConversations[0], // Pedro Costa
      direction: CallDirection.OUTBOUND,
      status: CallStatus.COMPLETED,
      duration: 120,
      toNumber: '+351911111113',
      aiUsed: true,
      summary: 'Chamada IA de qualificação: cliente de 45 anos, sedentário, objetivo perder peso e ganhar energia. Apresentados os planos — mostrou interesse no anual (99,90 €/mês). Enviado convite para avaliação inicial.',
    },
    {
      conversationId: createdConversations[1], // Ana Pereira
      direction: CallDirection.OUTBOUND,
      status: CallStatus.COMPLETED,
      duration: 165,
      toNumber: '+351911111114',
      aiUsed: true,
      summary: 'Chamada IA de follow-up pós-avaliação: cliente satisfeita com a primeira avaliação, sem dúvidas pendentes. Próximo passo: envio da proposta formal.',
    },
    {
      conversationId: createdConversations[4], // Filipe Tavares
      direction: CallDirection.INBOUND,
      status: CallStatus.COMPLETED,
      duration: 210,
      fromNumber: '+351911111127',
      aiUsed: false,
      summary: 'Chamada recebida a pedir informações sobre o programa premium e preços. Consultor apresentou os planos e agendou avaliação inicial.',
    },
    {
      conversationId: null,
      direction: CallDirection.INBOUND,
      status: CallStatus.NO_ANSWER,
      duration: null,
      fromNumber: '+351911111112',
      aiUsed: false,
      summary: null,
    },
  ];

  for (let i = 0; i < callData.length; i++) {
    await prisma.call.create({
      data: {
        conversationId: callData[i].conversationId,
        direction: callData[i].direction,
        status: callData[i].status,
        duration: callData[i].duration,
        toNumber: callData[i].toNumber,
        fromNumber: callData[i].fromNumber,
        aiUsed: callData[i].aiUsed,
        summary: callData[i].summary,
        startedAt: new Date(Date.now() - (i + 1) * 86400000),
        endedAt: callData[i].status === CallStatus.COMPLETED
          ? new Date(Date.now() - (i + 1) * 86400000 + (callData[i].duration || 0) * 1000)
          : undefined,
      },
    });
  }
  console.log('  Calls: created');

  // 12. Appointments
  for (let i = 0; i < 6; i++) {
    const isPast = i < 3;
    const dayOffset = isPast ? -(i + 1) : (i - 2) * 2;

    await prisma.appointment.create({
      data: {
        leadId: i < 3 ? leads[i * 2].id : undefined,
        customerId: i >= 3 ? customers[i - 3].id : undefined,
        title: isPast ? 'Avaliação Inicial' : 'Check-up Mensal',
        type: isPast ? 'evaluation' : 'followup',
        status: isPast ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED,
        startDate: new Date(Date.now() + dayOffset * 86400000 + 10 * 3600000),
        endDate: new Date(Date.now() + dayOffset * 86400000 + 11 * 3600000),
        duration: 60,
        notes: isPast ? 'Avaliação correu bem' : 'Confirmar presença 24h antes',
        meetLink: !isPast ? 'https://meet.google.com/abc-defg-hij' : undefined,
      },
    });
  }
  console.log('  Appointments: created');

  // 13. Questionnaire
  const questionnaire = await prisma.questionnaire.create({
    data: {
      title: 'Questionário de Bem-Estar Inicial',
      description: 'Avaliação inicial do estado de bem-estar do cliente',
      questions: [
        { key: 'q1', question: 'Como avalia a sua saúde geral?', type: 'scale', min: 1, max: 5 },
        { key: 'q2', question: 'Pratica exercício físico regularmente?', type: 'boolean' },
        { key: 'q3', question: 'Como descreve a sua alimentação?', type: 'scale', min: 1, max: 5 },
        { key: 'q4', question: 'Tem algum objetivo específico de saúde?', type: 'text' },
      ],
      active: true,
    },
  });
  console.log('  Questionnaire: created');

  // 14. Questionnaire responses
  for (let i = 0; i < Math.min(3, customers.length); i++) {
    await prisma.questionnaireResponse.create({
      data: {
        questionnaireId: questionnaire.id,
        respondentId: customers[i].id,
        respondentType: 'customer',
        answers: {
          q1: 3 + Math.round(Math.random() * 2),
          q2: Math.random() > 0.5,
          q3: 2 + Math.round(Math.random() * 2),
          q4: 'Melhorar a minha energia e qualidade de sono',
        },
      },
    });
  }
  console.log('  Questionnaire responses: created');

  // 15. Documents
  for (let i = 0; i < Math.min(3, customers.length); i++) {
    await prisma.document.create({
      data: {
        customerId: customers[i].id,
        type: 'CONSENT_FORM' as any,
        title: 'Consentimento de Participação',
        url: `https://storage.longevity.local/consentimentos/${customers[i].id}.pdf`,
        mimeType: 'application/pdf',
        fileSize: 245000,
      },
    });
  }
  console.log('  Documents: created');

  // 16. Notes
  for (let i = 0; i < Math.min(5, leads.length); i++) {
    await prisma.note.create({
      data: {
        authorId: sales.id,
        content: `Nota de seguimento para ${leads[i].name}. Cliente demonstrou interesse no programa de longevidade.`,
        relatedTo: 'lead',
        relatedId: leads[i].id,
        isPrivate: false,
      },
    });
  }
  console.log('  Notes: created');

  // 17. Consents
  const allUsers = [admin, sales, professional, support, manager, clientUser];
  for (const u of allUsers) {
    await prisma.consent.create({
      data: {
        userId: u.id,
        type: ConsentType.TERMS_OF_SERVICE,
        granted: true,
        grantedAt: new Date(),
        ip: '127.0.0.1',
        userAgent: 'Seed Script',
      },
    });
    await prisma.consent.create({
      data: {
        userId: u.id,
        type: ConsentType.COMMUNICATION,
        granted: true,
        grantedAt: new Date(),
        ip: '127.0.0.1',
      },
    });
  }
  console.log('  Consents: created');

  // 18. Workflows de automação (demo)
  const workflows = [
    {
      name: 'Qualificação: contactar novo lead',
      description:
        'Quando um lead é criado, cria uma tarefa para a equipa comercial contactar e envia notificação.',
      triggers: ['lead.created'],
      conditions: [],
      actions: [
        {
          type: 'CREATE_TASK',
          params: {
            title: 'Contactar novo lead',
            description: 'Lead criado — fazer primeiro contacto nas próximas 2 horas.',
            priority: 'HIGH',
            assignedToId: sales.id,
          },
          order: 1,
        },
        {
          type: 'CREATE_NOTIFICATION',
          params: {
            userId: admin.id,
            type: 'AUTOMATION',
            title: 'Novo lead captado',
            body: 'Um novo lead entrou no pipeline — tarefa de contacto criada.',
          },
          order: 2,
        },
      ],
      priority: 10,
    },
    {
      name: 'Vendas: acompanhar proposta enviada',
      description:
        'Quando um lead passa para a etapa de proposta, cria tarefa de follow-up.',
      triggers: ['lead.stage_changed'],
      conditions: [{ field: 'data.toStageKey', operator: 'eq', value: 'PROPOSAL_SENT' }],
      actions: [
        {
          type: 'CREATE_TASK',
          params: {
            title: 'Follow-up de proposta',
            description: 'Lead recebeu proposta — contactar em 48h para esclarecer dúvidas.',
            priority: 'MEDIUM',
            assignedToId: sales.id,
          },
          order: 1,
        },
        {
          type: 'CREATE_NOTIFICATION',
          params: {
            userId: manager.id,
            type: 'AUTOMATION',
            title: 'Proposta enviada',
            body: 'Uma proposta foi enviada a um lead — acompanhar decisão.',
          },
          order: 2,
        },
      ],
      priority: 20,
    },
    {
      name: 'Conversão: onboarding automático',
      description:
        'Quando um lead é convertido, cria tarefa de onboarding, agenda check-in inicial e notifica.',
      triggers: ['lead.converted'],
      conditions: [],
      actions: [
        {
          type: 'CREATE_TASK',
          params: {
            title: 'Completar onboarding',
            description: 'Concluir onboarding do novo cliente: plano, documentos e primeira avaliação.',
            priority: 'HIGH',
            assignedToId: professional.id,
          },
          order: 1,
        },
        {
          type: 'CREATE_NOTIFICATION',
          params: {
            userId: admin.id,
            type: 'AUTOMATION',
            title: 'Lead convertido em cliente',
            body: 'Parabéns! Um novo cliente entrou na plataforma.',
          },
          order: 2,
        },
        {
          type: 'CREATE_NOTIFICATION',
          params: {
            userId: clientUser.id,
            type: 'AUTOMATION',
            title: 'Bem-vindo(a)!',
            body: 'O seu plano começou. Em breve pode responder ao seu primeiro check-in.',
          },
          order: 3,
        },
      ],
      priority: 30,
    },
    {
      name: 'Check-in: intervenção em nível crítico',
      description:
        'Quando um check-in regista nível URGENT ou PRIORITY, cria tarefa de intervenção e alerta.',
      triggers: ['checkin.completed'],
      conditions: [
        { field: 'data.alertLevel', operator: 'in', value: ['URGENT', 'PRIORITY'] },
      ],
      actions: [
        {
          type: 'CREATE_TASK',
          params: {
            title: 'Intervenção urgente no check-in',
            description: 'Cliente com respostas críticas — contactar hoje para apoio.',
            priority: 'URGENT',
            assignedToId: professional.id,
          },
          order: 1,
        },
        {
          type: 'CREATE_NOTIFICATION',
          params: {
            userId: professional.id,
            type: 'AUTOMATION',
            title: 'Check-in crítico',
            body: 'Um cliente respondeu ao check-in com sinais críticos — intervenção necessária.',
          },
          order: 2,
        },
      ],
      priority: 40,
    },
    {
      name: 'Risco: alertar equipa sobre churn',
      description:
        'Quando o risco de churn sobe para >= 50%, cria alerta e tarefa de recuperação.',
      triggers: ['customer.risk_changed'],
      conditions: [{ field: 'data.risk', operator: 'gte', value: 0.5 }],
      actions: [
        {
          type: 'CREATE_ALERT',
          params: {
            level: 'PRIORITY',
            type: 'CHURN_RISK',
            title: 'Risco de churn detetado',
            description: 'Cliente com risco elevado de desistência — ativar plano de recuperação.',
          },
          order: 1,
        },
        {
          type: 'CREATE_TASK',
          params: {
            title: 'Plano de recuperação de cliente',
            description: 'Elaborar plano de recuperação para cliente em risco de churn.',
            priority: 'HIGH',
            assignedToId: professional.id,
          },
          order: 2,
        },
      ],
      priority: 50,
    },
    {
      name: 'Chamada IA: registar resultado',
      description:
        'Quando uma chamada IA conclui, cria tarefa para registar o resultado no CRM.',
      triggers: ['call.completed'],
      conditions: [],
      actions: [
        {
          type: 'CREATE_TASK',
          params: {
            title: 'Registar resultado da chamada',
            description: 'Chamada IA concluída — registar próximos passos no CRM.',
            priority: 'LOW',
            assignedToId: sales.id,
          },
          order: 1,
        },
      ],
      priority: 60,
    },
  ];

  for (const wf of workflows) {
    await prisma.workflow.create({
      data: {
        name: wf.name,
        description: wf.description,
        active: true,
        triggers: wf.triggers,
        conditions: wf.conditions,
        actions: wf.actions,
        priority: wf.priority,
        metadata: { demo: true } as any,
      },
    });
  }
  console.log(`  Workflows: ${workflows.length} automações criadas`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Credenciais de desenvolvimento:');
  console.log('   Admin:      admin@longevity.local / dev-password-123');
  console.log('   Sales:      sales@longevity.local / dev-password-123');
  console.log('   Professional: prof@longevity.local / dev-password-123');
  console.log('   Manager:    manager@longevity.local / dev-password-123');
  console.log('   Support:    support@longevity.local / dev-password-123');
  console.log('   Client:     cliente@longevity.local / dev-password-123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
