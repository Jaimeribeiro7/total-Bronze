const Agenda = {
  calendar: null,

  async loadAgendamentos() {
    this.setupCalendar();
    this.setupNovoAgendamentoButton();
    await this.loadAgendamentosList();
  },

  setupCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
      locale: 'pt-br',
      events: this.loadEvents.bind(this),
      eventClick: this.handleEventClick.bind(this)
    });

    this.calendar.render();
  },

  setupNovoAgendamentoButton() {
    const btn = document.getElementById('novo-agendamento');
    if (btn) {
      btn.addEventListener('click', () => this.showNovoAgendamentoModal());
    }
  },

  async loadEvents(info, successCallback, failureCallback) {
    try {
      const agendamentos = await Database.getAgendamentos();
      const events = agendamentos.map(agendamento => ({
        id: agendamento.id,
        title: `${agendamento.cliente} - ${agendamento.servico}`,
        start: new Date(agendamento.start),
        end: new Date(agendamento.end)
      }));
      
      successCallback(events);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      failureCallback(error);
    }
  },

  async loadAgendamentosList() {
    const listEl = document.getElementById('agenda-list');
    if (!listEl) return;

    try {
      const agendamentos = await Database.getAgendamentos();
      
      this.renderAgendamentosList(agendamentos, listEl);
    } catch (error) {
      console.error('Erro ao carregar lista de agendamentos:', error);
      listEl.innerHTML = '<p class="error">Erro ao carregar agendamentos</p>';
    }
  },

  renderAgendamentosList(agendamentos, container) {
    container.innerHTML = `
      <h3>Próximos Agendamentos</h3>
      ${agendamentos.map(agendamento => `
        <div class="agendamento-item">
          <div class="hora">${this.formatTime(new Date(agendamento.start))}</div>
          <div class="info">
            <div class="cliente">${agendamento.cliente}</div>
            <div class="servico">${agendamento.servico}</div>
          </div>
          <div class="status status-${agendamento.status}">${agendamento.status}</div>
        </div>
      `).join('')}
    `;
  },

  formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  showNovoAgendamentoModal() {
    App.showModal(`
      <h2>Novo Agendamento</h2>
      <form id="novo-agendamento-form" onsubmit="Agenda.handleNovoAgendamento(event)">
        <div class="form-group">
          <label>Cliente</label>
          <select name="cliente" required>
            <option value="">Selecione um cliente</option>
          </select>
        </div>
        <div class="form-group">
          <label>Serviço</label>
          <select name="servico" required>
            <option value="">Selecione um serviço</option>
          </select>
        </div>
        <div class="form-group">
          <label>Data</label>
          <input type="date" name="data" required>
        </div>
        <div class="form-group">
          <label>Horário</label>
          <input type="time" name="horario" required>
        </div>
        <div class="form-group">
          <label>Observações</label>
          <textarea name="observacoes"></textarea>
        </div>
        <div class="modal-buttons">
          <button type="button" class="secondary-btn" onclick="App.closeModal()">Cancelar</button>
          <button type="submit" class="primary-btn">Salvar</button>
        </div>
      </form>
    `);

    // Populate selects with data
    this.loadClientesSelect();
    this.loadServicosSelect();
  },

  async loadClientesSelect() {
    const select = document.querySelector('select[name="cliente"]');
    if (!select) return;

    try {
      const clientes = await Database.getClientes();
      const options = ['<option value="">Selecione um cliente</option>'];
      
      clientes.forEach(cliente => {
        options.push(`<option value="${cliente.id}">${cliente.nome}</option>`);
      });
      
      select.innerHTML = options.join('');
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  },

  async loadServicosSelect() {
    const select = document.querySelector('select[name="servico"]');
    if (!select) return;

    try {
      const servicos = await Database.getServicos();
      const options = ['<option value="">Selecione um serviço</option>'];
      
      servicos.forEach(servico => {
        options.push(`<option value="${servico.id}">${servico.nome}</option>`);
      });
      
      select.innerHTML = options.join('');
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  },

  async handleNovoAgendamento(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      // Buscar dados do cliente e serviço
      const cliente = await Database.getCliente(formData.get('cliente'));
      const servico = await Database.getServico(formData.get('servico'));
      
      if (!cliente || !servico) {
        throw new Error('Cliente ou serviço não encontrado');
      }

      const data = formData.get('data');
      const horario = formData.get('horario');
      const dataHoraInicio = new Date(`${data}T${horario}`);
      
      // Calcular horário de fim baseado na duração do serviço
      const duracao = servico.duracao || 60;
      const dataHoraFim = new Date(dataHoraInicio.getTime() + duracao * 60000);

      const novoAgendamento = {
        clienteId: formData.get('cliente'),
        cliente: cliente.nome,
        servicoId: formData.get('servico'),
        servico: servico.nome,
        start: dataHoraInicio,
        end: dataHoraFim,
        observacoes: formData.get('observacoes'),
        status: 'confirmado',
        servicoInfo: servico, // Store full service info for later stock updates
        dataCriacao: new Date()
      };

      await Database.addAgendamento(novoAgendamento);
      
      // Update stock if status is 'realizado'
      if (formData.get('status') === 'realizado') {
        await this.updateEstoqueProdutos(servico.produtosUtilizados);
      }
      
      App.closeModal();
      await this.loadAgendamentos();
      this.calendar.refetchEvents();
      alert('Agendamento realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      alert('Erro ao salvar agendamento: ' + error.message);
    }
  },

  async updateEstoqueProdutos(produtosUtilizados) {
    if (!produtosUtilizados || !produtosUtilizados.length) return;

    for (const item of produtosUtilizados) {
      const produto = await Database.getProduto(item.produtoId);
      if (produto) {
        const novoEstoque = produto.estoque - item.quantidade;
        if (novoEstoque < 0) {
          throw new Error(`Estoque insuficiente para o produto: ${produto.nome}`);
        }
        await Database.updateProduto(item.produtoId, {
          ...produto,
          estoque: novoEstoque
        });
      }
    }
  },

  async updateAgendamentoStatus(agendamentoId, novoStatus) {
    try {
      const agendamento = await Database.getAgendamento(agendamentoId);
      if (!agendamento) return;

      // If changing to 'realizado', update product stock
      if (novoStatus === 'realizado' && agendamento.servicoInfo?.produtosUtilizados) {
        await this.updateEstoqueProdutos(agendamento.servicoInfo.produtosUtilizados);
      }

      await Database.updateAgendamento(agendamentoId, {
        ...agendamento,
        status: novoStatus
      });

      await this.loadAgendamentos();
      this.calendar.refetchEvents();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status: ' + error.message);
    }
  },

  handleEventClick: function(arg) {
    // handle event click
  }
};

window.Agenda = Agenda;