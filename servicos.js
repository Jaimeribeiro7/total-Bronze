const Servicos = {
  async loadServicos() {
    const servicosList = document.querySelector('.services-list');
    if (!servicosList) return;

    try {
      const servicos = await Database.getServicos();
      this.renderServicos(servicos, servicosList);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      servicosList.innerHTML = '<p class="error">Erro ao carregar serviços</p>';
    }
  },

  renderServicos(servicos, container) {
    container.innerHTML = `
      <div class="table">
        <div class="table-header">
          <div>Nome</div>
          <div>Preço</div>
          <div>Duração</div>
          <div>Descrição</div>
          <div>Ações</div>
        </div>
        ${servicos.map(servico => `
          <div class="table-row">
            <div>${servico.nome}</div>
            <div>R$ ${servico.preco.toFixed(2)}</div>
            <div>${servico.duracao} min</div>
            <div>${servico.descricao || '-'}</div>
            <div>
              <button class="icon-btn" onclick="Servicos.editarServico('${servico.id}')">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-btn" onclick="Servicos.excluirServico('${servico.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showNovoServicoModal() {
    App.showModal(`
      <h2>Novo Serviço</h2>
      <form id="novo-servico-form" onsubmit="Servicos.handleNovoServico(event)">
        <div class="form-group">
          <label>Nome</label>
          <input type="text" name="nome" required>
        </div>
        <div class="form-group">
          <label>Preço</label>
          <input type="number" name="preco" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label>Duração (minutos)</label>
          <input type="number" name="duracao" min="15" step="15" required>
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea name="descricao"></textarea>
        </div>
        <div class="form-group">
          <label>Produtos Utilizados</label>
          <div id="produtos-list">
            <!-- Produtos will be loaded here -->
          </div>
          <button type="button" class="secondary-btn" onclick="Servicos.addProdutoRow()">
            <i class="fas fa-plus"></i> Adicionar Produto
          </button>
        </div>
        <div class="modal-buttons">
          <button type="button" class="secondary-btn" onclick="App.closeModal()">Cancelar</button>
          <button type="submit" class="primary-btn">Salvar</button>
        </div>
      </form>
    `);

    this.loadProdutosForSelect();
  },

  async loadProdutosForSelect() {
    const produtos = await Database.getProdutos();
    const produtosList = document.getElementById('produtos-list');
    produtosList.innerHTML = ''; // Clear existing rows
    this.addProdutoRow(); // Add first row
  },

  async addProdutoRow() {
    const produtos = await Database.getProdutos();
    const produtosList = document.getElementById('produtos-list');
    
    const row = document.createElement('div');
    row.className = 'produto-row';
    
    row.innerHTML = `
      <select class="produto-select" required>
        <option value="">Selecione um produto</option>
        ${produtos.map(p => `
          <option value="${p.id}">${p.nome} (Estoque: ${p.estoque})</option>
        `).join('')}
      </select>
      <input type="number" class="produto-quantidade" min="1" value="1" required>
      <button type="button" class="icon-btn" onclick="this.parentElement.remove()">
        <i class="fas fa-trash"></i>
      </button>
    `;

    produtosList.appendChild(row);
  },

  async handleNovoServico(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      // Collect products and quantities
      const produtosUtilizados = [];
      const produtoRows = form.querySelectorAll('.produto-row');
      
      produtoRows.forEach(row => {
        const produtoId = row.querySelector('.produto-select').value;
        const quantidade = parseInt(row.querySelector('.produto-quantidade').value);
        
        if (produtoId && quantidade) {
          produtosUtilizados.push({
            produtoId,
            quantidade
          });
        }
      });

      const novoServico = {
        nome: formData.get('nome'),
        preco: parseFloat(formData.get('preco')),
        duracao: parseInt(formData.get('duracao')),
        descricao: formData.get('descricao'),
        produtosUtilizados,
        dataCadastro: new Date(),
      };

      await Database.addServico(novoServico);
      
      App.closeModal();
      await this.loadServicos();
      alert('Serviço cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço: ' + error.message);
    }
  },

  async editarServico(id) {
    try {
      const servico = await Database.getServico(id);

      App.showModal(`
        <h2>Editar Serviço</h2>
        <form id="editar-servico-form" onsubmit="Servicos.handleEditarServico(event, '${id}')">
          <div class="form-group">
            <label>Nome</label>
            <input type="text" name="nome" value="${servico.nome}" required>
          </div>
          <div class="form-group">
            <label>Preço</label>
            <input type="number" name="preco" step="0.01" min="0" value="${servico.preco}" required>
          </div>
          <div class="form-group">
            <label>Duração (minutos)</label>
            <input type="number" name="duracao" min="15" step="15" value="${servico.duracao}" required>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea name="descricao">${servico.descricao || ''}</textarea>
          </div>
          <div class="modal-buttons">
            <button type="button" class="secondary-btn" onclick="App.closeModal()">Cancelar</button>
            <button type="submit" class="primary-btn">Salvar</button>
          </div>
        </form>
      `);
    } catch (error) {
      console.error('Erro ao carregar serviço:', error);
      alert('Erro ao carregar serviço: ' + error.message);
    }
  },

  async handleEditarServico(e, id) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      const servicoAtualizado = {
        nome: formData.get('nome'),
        preco: parseFloat(formData.get('preco')),
        duracao: parseInt(formData.get('duracao')),
        descricao: formData.get('descricao'),
        dataAtualizacao: new Date(),
      };

      await Database.updateServico(id, servicoAtualizado);
      
      App.closeModal();
      await this.loadServicos();
      alert('Serviço atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      alert('Erro ao atualizar serviço: ' + error.message);
    }
  },

  async excluirServico(id) {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        await Database.deleteServico(id);
        await this.loadServicos();
        alert('Serviço excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        alert('Erro ao excluir serviço: ' + error.message);
      }
    }
  }
};

window.Servicos = Servicos;