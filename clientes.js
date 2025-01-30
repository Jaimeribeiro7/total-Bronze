const Clientes = {
  async loadClientes() {
    const clientesList = document.querySelector('.clients-list');
    if (!clientesList) return;

    try {
      const clientes = await Database.getClientes();
      this.renderClientes(clientes, clientesList);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      clientesList.innerHTML = '<p class="error">Erro ao carregar clientes</p>';
    }
  },

  renderClientes(clientes, container) {
    container.innerHTML = `
      <div class="table">
        <div class="table-header">
          <div>Nome</div>
          <div>Telefone</div>
          <div>Email</div>
          <div>Ações</div>
        </div>
        ${clientes.map(cliente => `
          <div class="table-row">
            <div>${cliente.nome}</div>
            <div>${cliente.telefone}</div>
            <div>${cliente.email || '-'}</div>
            <div>
              <button class="icon-btn" onclick="Clientes.editarCliente('${cliente.id}')">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-btn" onclick="Clientes.excluirCliente('${cliente.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showNovoClienteModal() {
    App.showModal(`
      <h2>Novo Cliente</h2>
      <form id="novo-cliente-form" onsubmit="Clientes.handleNovoCliente(event)">
        <div class="form-group">
          <label>Nome</label>
          <input type="text" name="nome" required>
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="tel" name="telefone" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email">
        </div>
        <div class="form-group">
          <label>Data de Nascimento</label>
          <input type="date" name="dataNascimento">
        </div>
        <div class="form-group">
          <label>Possui Alergias?</label>
          <select name="alergias" onchange="Clientes.toggleAlergiasDesc()">
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>
        <div class="form-group hidden" id="alergias-desc">
          <label>Descreva as Alergias</label>
          <textarea name="alergiasDesc"></textarea>
        </div>
        <div class="form-group">
          <label>Gestante?</label>
          <select name="gestante">
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
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
  },

  toggleAlergiasDesc() {
    const select = document.querySelector('select[name="alergias"]');
    const descContainer = document.getElementById('alergias-desc');
    if (select && descContainer) {
      descContainer.classList.toggle('hidden', select.value === 'nao');
    }
  },

  async handleNovoCliente(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      const novoCliente = {
        nome: formData.get('nome'),
        telefone: formData.get('telefone'),
        email: formData.get('email'),
        dataNascimento: formData.get('dataNascimento'),
        alergias: {
          possui: formData.get('alergias') === 'sim',
          descricao: formData.get('alergiasDesc') || ''
        },
        gestante: formData.get('gestante') === 'sim',
        observacoes: formData.get('observacoes'),
        dataCadastro: new Date().toISOString()
      };

      const docRef = await Database.addCliente(novoCliente);
      console.log('Cliente salvo com ID:', docRef.id);
      
      App.closeModal();
      await this.loadClientes();
      alert('Cliente cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente: ' + error.message);
    }
  },

  async editarCliente(id) {
    try {
      const cliente = await Database.getCliente(id);

      App.showModal(`
        <h2>Editar Cliente</h2>
        <form id="editar-cliente-form" onsubmit="Clientes.handleEditarCliente(event, '${id}')">
          <div class="form-group">
            <label>Nome</label>
            <input type="text" name="nome" value="${cliente.nome}" required>
          </div>
          <div class="form-group">
            <label>Telefone</label>
            <input type="tel" name="telefone" value="${cliente.telefone}" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${cliente.email || ''}">
          </div>
          <div class="form-group">
            <label>Data de Nascimento</label>
            <input type="date" name="dataNascimento" value="${cliente.dataNascimento || ''}">
          </div>
          <div class="form-group">
            <label>Possui Alergias?</label>
            <select name="alergias" onchange="Clientes.toggleAlergiasDesc()">
              <option value="nao" ${!cliente.alergias?.possui ? 'selected' : ''}>Não</option>
              <option value="sim" ${cliente.alergias?.possui ? 'selected' : ''}>Sim</option>
            </select>
          </div>
          <div class="form-group ${cliente.alergias?.possui ? '' : 'hidden'}" id="alergias-desc">
            <label>Descreva as Alergias</label>
            <textarea name="alergiasDesc">${cliente.alergias?.descricao || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Gestante?</label>
            <select name="gestante">
              <option value="nao" ${!cliente.gestante ? 'selected' : ''}>Não</option>
              <option value="sim" ${cliente.gestante ? 'selected' : ''}>Sim</option>
            </select>
          </div>
          <div class="form-group">
            <label>Observações</label>
            <textarea name="observacoes">${cliente.observacoes || ''}</textarea>
          </div>
          <div class="modal-buttons">
            <button type="button" class="secondary-btn" onclick="App.closeModal()">Cancelar</button>
            <button type="submit" class="primary-btn">Salvar</button>
          </div>
        </form>
      `);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      alert('Erro ao carregar cliente: ' + error.message);
    }
  },

  async handleEditarCliente(e, id) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      const clienteAtualizado = {
        nome: formData.get('nome'),
        telefone: formData.get('telefone'),
        email: formData.get('email'),
        dataNascimento: formData.get('dataNascimento'),
        alergias: {
          possui: formData.get('alergias') === 'sim',
          descricao: formData.get('alergiasDesc') || ''
        },
        gestante: formData.get('gestante') === 'sim',
        observacoes: formData.get('observacoes'),
        dataAtualizacao: new Date().toISOString()
      };

      await Database.updateCliente(id, clienteAtualizado);
      
      App.closeModal();
      await this.loadClientes();
      alert('Cliente atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente: ' + error.message);
    }
  },

  async excluirCliente(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await Database.deleteCliente(id);
        await this.loadClientes();
        alert('Cliente excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente: ' + error.message);
      }
    }
  }
};

window.Clientes = Clientes;