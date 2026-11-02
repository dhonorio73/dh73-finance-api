// Demonstração estática: os dados existem apenas nesta aba do navegador.
const chaveDemo = 'dh73-finance-demo-v1';
const exemplos = [
  {id: 1, descricao: 'Receita de exemplo', tipo: 'receita', valor: '2500.00', data: '2026-01-05'},
  {id: 2, descricao: 'Despesa de exemplo', tipo: 'despesa', valor: '480.00', data: '2026-01-10'}
];
if (!sessionStorage.getItem(chaveDemo)) sessionStorage.setItem(chaveDemo, JSON.stringify(exemplos));
const lerDemo = () => JSON.parse(sessionStorage.getItem(chaveDemo));
window.fetch = async (url, options = {}) => {
  let itens = lerDemo();
  if (url === '/saldo') {
    const centavos = itens.reduce((total, item) => total + (item.tipo === 'receita' ? 1 : -1) * Math.round(Number(item.valor) * 100), 0);
    return Response.json({saldo: (centavos / 100).toFixed(2), moeda: 'BRL'});
  }
  if (url === '/transacoes' && (!options.method || options.method === 'GET')) {
    return Response.json(itens.sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id));
  }
  if (url === '/transacoes' && options.method === 'POST') {
    const novo = JSON.parse(options.body);
    if (!novo.descricao.trim() || Number(novo.valor) <= 0 || !novo.data) return new Response(null, {status: 422});
    novo.id = Math.max(0, ...itens.map(item => item.id)) + 1;
    itens.push(novo); sessionStorage.setItem(chaveDemo, JSON.stringify(itens));
    return Response.json(novo, {status: 201});
  }
  const match = String(url).match(/^\/transacoes\/(\d+)$/);
  if (match && options.method === 'DELETE') {
    const restantes = itens.filter(item => item.id !== Number(match[1]));
    if (restantes.length === itens.length) return new Response(null, {status: 404});
    sessionStorage.setItem(chaveDemo, JSON.stringify(restantes)); return new Response(null, {status: 204});
  }
  return new Response(null, {status: 404});
};
