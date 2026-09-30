import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EnvironmentProvider } from './context/EnvironmentContext';
import Layout from './components/Layout';
import PartiesList from './pages/PartiesList';
import PartyDetail from './pages/PartyDetail';
import PartyForm from './pages/PartyForm';
import UsersList from './pages/UsersList';
import UserDetail from './pages/UserDetail';
import UserForm from './pages/UserForm';
import AccountsList from './pages/AccountsList';
import AccountDetail from './pages/AccountDetail';
import AccountForm from './pages/AccountForm';
import TransactionsList from './pages/TransactionsList';

function App() {
  return (
    <EnvironmentProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/parties" replace />} />
            <Route path="/parties" element={<PartiesList />} />
            <Route path="/parties/new" element={<PartyForm />} />
            <Route path="/parties/:id" element={<PartyDetail />} />
            <Route path="/parties/:id/edit" element={<PartyForm />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/new" element={<UserForm />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/users/:id/edit" element={<UserForm />} />
            <Route path="/accounts" element={<AccountsList />} />
            <Route path="/accounts/new" element={<AccountForm />} />
            <Route path="/accounts/:id" element={<AccountDetail />} />
            <Route path="/accounts/:id/edit" element={<AccountForm />} />
            <Route path="/transactions" element={<TransactionsList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </EnvironmentProvider>
  );
}

export default App;
