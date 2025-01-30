// Global app configurations and utilities
const App = {
  init() {
    this.setupNavigation();
    this.navigateToPage('agenda');
    this.setupModalClose();
  },

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('href').substring(1);
        this.navigateToPage(pageId);
      });
    });
  },

  navigateToPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.classList.add('hidden');
      page.classList.remove('active');
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    const selectedLink = document.querySelector(`a[href="#${pageId}"]`);

    if (selectedPage && selectedLink) {
      selectedPage.classList.remove('hidden');
      selectedPage.classList.add('active');
      selectedLink.classList.add('active');

      // Initialize page content
      switch(pageId) {
        case 'agenda':
          Agenda.loadAgendamentos();
          break;
        case 'clientes':
          Clientes.loadClientes();
          break;
        case 'servicos':
          Servicos.loadServicos();
          break;
        case 'produtos':
          Produtos.loadProdutos();
          break;
        case 'financeiro':
          this.loadFinanceiro();
          break;
        case 'relatorios':
          this.loadRelatorios();
          break;
        case 'configuracoes':
          this.loadConfiguracoes();
          break;
      }
    }
  },

  setupModalClose() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        this.closeModal();
      }
    });
  },

  showModal(content) {
    const modalContainer = document.getElementById('modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = content;
    
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    modalContainer.classList.remove('hidden');
    modalContainer.classList.add('show');
  },

  closeModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.add('hidden');
    modalContainer.classList.remove('show');
    modalContainer.innerHTML = '';
  },

  loadFinanceiro() {
    const container = document.querySelector('.financial-dashboard');
    if (container) {
      container.innerHTML = `
        <div class="financial-card">
          <h3>Receita Mensal</h3>
          <div class="financial-value">R$ 0,00</div>
        </div>
        <div class="financial-card">
          <h3>Despesas</h3>
          <div class="financial-value">R$ 0,00</div>
        </div>
        <div class="financial-card">
          <h3>Lucro</h3>
          <div class="financial-value">R$ 0,00</div>
        </div>
      `;
    }
  },

  loadRelatorios() {
    const container = document.querySelector('.reports-dashboard');
    if (container) {
      container.innerHTML = `
        <div class="settings-section">
          <h3>Relatórios Disponíveis</h3>
          <div class="form-group">
            <button class="primary-btn" onclick="App.gerarRelatorio('vendas')">
              Relatório de Vendas
            </button>
          </div>
          <div class="form-group">
            <button class="primary-btn" onclick="App.gerarRelatorio('clientes')">
              Relatório de Clientes
            </button>
          </div>
          <div class="form-group">
            <button class="primary-btn" onclick="App.gerarRelatorio('estoque')">
              Relatório de Estoque
            </button>
          </div>
        </div>
      `;
    }
  },

  loadConfiguracoes() {
    const container = document.querySelector('.settings-container');
    if (container) {
      container.innerHTML = `
        <div class="settings-section">
          <h3>Configurações Gerais</h3>
          <form id="config-form">
            <div class="form-group">
              <label>Nome da Empresa</label>
              <input type="text" name="nomeEmpresa" value="Total Bronze">
            </div>
            <div class="form-group">
              <label>Horário de Funcionamento</label>
              <div class="time-range">
                <input type="time" name="horarioInicio" value="08:00">
                até
                <input type="time" name="horarioFim" value="20:00">
              </div>
            </div>
            <div class="form-group">
              <button type="submit" class="primary-btn">Salvar Alterações</button>
            </div>
          </form>
        </div>
      `;

      // Setup form submission
      document.getElementById('config-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // Handle configuration save
        alert('Configurações salvas com sucesso!');
      });
    }
  },

  gerarRelatorio(tipo) {
    alert(`Gerando relatório de ${tipo}...`);
    // Implement report generation logic
  }
};

// Make App available globally
window.App = App;

// Initialize when module loads
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});