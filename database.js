const Database = {
  data: {
    clientes: [],
    servicos: [],
    produtos: [],
    agendamentos: []
  },

  init() {
    // Load data from localStorage on startup
    this.loadFromStorage();
    
    // Save data to Excel file every 5 minutes
    setInterval(() => this.saveToExcel(), 300000);
  },

  loadFromStorage() {
    try {
      const savedData = localStorage.getItem('totalBronzeData');
      if (savedData) {
        this.data = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('totalBronzeData', JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  },

  saveToExcel() {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Convert each data collection to worksheet
      for (const [key, value] of Object.entries(this.data)) {
        const ws = XLSX.utils.json_to_sheet(value);
        XLSX.utils.book_append_sheet(wb, ws, key);
      }

      // Save file
      XLSX.writeFile(wb, 'total_bronze_data.xlsx');
    } catch (error) {
      console.error('Error saving to Excel:', error);
    }
  },

  loadFromExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Read each worksheet into data object
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            this.data[sheetName] = XLSX.utils.sheet_to_json(worksheet);
          });

          this.saveToStorage();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  // CRUD operations for Clientes
  async addCliente(cliente) {
    cliente.id = Date.now().toString();
    this.data.clientes.push(cliente);
    this.saveToStorage();
    return cliente;
  },

  async getClientes() {
    return this.data.clientes;
  },

  async getCliente(id) {
    return this.data.clientes.find(c => c.id === id);
  },

  async updateCliente(id, cliente) {
    const index = this.data.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.clientes[index] = { ...cliente, id };
      this.saveToStorage();
    }
  },

  async deleteCliente(id) {
    this.data.clientes = this.data.clientes.filter(c => c.id !== id);
    this.saveToStorage();
  },

  // CRUD operations for Serviços
  async addServico(servico) {
    servico.id = Date.now().toString();
    this.data.servicos.push(servico);
    this.saveToStorage();
    return servico;
  },

  async getServicos() {
    return this.data.servicos;
  },

  async getServico(id) {
    return this.data.servicos.find(s => s.id === id);
  },

  async updateServico(id, servico) {
    const index = this.data.servicos.findIndex(s => s.id === id);
    if (index !== -1) {
      this.data.servicos[index] = { ...servico, id };
      this.saveToStorage();
    }
  },

  async deleteServico(id) {
    this.data.servicos = this.data.servicos.filter(s => s.id !== id);
    this.saveToStorage();
  },

  // CRUD operations for Produtos
  async addProduto(produto) {
    produto.id = Date.now().toString();
    this.data.produtos.push(produto);
    this.saveToStorage();
    return produto;
  },

  async getProdutos() {
    return this.data.produtos;
  },

  async getProduto(id) {
    return this.data.produtos.find(p => p.id === id);
  },

  async updateProduto(id, produto) {
    const index = this.data.produtos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.produtos[index] = { ...produto, id };
      this.saveToStorage();
    }
  },

  async deleteProduto(id) {
    this.data.produtos = this.data.produtos.filter(p => p.id !== id);
    this.saveToStorage();
  },

  // CRUD operations for Agendamentos
  async addAgendamento(agendamento) {
    agendamento.id = Date.now().toString();
    this.data.agendamentos.push(agendamento);
    this.saveToStorage();
    return agendamento;
  },

  async getAgendamentos() {
    return this.data.agendamentos;
  },

  async updateAgendamento(id, agendamento) {
    const index = this.data.agendamentos.findIndex(a => a.id === id);
    if (index !== -1) {
      this.data.agendamentos[index] = { ...agendamento, id };
      this.saveToStorage();
    }
  },

  async deleteAgendamento(id) {
    this.data.agendamentos = this.data.agendamentos.filter(a => a.id !== id);
    this.saveToStorage();
  }
};

// Initialize database when the script loads
Database.init();

// Make Database available globally
window.Database = Database;