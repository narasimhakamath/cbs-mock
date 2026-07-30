import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BanksList from './pages/BanksList';
import BankForm from './pages/BankForm';
import PartiesList from './pages/PartiesList';
import PartyDetail from './pages/PartyDetail';
import PartyForm from './pages/PartyForm';
import AccountsList from './pages/AccountsList';
import AccountDetail from './pages/AccountDetail';
import AccountForm from './pages/AccountForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/parties" replace />} />
          <Route path="/banks" element={<BanksList />} />
          <Route path="/banks/new" element={<BankForm />} />
          <Route path="/banks/:id/edit" element={<BankForm />} />
          <Route path="/parties" element={<PartiesList />} />
          <Route path="/parties/new" element={<PartyForm />} />
          <Route path="/parties/:id" element={<PartyDetail />} />
          <Route path="/parties/:id/edit" element={<PartyForm />} />
          <Route path="/accounts" element={<AccountsList />} />
          <Route path="/accounts/new" element={<AccountForm />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/accounts/:id/edit" element={<AccountForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
