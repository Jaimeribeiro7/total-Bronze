// Database configuration and initialization
const dbName = 'totalBronzeDB';
const dbVersion = 1;

// Database schema and initialization
class Database {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database connected successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('clientes')) {
          const clientesStore = db.createObjectStore('clientes', { keyPath: 'id' });
          clientesStore.createIndex('cpf', 'cpf', { unique: true });
          clientesStore.createIndex('telefone', 'telefone', { unique: false });
        }

        if (!db.objectStoreNames.contains('agendamentos')) {
          const agendamentosStore = db.createObjectStore('agendamentos', { keyPath: 'id' });
          agendamentosStore.createIndex('clienteId', 'clienteId', { unique: false });
          agendamentosStore.createIndex('data', 'data', { unique: false });
        }

        if (!db.objectStoreNames.contains('registrosFinanceiros')) {
          const financeiroStore = db.createObjectStore('registrosFinanceiros', { keyPath: 'id' });
          financeiroStore.createIndex('data', 'data', { unique: false });
          financeiroStore.createIndex('tipo', 'tipo', { unique: false });
        }
      };
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async query(storeName, indexName, query) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDatesWithAppointments() {
    const agendamentos = await this.getAll('agendamentos');
    return [...new Set(agendamentos.map(a => a.data))];
  }
}

// Initialize database and app
const db = new Database();

document.addEventListener('DOMContentLoaded', async function () {
  // Initialize masks
  $('.cpf-mask').mask('000.000.000-00');
  $('.phone-mask').mask('(00) 00000-0000');

  // Section management
  window.showSection = function (sectionId) {
    document.querySelectorAll('.section').forEach((section) => {
      section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
  };

  // Cliente class with database integration
  class Cliente {
    constructor(nome, cpf, telefone, anamnese) {
      this.id = Date.now();
      this.nome = nome;
      this.cpf = cpf;
      this.telefone = telefone.replace(/\D/g, '');
      this.anamnese = anamnese;
      this.formEnviado = false;
      this.formRespondido = false;
      this.dadosAnamnese = null;
      this.contraindicacoes = this.verificarContraindicacoes(anamnese);
    }

    async save() {
      return await db.add('clientes', this);
    }

    static async getAll() {
      return await db.getAll('clientes');
    }

    static async get(id) {
      return await db.get('clientes', id);
    }

    async update() {
      return await db.update('clientes', this);
    }

    verificarContraindicacoes(anamnese) {
      const contraindicacoes = [];
      if (anamnese.alergias && anamnese.alergias.trim() !== '')
        contraindicacoes.push(`Alergias: ${anamnese.alergias}`);
      if (anamnese.medicamentos && anamnese.medicamentos.trim() !== '')
        contraindicacoes.push(`Medicamentos em uso: ${anamnese.medicamentos}`);
      if (anamnese.gestante) contraindicacoes.push("Gestante ou Amamentando");
      if (anamnese.doencasPele && anamnese.doencasPele.trim() !== '')
        contraindicacoes.push(`Doenças de Pele: ${anamnese.doencasPele}`);
      if (anamnese.cirurgiaRecente && anamnese.cirurgiaRecente.trim() !== '')
        contraindicacoes.push(`Cirurgias Recentes: ${anamnese.cirurgiaRecente}`);
      if (anamnese.problemasCardiacos && anamnese.problemasCardiacos.trim() !== '')
        contraindicacoes.push(`Problemas Cardíacos: ${anamnese.problemasCardiacos}`);
      if (anamnese.hipertensao) contraindicacoes.push("Hipertensão");
      if (anamnese.diabetes) contraindicacoes.push("Diabetes");
      if (anamnese.cancer && anamnese.cancer.trim() !== '')
        contraindicacoes.push(`Histórico de Câncer: ${anamnese.cancer}`);
      if (anamnese.tratamentoDermatologico && anamnese.tratamentoDermatologico.trim() !== '')
        contraindicacoes.push(`Tratamento Dermatológico: ${anamnese.tratamentoDermatologico}`);
      return contraindicacoes;
    }
  }

  // Agendamento class with database integration
  class Agendamento {
    constructor(clienteId, data, horario, tipo, valor) {
      this.id = Date.now();
      this.clienteId = clienteId;
      this.data = data;
      this.horario = horario;
      this.tipo = tipo;
      this.valor = valor;
      this.status = 'agendado';
      this.inicio = null;
      this.fim = null;
    }

    async save() {
      return await db.add('agendamentos', this);
    }

    static async getAll() {
      return await db.getAll('agendamentos');
    }

    static async getByDate(data) {
      return await db.query('agendamentos', 'data', data);
    }

    async update() {
      return await db.update('agendamentos', this);
    }
  }

  // RegistroFinanceiro class with database integration
  class RegistroFinanceiro {
    constructor(data, tipo, descricao, valor, formaPagamento, plataforma) {
      this.id = Date.now();
      this.data = data;
      this.tipo = tipo;
      this.descricao = descricao;
      this.valor = valor;
      this.formaPagamento = formaPagamento;
      this.plataforma = plataforma;
    }

    async save() {
      return await db.add('registrosFinanceiros', this);
    }

    static async getAll() {
      return await db.getAll('registrosFinanceiros');
    }
  }

  // Update interface functions to use database
  async function atualizarInterface() {
    await atualizarTabelaClientes();
    await atualizarSelectClientes();
    await atualizarCalendario();
    await atualizarFinanceiro();
  }

  async function atualizarTabelaClientes() {
    const clientes = await Cliente.getAll();
    const tbody = document.getElementById('tabelaClientes');
    tbody.innerHTML = clientes.map((cliente) => `
      <tr>
        <td>${cliente.nome}</td>
        <td>${cliente.telefone}</td>
        <td>
          <button class="btn btn-sm btn-orange" onclick="showClientDetails(${cliente.id})">
            <i class="fas fa-eye"></i> Detalhes
          </button>
          <button class="btn btn-sm btn-danger" onclick="excluirCliente(${cliente.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function atualizarSelectClientes() {
    const clientes = await Cliente.getAll();
    const select = document.getElementById('clienteSelect');
    select.innerHTML = '<option value="">Selecione um cliente</option>' +
      clientes.map((cliente) =>
        `<option value="${cliente.id}">${cliente.nome}</option>`
      ).join('');
  }

  async function atualizarCalendario() {
    const calendario = document.getElementById('calendario');
    const dataAtual = document.getElementById('dataVisualizacao').value ||
      new Date().toISOString().split('T')[0];

    const agendamentosDia = await Agendamento.getByDate(dataAtual);
    const now = new Date();
  
    let horariosHTML = '<div class="horarios-grid">';
  
    // Generate time slots for every 30 minutes
    for (let hora = 8; hora < 20; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 30) {
        const horario = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        const slotDateTime = new Date(`${dataAtual} ${horario}`);
        const agendamento = agendamentosDia.find((ag) => ag.horario === horario);
      
        if (agendamento) {
          const cliente = await Cliente.get(agendamento.clienteId);
          horariosHTML += `
            <div class="horario-slot ${agendamento.status}">
              <div class="hora">${horario}</div>
              <div class="cliente-info">${cliente?.nome || 'Cliente não encontrado'}</div>
              <div class="servico-info">
                ${agendamento.tipo === 'natural' ? 'Bronzeamento Natural' : 'Bronzeamento Artificial'}
                - R$ ${agendamento.valor.toFixed(2)}
              </div>
              ${agendamento.status === 'agendado' ?
                `<button class="btn btn-sm btn-orange mt-2" 
                  onclick="iniciarSessao(${agendamento.id})">
                  Iniciar Sessão
                </button>` : ''}
              ${agendamento.status === 'em-andamento' ?
                `<div class="timer-display" id="timer-${agendamento.id}"></div>` : ''}
            </div>
          `;
        } else {
          // Only show as available if the time slot is in the future
          const isDisabled = slotDateTime <= now;
          horariosHTML += `
            <${isDisabled ? 'div' : 'button'} class="horario-slot ${isDisabled ? 'ocupado' : 'livre'}" 
              ${!isDisabled ? `onclick="selecionarHorario('${horario}', '${dataAtual}')"` : ''}>
              <div class="hora">${horario}</div>
              <div class="status-slot">${isDisabled ? 'Indisponível' : 'Disponível'}</div>
            </${isDisabled ? 'div' : 'button'}>
          `;
        }
      }
    }
    horariosHTML += '</div>';

    calendario.innerHTML = horariosHTML;

    // Reiniciar timers para sessões em andamento
    const agendamentos = await Agendamento.getAll();
    agendamentos
      .filter((ag) => ag.status === 'em-andamento')
      .forEach((ag) => iniciarTimer(ag.id));
  }

  async function atualizarFinanceiro() {
    const registrosFinanceiros = await RegistroFinanceiro.getAll();
    const receitaMensal = registrosFinanceiros
      .filter((reg) => reg.tipo === 'receita')
      .reduce((total, reg) => total + reg.valor, 0);

    const despesasMensal = registrosFinanceiros
      .filter((reg) => reg.tipo === 'despesa')
      .reduce((total, reg) => total + reg.valor, 0);

    const lucroMensal = receitaMensal - despesasMensal;

    document.getElementById('receitaMensal').textContent =
      `R$ ${receitaMensal.toFixed(2)}`;
    document.getElementById('despesasMensal').textContent =
      `R$ ${despesasMensal.toFixed(2)}`;
    document.getElementById('lucroMensal').textContent =
      `R$ ${lucroMensal.toFixed(2)}`;

    const tbody = document.getElementById('tabelaFinanceiro');
    tbody.innerHTML = registrosFinanceiros.map((reg) => `
      <tr class="${reg.tipo === 'receita' ? 'table-success' : 'table-danger'}">
        <td>${new Date(reg.data).toLocaleDateString()}</td>
        <td>${reg.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
        <td>${reg.descricao}</td>
        <td>R$ ${reg.valor.toFixed(2)}</td>
        <td>${reg.formaPagamento}</td>
        <td>${reg.plataforma}</td>
      </tr>
    `).join('');
  }

  window.selecionarHorario = async function (horario, data) {
    const selectedDateTime = new Date(`${data} ${horario}`);
    const now = new Date();
  
    // Check if selected date/time is in the past
    if (selectedDateTime <= now) {
      alert('Não é possível agendar horários passados ou para o momento atual. Por favor, selecione um horário futuro.');
      return;
    }

    const modal = new bootstrap.Modal(document.getElementById('agendamentoModal'));
    document.querySelector('#formAgendamento input[name="horario"]').value = horario;
    document.querySelector('#formAgendamento input[name="data"]').value = data;
    document.querySelector('#horarioSelecionado').textContent = `${data} às ${horario}`;
    modal.show();
  };

  // Funções para gerenciar o tempo das sessões
  async function iniciarSessao(agendamentoId) {
    const agendamento = await Agendamento.get(agendamentoId);
    if (agendamento) {
      agendamento.status = 'em-andamento';
      agendamento.inicio = new Date();
      agendamento.fim = new Date(agendamento.inicio.getTime() + 60 * 60 * 1000); // 1 hora
      await agendamento.update();
      await atualizarCalendario();
      iniciarTimer(agendamentoId);
    }
  }

  async function finalizarSessao(agendamentoId) {
    const agendamento = await Agendamento.get(agendamentoId);
    if (agendamento) {
      agendamento.status = 'finalizado';

      // Registrar pagamento automaticamente
      const registro = new RegistroFinanceiro(
        agendamento.data,
        'receita',
        `Sessão de Bronzeamento ${agendamento.tipo} - Cliente: ${
          (await Cliente.get(agendamento.clienteId)).nome
        }`,
        agendamento.valor,
        "Dinheiro",
        "Total Bronze"
      );
      await registro.save();

      await agendamento.update();
      await atualizarCalendario();
      await atualizarFinanceiro();
    }
  }

  function iniciarTimer(agendamentoId) {
    const agendamento = Agendamento.get(agendamentoId);
    if (!agendamento || agendamento.status !== 'em-andamento') return;

    const timerElement = document.querySelector(`#timer-${agendamentoId}`);
    if (!timerElement) return;

    const timer = setInterval(async () => {
      const agora = new Date();
      const agendamentoAtual = await Agendamento.get(agendamentoId);
      const tempoRestante = agendamentoAtual.fim - agora;

      if (tempoRestante <= 0) {
        clearInterval(timer);
        await finalizarSessao(agendamentoId);
        return;
      }

      const minutos = Math.floor(tempoRestante / 60000);
      const segundos = Math.floor((tempoRestante % 60000) / 1000);
      timerElement.textContent = `${minutos}:${segundos.toString().padStart(2, '0')}`;
    }, 1000);
  }

  window.enviarFormularioAnamnese = async function (clienteId) {
    const cliente = await Cliente.get(clienteId);
    if (!cliente) return;

    try {
      // Generate unique form link
      const formLink = `https://totalBronze.com/anamnese/${cliente.id}`;
      cliente.linkFormulario = formLink;
      cliente.formEnviado = true;

      // Format phone number for WhatsApp API
      const phoneNumber = `55${cliente.telefone}`;

      // Message template
      const message = `Olá ${cliente.nome}! 
        Para melhor atendê-lo(a), por favor preencha nossa ficha de anamnese:
        ${formLink}
        
        Total Bronze agradece sua preferência!`;

      // Using WhatsApp Business API (you'll need to set this up with Meta/WhatsApp)
      const response = await fetch('https://graph.facebook.com/v13.0/YOUR_PHONE_NUMBER_ID/messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message }
        })
      });

      if (!response.ok) throw new Error('Falha ao enviar mensagem');

      // Save state and update UI
      await cliente.update();
      await atualizarTabelaClientes();

      alert('Formulário enviado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      alert('Erro ao enviar formulário. Por favor, tente novamente.');
      return false;
    }
  };

  // Add client details view function
  window.showClientDetails = async function (clienteId) {
    const cliente = await Cliente.get(clienteId);
    if (!cliente) return;

    const detailsHtml = `
      <div class="client-details-container">
        <div class="client-details-header">
          <h3>${cliente.nome}</h3>
          <button class="btn btn-sm btn-orange" onclick="showSection('clientes')">
            <i class="fas fa-arrow-left"></i> Voltar
          </button>
        </div>

        <div class="client-details-info">
          <p><strong>CPF:</strong> ${cliente.cpf}</p>
          <p><strong>Telefone:</strong> ${cliente.telefone}</p>
        </div>

        <div class="anamnesis-status ${cliente.formRespondido ? 'completed' : cliente.formEnviado ? 'pending' : ''}">
          <h5>Status da Ficha de Anamnese</h5>
          ${cliente.formRespondido ?
            `<div>
              <p><strong>Status:</strong> Respondido</p>
              <div class="anamnese-dados">
                <p><strong>Fototipo:</strong> ${cliente.dadosAnamnese?.fototipo || '-'}</p>
                <p><strong>Alergias:</strong> ${cliente.dadosAnamnese?.alergias || '-'}</p>
                <p><strong>Medicamentos:</strong> ${cliente.dadosAnamnese?.medicamentos || '-'}</p>
                <p><strong>Gestante:</strong> ${cliente.dadosAnamnese?.gestante ? 'Sim' : 'Não'}</p>
              </div>
            </div>` :
            cliente.formEnviado ?
              `<p>Formulário enviado. Aguardando resposta do cliente.</p>` :
              `<p>Formulário ainda não enviado.</p>
               <button class="btn btn-orange mt-2" onclick="enviarFormularioAnamnese(${cliente.id})">
                 Enviar Formulário de Anamnese
               </button>`
          }
        </div>
      </div>
    `;

    document.getElementById('clienteDetails').innerHTML = detailsHtml;
    showSection('clienteDetails');
  };

  // Client registration
  window.showClientRegistrationForm = function () {
    const modal = new bootstrap.Modal(document.getElementById('clienteRegistrationModal'));
    modal.show();
  };

  // Modify the client selection in the scheduling modal
  document.getElementById('clienteSelect').addEventListener('change', async function (e) {
    const clienteId = e.target.value;
    if (!clienteId) return;

    const cliente = await Cliente.get(parseInt(clienteId));
    if (cliente && cliente.anamnese) {
      const contraindicacoes = [];

      if (cliente.anamnese.gestante) contraindicacoes.push("Gestante ou Amamentando");
      if (cliente.anamnese.doencasPele && cliente.anamnese.doencasPele.trim() !== '')
        contraindicacoes.push(`Doenças de Pele: ${cliente.anamnese.doencasPele}`);
      if (cliente.anamnese.cirurgiaRecente && cliente.anamnese.cirurgiaRecente.trim() !== '')
        contraindicacoes.push(`Cirurgias Recentes: ${cliente.anamnese.cirurgiaRecente}`);
      if (cliente.anamnese.problemasCardiacos && cliente.anamnese.problemasCardiacos.trim() !== '')
        contraindicacoes.push(`Problemas Cardíacos: ${cliente.anamnese.problemasCardiacos}`);
      if (cliente.anamnese.hipertensao) contraindicacoes.push("Hipertensão");
      if (cliente.anamnese.diabetes) contraindicacoes.push("Diabetes");
      if (cliente.anamnese.cancer && cliente.anamnese.cancer.trim() !== '')
        contraindicacoes.push(`Histórico de Câncer: ${cliente.anamnese.cancer}`);
      if (cliente.anamnese.tratamentoDermatologico && cliente.anamnese.tratamentoDermatologico.trim() !== '')
        contraindicacoes.push(`Tratamento Dermatológico: ${cliente.anamnese.tratamentoDermatologico}`);
      if (cliente.anamnese.alergias && cliente.anamnese.alergias.trim() !== '')
        contraindicacoes.push(`Alergias: ${cliente.anamnese.alergias}`);
      if (cliente.anamnese.medicamentos && cliente.anamnese.medicamentos.trim() !== '')
        contraindicacoes.push(`Medicamentos em uso: ${cliente.anamnese.medicamentos}`);

      if (contraindicacoes.length > 0) {
        alert(`Atenção: Este cliente possui as seguintes contraindicações:\n\n${contraindicacoes.join('\n')}\n\nNão é possível realizar o agendamento.`);
        e.target.value = '';
      }
    }
  });

  document.querySelector('input[name="nome"]').addEventListener('input', function (e) {
    document.querySelector('.term-name').textContent = e.target.value || '_______________';
  });

  // Add age verification handler
  document.getElementById('maiorIdade').addEventListener('change', validateResponsibleSignature);

  // Event Listeners
  document.getElementById('formAgendamento').addEventListener('submit', async function (e) {
    e.preventDefault();
    const form = e.target;
    const servicoSelect = form.querySelector('#servicoSelect');
    const servicoOpcao = servicoSelect.options[servicoSelect.selectedIndex];

    const agendamento = new Agendamento(
      form.querySelector('#clienteSelect').value,
      form.querySelector('input[name="data"]').value,
      form.querySelector('input[name="horario"]').value,
      servicoSelect.value,
      parseFloat(servicoOpcao.dataset.preco)
    );

    await agendamento.save();
    await atualizarInterface();

    bootstrap.Modal.getInstance(document.getElementById('agendamentoModal')).hide();
    form.reset();
  });

  document.getElementById('formFinanceiro').addEventListener('submit', async function (e) {
    e.preventDefault();
    const form = e.target;
    const registro = new RegistroFinanceiro(
      form.querySelector('input[type="date"]').value,
      form.querySelector('select').value,
      form.querySelector('input[type="text"]').value,
      parseFloat(form.querySelector('input[type="number"]').value),
      form.querySelector('select[name="formaPagamento"]').value,
      form.querySelector('select[name="plataforma"]').value
    );
    await registro.save();
    await atualizarInterface();
    form.reset();
  });

  // Adicionar listener para mudança de data no calendário
  document.getElementById('dataVisualizacao').addEventListener('change', function (e) {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent selecting past dates
    if (selectedDate < today) {
      alert('Não é possível selecionar datas passadas');
      e.target.value = today.toISOString().split('T')[0];
    }

    atualizarCalendario();
  });

  // Modify the data selection logic
  function setupDateSelection() {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Format date helper function
    function formatDateButton(date) {
      const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dia = dias[date.getDay()];
      const data = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
      return `${dia} ${data}`;
    }

    // Setup "Hoje" button
    document.getElementById('btnHoje').innerHTML =
      `Hoje<br><small>${formatDateButton(hoje)}</small>`;
    document.getElementById('btnHoje').addEventListener('click', function () {
      document.getElementById('dataVisualizacao').value = hoje.toISOString().split('T')[0];
      document.querySelector('.date-picker-container').classList.remove('show');
      atualizarCalendario();
    });

    // Setup "Amanhã" button
    document.getElementById('btnAmanha').innerHTML =
      `Amanhã<br><small>${formatDateButton(amanha)}</small>`;
    document.getElementById('btnAmanha').addEventListener('click', function () {
      document.getElementById('dataVisualizacao').value = amanha.toISOString().split('T')[0];
      document.querySelector('.date-picker-container').classList.remove('show');
      atualizarCalendario();
    });

    // Setup "Outra Data" button and date picker
    document.getElementById('btnOutraData').addEventListener('click', function () {
      const datePickerContainer = document.querySelector('.date-picker-container');
      datePickerContainer.classList.toggle('show');

      if (datePickerContainer.classList.contains('show')) {
        const datePicker = document.getElementById('dataVisualizacao');
        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        datePicker.min = today;

        // If no date is selected, set to today
        if (!datePicker.value) {
          datePicker.value = today;
        }
      }
    });

    // Setup date picker change event
    document.getElementById('dataVisualizacao').addEventListener('change', function (e) {
      const selectedDate = new Date(e.target.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Prevent selecting past dates
      if (selectedDate < today) {
        alert('Não é possível selecionar datas passadas');
        e.target.value = today.toISOString().split('T')[0];
      }

      atualizarCalendario();
    });

    // Set today as default
    document.getElementById('dataVisualizacao').value = hoje.toISOString().split('T')[0];

    // Add appointment indicators to the date picker
    document.getElementById('dataVisualizacao').addEventListener('click', async function () {
      const datesWithAppointments = await db.getDatesWithAppointments();

      // Add custom styling to dates with appointments
      const dateElements = document.querySelectorAll('[type="date"]::-webkit-calendar-picker-indicator');
      dateElements.forEach(element => {
        const date = element.closest('input').value;
        if (datesWithAppointments.includes(date)) {
          element.closest('input').classList.add('date-has-appointments');
        } else {
          element.closest('input').classList.remove('date-has-appointments');
        }
      });
    });

    document.getElementById('dataVisualizacao').min = new Date().toISOString().split('T')[0];
  }

  // Update the client form submission handler to ensure it works
  document.getElementById('formCliente').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!document.getElementById('aceitaTermos').checked) {
      alert('É necessário aceitar os termos de responsabilidade e consentimento para prosseguir.');
      return;
    }

    const form = e.target;

    const anamnese = {
      maiorIdade: form.querySelector('#maiorIdade').checked,
      responsibleSignature: form.querySelector('#responsibleSignature')?.value || '',
      fototipo: form.querySelector('#fototipo').value,
      alergias: form.querySelector('#alergiasCheck').checked ? form.querySelector('#alergias').value : '',
      medicamentos: form.querySelector('#medicamentosCheck').checked ? form.querySelector('#medicamentos').value : '',
      gestante: form.querySelector('#gestante').checked,
      doencasPele: form.querySelector('#doencasPeleCheck').checked ? form.querySelector('#doencasPele').value : '',
      cirurgiaRecente: form.querySelector('#cirurgiaRecenteCheck').checked ? form.querySelector('#cirurgiaRecente').value : '',
      problemasCardiacos: form.querySelector('#problemasCardiacosCheck').checked ? form.querySelector('#problemasCardiacos').value : '',
      hipertensao: form.querySelector('#hipertensao').checked,
      diabetes: form.querySelector('#diabetes').checked,
      cancer: form.querySelector('#cancerCheck').checked ? form.querySelector('#cancer').value : '',
      tratamentoDermatologico: form.querySelector('#tratamentoDermatologicoCheck').checked ? form.querySelector('#tratamentoDermatologico').value : ''
    };

    try {
      const cliente = new Cliente(
        form.querySelector('input[name="nome"]').value,
        form.querySelector('.cpf-mask').value,
        form.querySelector('.phone-mask').value,
        anamnese
      );

      if (cliente.contraindicacoes.length > 0) {
        const confirmacao = confirm(
          `Atenção: Foram identificadas as seguintes contraindicações:\n\n${cliente.contraindicacoes.join('\n')}\n\n` +
          'O cliente será cadastrado, mas não será possível realizar agendamentos.\n\n' +
          'Deseja prosseguir com o cadastro?'
        );
        if (!confirmacao) return;
      }

      await cliente.save();
      await atualizarInterface();

      bootstrap.Modal.getInstance(document.getElementById('clienteRegistrationModal')).hide();
      form.reset();
      alert('Cliente cadastrado com sucesso!' +
        (cliente.contraindicacoes.length > 0 ?
          '\n\nObservação: Este cliente possui contraindicações que impedem o agendamento.' : ''));
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      alert('Erro ao cadastrar cliente. Por favor, verifique os dados e tente novamente.');
    }
  });

  // Call setup function after DOM is loaded
  setupDateSelection();
  setupCheckboxTextarea('alergiasCheck', 'alergias');
  setupCheckboxTextarea('medicamentosCheck', 'medicamentos');

  async function showCalendarOverview() {
    const modal = new bootstrap.Modal(document.getElementById('calendarOverviewModal'));
    await updateCalendarOverview();
    modal.show();
  }

  async function updateCalendarOverview() {
    const agendamentos = await Agendamento.getAll();

    // Group appointments by date
    const appointmentsByDate = agendamentos.reduce((acc, appointment) => {
      if (!acc[appointment.data]) {
        acc[appointment.data] = [];
      }
      acc[appointment.data].push(appointment);
      return acc;
    }, {});

    const overviewContainer = document.getElementById('calendarOverviewContent');
    let html = '';

    // Sort dates
    const sortedDates = Object.keys(appointmentsByDate).sort();

    for (const date of sortedDates) {
      const appointments = appointmentsByDate[date];
      const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      html += `
        <div class="calendar-date has-appointments">
          <h6>${formattedDate}</h6>
          <ul class="appointment-list">
      `;

      // Sort appointments by time
      appointments.sort((a, b) => a.horario.localeCompare(b.horario));

      for (const appointment of appointments) {
        const cliente = await Cliente.get(appointment.clienteId);
        html += `
          <li class="appointment-item">
            <strong>${appointment.horario}</strong> - ${cliente?.nome || 'Cliente não encontrado'}
            <br>
            <small>
              ${appointment.tipo === 'natural' ? 'Bronzeamento Natural' : 'Bronzeamento Artificial'}
              (${appointment.status})
            </small>
          </li>
        `;
      }

      html += `
          </ul>
        </div>
      `;
    }

    overviewContainer.innerHTML = html || '<p class="text-center">Nenhum agendamento encontrado.</p>';
  }

  // Add floating calendar button click handler
  document.querySelector('.floating-calendar-button').addEventListener('click', showCalendarOverview);

  // Inicialização
  try {
    await db.initDatabase();
    await atualizarInterface();
  } catch (error) {
    console.error('Error initializing application:', error);
    alert('Erro ao inicializar o aplicativo. Por favor, recarregue a página.');
  }
});

function setupCheckboxTextarea(checkboxId, textareaId) {
  const checkbox = document.getElementById(checkboxId);
  const textarea = document.getElementById(textareaId);

  checkbox.addEventListener('change', function () {
    textarea.disabled = !checkbox.checked;
  });

  if (!checkbox.checked) {
    textarea.disabled = true;
  }
}

function validateResponsibleSignature(event) {
  const isMinor = !document.getElementById('maiorIdade').checked;
  const signatureField = document.getElementById('responsibleSignature');
  const termoResponsabilidade = document.getElementById('termoResponsabilidade');

  signatureField.style.display = isMinor ? 'block' : 'none';
  termoResponsabilidade.style.display = isMinor ? 'block' : 'none';

  if (isMinor) {
    signatureField.required = true;
    termoResponsabilidade.required = true;
  } else {
    signatureField.required = false;
    termoResponsabilidade.required = false;
  }
}