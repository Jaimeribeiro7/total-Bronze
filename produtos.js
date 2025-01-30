const Produtos = {
  async loadProdutos() {
    const produtosList = document.querySelector('.products-list');
    if (!produtosList) return;

    try {
      const produtos = await Database.getProdutos();
      this.renderProdutos(produtos, produtosList);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      produtosList.innerHTML = '<p class="error">Erro ao carregar produtos</p>';
    }
  },

  renderProdutos(produtos, container) {
    container.innerHTML = `
      <div class="table">
        <div class="table-header">
          <div>Nome</div>
          <div>Preço</div>
          <div>Estoque</div>
          <div>Descrição</div>
          <div>Ações</div>
        </div>
        ${produtos.map(produto => `
          <div class="table-row">
            <div>${produto.nome}</div>
            <div>R$ ${produto.preco.toFixed(2)}</div>
            <div>${produto.estoque}</div>
            <div>${produto.descricao || '-'}</div>
            <div>
              <button class="icon-btn" onclick="Produtos.editarProduto('${produto.id}')">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-btn" onclick="Produtos.excluirProduto('${produto.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showNovoProdutoModal() {
    App.showModal(`
      <h2>Novo Produto</h2>
      <form id="novo-produto-form" onsubmit="Produtos.handleNovoProduto(event)">
        <div class="form-group">
          <label>Nome</label>
          <input type="text" name="nome" required>
        </div>
        <div class="form-group">
          <label>Preço</label>
          <input type="number" name="preco" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label>Estoque</label>
          <input type="number" name="estoque" min="0" required>
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea name="descricao"></textarea>
        </div>
        <div class="modal-buttons">
          <button type="button" class="secondary-btn" onclick="App.closeModal()">Cancelar</button>
          <button type="submit" class="primary-btn">Salvar</button>
        </div>
      </form>
    `);
  },

  async handleNovoProduto(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      const novoProduto = {
        nome: formData.get('nome'),
        preco: parseFloat(formData.get('preco')),
        estoque: parseInt(formData.get('estoque')),
        descricao: formData.get('descricao'),
        dataCadastro: new Date()
      };

      await Database.addProduto(novoProduto);
      
      App.closeModal();
      await this.loadProdutos();
      alert('Produto cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + error.message);
    }
  },

  async editarProduto(id) {
    try {
      const produto = this.getProduto(id);

      App.showModal(`
        <h2>Editar Produto</h2>
        <form id="editar-produto-form" onsubmit="Produtos.handleEditarProduto(event, '${id}')">
          <div class="form-group">
            <label>Nome</label>
            <input type="text" name="nome" value="${produto.nome}" required>
          </div>
          <div class="form-group">
            <label>Preço</label>
            <input type="number" name="preco" step="0.01" min="0" value="${produto.preco}" required>
          </div>
          <div class="form-group">
            <label>Estoque</label>
            <input type="number" name="estoque" min="0" value="${produto.estoque}" required>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea name="descricao">${produto.descricao || ''}</textarea>
          </div>
          <div class="modal-buttons">
            <button type="button" class="secondary-btn" onclick="App.closeModal()">Cancelar</button>
            <button type="submit" class="primary-btn">Salvar</button>
          </div>
        </form>
      `);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto: ' + error.message);
    }
  },

  async handleEditarProduto(e, id) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      const produtoAtualizado = {
        nome: formData.get('nome'),
        preco: parseFloat(formData.get('preco')),
        estoque: parseInt(formData.get('estoque')),
        descricao: formData.get('descricao'),
        dataAtualizacao: new Date()
      };

      await Database.updateProduto(id, produtoAtualizado);
      
      App.closeModal();
      await this.loadProdutos();
      alert('Produto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto: ' + error.message);
    }
  },

  async excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await Database.deleteProduto(id);
        await this.loadProdutos();
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto: ' + error.message);
      }
    }
  },

  getProduto(id) {
    return Database.data.produtos.find(p => p.id === id);
  }
};

window.Produtos = Produtos;