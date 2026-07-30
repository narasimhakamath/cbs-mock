import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${import.meta.env.BASE_URL}api`,
});

export async function fetchConfig() {
  const { data } = await api.get('/config');
  return data;
}

export async function fetchAccounts({
  page = 1,
  limit = 10,
  search = '',
  partyId,
  sortBy,
  sortOrder,
} = {}) {
  const { data } = await api.get('/accounts', {
    params: { page, limit, search, partyId, sortBy, sortOrder },
  });
  return data;
}

export async function fetchAccount(id) {
  const { data } = await api.get(`/accounts/${id}`);
  return data;
}

export async function createAccount(payload) {
  const { data } = await api.post('/accounts', payload);
  return data;
}

export async function updateAccount(id, payload) {
  const { data } = await api.patch(`/accounts/${id}`, payload);
  return data;
}

export async function deleteAccount(id) {
  await api.delete(`/accounts/${id}`);
}

export async function fetchTransactions(accountId, { page = 1, limit = 10 } = {}) {
  const { data } = await api.get(`/accounts/${accountId}/transactions`, { params: { page, limit } });
  return data;
}

export async function createInwardCredit(accountId, payload) {
  const { data } = await api.post(`/accounts/${accountId}/transactions/inward-credit`, payload);
  return data;
}

export async function createOutwardDebit(accountId, payload) {
  const { data } = await api.post(`/accounts/${accountId}/transactions/outward-debit`, payload);
  return data;
}

export async function fetchParties({ page = 1, limit = 10, search = '', type } = {}) {
  const { data } = await api.get('/parties', { params: { page, limit, search, type } });
  return data;
}

export async function fetchParty(id) {
  const { data } = await api.get(`/parties/${id}`);
  return data;
}

export async function createParty(payload) {
  const { data } = await api.post('/parties', payload);
  return data;
}

export async function updateParty(id, payload) {
  const { data } = await api.patch(`/parties/${id}`, payload);
  return data;
}

export async function deleteParty(id) {
  await api.delete(`/parties/${id}`);
}

export async function fetchPartyAccounts(id, { page = 1, limit = 10 } = {}) {
  const { data } = await api.get(`/parties/${id}/accounts`, { params: { page, limit } });
  return data;
}
