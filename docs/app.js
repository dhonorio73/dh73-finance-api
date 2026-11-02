const form = document.querySelector('#form');
const message = document.querySelector('#mensagem');
const history = document.querySelector('#historico');
const tipo = document.querySelector('#filtro-tipo');
const inicio = document.querySelector('#filtro-inicio');
const fim = document.querySelector('#filtro-fim');
const filterMessage = document.querySelector('#filtro-mensagem');
let transacoes = [];
form.elements.data.value = new Date().toLocaleDateString('en-CA');
const money = value => Number(value).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
function mostrarTransacoes() {
  history.replaceChildren(); filterMessage.textContent = '';
  if (inicio.value && fim.value && inicio.value > fim.value) {
    filterMessage.textContent = 'A data inicial deve ser anterior ou igual à data final.'; return;
  }
  const selecionadas = transacoes.filter(item => (!tipo.value || item.tipo === tipo.value) &&
    (!inicio.value || item.data >= inicio.value) && (!fim.value || item.data <= fim.value));
  if (!selecionadas.length) {
    const empty = document.createElement('p'); empty.textContent = 'Nenhuma movimentação encontrada.'; history.append(empty); return;
  }
  for (const transaction of selecionadas) {
    const row = document.createElement('div'); row.className = 'item';
    const details = document.createElement('div'); const title = document.createElement('strong'); title.textContent = transaction.descricao;
    const subtitle = document.createElement('small'); subtitle.textContent = `${transaction.data.split('-').reverse().join('/')} · ${transaction.tipo}`;
    details.append(title, subtitle); const actions = document.createElement('div'); actions.className = 'item-actions';
    const amount = document.createElement('span'); amount.className = `amount ${transaction.tipo === 'despesa' ? 'expense' : ''}`;
    amount.textContent = `${transaction.tipo === 'despesa' ? '−' : '+'} ${money(transaction.valor)}`;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove'; remove.textContent = 'Excluir';
    remove.setAttribute('aria-label', `Excluir movimentação ${transaction.descricao}`);
    remove.addEventListener('click', async () => {
      if (!confirm(`Excluir a movimentação “${transaction.descricao}”?`)) return;
      try {
        const response = await fetch(`/transacoes/${transaction.id}`, {method: 'DELETE'});
        if (!response.ok) throw new Error('Não foi possível excluir a movimentação.');
        await atualizar(); message.textContent = 'Movimentação excluída com sucesso.';
      } catch (error) { message.textContent = error.message || 'Não foi possível conectar à API.'; }
    });
    actions.append(amount, remove); row.append(details, actions); history.append(row);
  }
}
async function atualizar() {
  const [balanceResponse, transactionsResponse] = await Promise.all([fetch('/saldo'),fetch('/transacoes')]);
  if (!balanceResponse.ok || !transactionsResponse.ok) throw new Error('Não foi possível carregar os dados.');
  const balance = await balanceResponse.json(); transacoes = await transactionsResponse.json();
  document.querySelector('#saldo').textContent = money(balance.saldo);
  for (const categoria of ['receita', 'despesa']) {
    const centavos = transacoes.filter(t => t.tipo === categoria).reduce((total, t) => total + Math.round(Number(t.valor) * 100), 0);
    document.querySelector(categoria === 'receita' ? '#receitas' : '#despesas').textContent = money(centavos / 100);
  }
  mostrarTransacoes();
}
[tipo, inicio, fim].forEach(campo => campo.addEventListener('change', mostrarTransacoes));
form.addEventListener('submit', async event => {
  event.preventDefault(); message.textContent = '';
  try {
    const data = Object.fromEntries(new FormData(form));
    const response = await fetch('/transacoes', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if (!response.ok) throw new Error('Confira os dados informados e tente novamente.');
    form.elements.descricao.value = ''; form.elements.valor.value = '';
    await atualizar(); message.textContent = 'Movimentação adicionada com sucesso.';
  } catch (error) { message.textContent = error.message || 'Não foi possível conectar à API.'; }
});
atualizar().catch(() => { message.textContent = 'Não foi possível carregar os dados.'; });
