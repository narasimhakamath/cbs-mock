import Account from '../models/Account.js';
import Party from '../models/Party.js';

function pad(n, len) {
  return String(n).padStart(len, '0');
}

function formatDate(date) {
  const d = new Date(date);
  return `${pad(d.getDate(), 2)}${pad(d.getMonth() + 1, 2)}${d.getFullYear()}`;
}

function formatTimestamp(date) {
  const d = new Date(date);
  return `${formatDate(d)}${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}${pad(d.getSeconds(), 2)}`;
}

function mockIban(account) {
  return `${account.countryCode}00NBB0${account._id}`;
}

const COUNTRY_CODE = 'BH';

const ACCOUNT_STATUS_CODES = { ACTIVE: '00', INACTIVE: '01', SUSPENDED: '02' };
const CUSTOMER_CATEGORY_CODES = { RETAIL: '01', CORPORATE: '02' };

function buildResponseHeader(reqHeader, status) {
  return {
    ...reqHeader,
    TransactionRefNo: `CPRSUM-${reqHeader.TransactionRefNo || ''}`,
    Status: status,
    EAITimestamp: formatTimestamp(new Date()),
  };
}

function errorResponse(res, reqHeader, cifNumber, code, desc) {
  return res.status(200).json({
    DepositAccountDetailsEnquiryRes: {
      Header: buildResponseHeader(reqHeader, 'S'),
      Body: {
        CIFNumber: cifNumber || '',
        CPR: '',
        CorporateName: null,
        CustomerCategoryFlag: '99',
        TotalNumberOfAccounts: 0,
        IssuerType: null,
        AccountsList: [],
      },
      ReturnStatus: { ReturnCode: code, ReturnDesc: desc },
    },
  });
}

function mapAccount(account, party) {
  const balance = account.balance.toFixed(3);
  return {
    AccountNumber: account._id,
    AccountType: '01',
    ProductCode: '01001010',
    BranchId: 96,
    CurrencyCode: account.currencyCode,
    SBUCode: '01052',
    IBANNumber: mockIban(account),
    AccountLink: null,
    AccountStatus: ACCOUNT_STATUS_CODES[account.status] || '00',
    AccountOpenDate: formatDate(account.createdAt),
    CurrentBalance: balance,
    AvailableBalance: balance,
    AccountName: account.name,
    AddressType: null,
    BlockNumber: 0,
    Street: party.address || '',
    District: null,
    BuildingNumber: 0,
    City: null,
    Country: account.countryCode,
    POBOX: null,
    PostalCode: '0',
    ChargeRate: '0.0000',
    PayRate: '0.0000',
    InterestAPY: '0.0000',
    InterestYTD: '0.0000',
    InterestRate: '0.0000',
    IsBlocked: null,
    DepositNumber: null,
    MaturityDate: null,
    MaturityAmount: '0.000',
    RenewalDate: null,
    LastYearInterest: '0.000',
    FDTermType: 0,
    FDTerm: 0,
    PrincipleCreditAccount: null,
    PrincipleCreditAccountCurrency: null,
    InterestCreditAccount: null,
    InterestCreditAccountCurrency: null,
    TDOriginalAmount: '0.00',
    CustomerMobileNumber: 'NA',
    CustomerEmailID: 'NA',
    VATAllowed: null,
    ChequeFlag: null,
    AccruedInterest: '0.000',
    LastMonthAverageBalance: balance,
    ODLimit: '0.000',
    ODUtilizedAmount: '0.000',
    ProductName: `CURRENT ACCOUNT-${account.currencyCode}-NBB`,
    ClosureDate: null,
    ODIntersetRate: '0.0000',
    PreClosureDate: null,
    PreClosureAmount: '0.000',
  };
}

export async function depositAccountDetailsEnquiry(req, res) {
  const request = req.body?.DepositAccountDetailsEnquiryReq;
  if (!request?.Header || !request?.Body) {
    return res.status(400).json({ message: 'DepositAccountDetailsEnquiryReq.Header and Body are required' });
  }

  const { Header: reqHeader, Body: reqBody } = request;
  const { AccountNumber, CIF } = reqBody;
  ACCOUNT_STATUS_CODES;
  let party;
  let accounts;

  if (CIF) {
    party = await Party.findById(CIF);
    if (!party) return errorResponse(res, reqHeader, CIF, 'EAI-BANCS-001', 'ERROR');
    accounts = await Account.find({ partyId: party._id, countryCode: COUNTRY_CODE });
  } else if (AccountNumber) {
    const account = await Account.findById(AccountNumber);
    if (!account || account.countryCode !== COUNTRY_CODE) {
      return errorResponse(res, reqHeader, '', 'EAI-BANCS-001', 'ERROR');
    }
    party = await Party.findById(account.partyId);
    if (!party) return errorResponse(res, reqHeader, '', 'EAI-BANCS-001', 'ERROR');
    accounts = await Account.find({ partyId: party._id, countryCode: COUNTRY_CODE });
  } else {
    return res.status(400).json({ message: 'AccountNumber or CIF is required' });
  }

  res.json({
    DepositAccountDetailsEnquiryRes: {
      Header: buildResponseHeader(reqHeader, 'S'),
      Body: {
        CIFNumber: party._id,
        CPR: `MOCK-CPR-${party._id}`,
        CorporateName: party.type === 'CORPORATE' ? party.name : null,
        CustomerCategoryFlag: CUSTOMER_CATEGORY_CODES[party.type] || '99',
        TotalNumberOfAccounts: accounts.length,
        IssuerType: null,
        AccountsList: accounts.map((account) => mapAccount(account, party)),
      },
      ReturnStatus: { ReturnCode: 'EAI-BANCS-000', ReturnDesc: 'SUCCESS' },
    },
  });
}

function buildStatementResponseHeader(reqHeader, status) {
  return {
    ...reqHeader,
    TransactionRefNo: `FAMS-${reqHeader.TransactionRefNo || ''}`,
    Status: status,
    EAITimestamp: formatTimestamp(new Date()),
  };
}

function statementErrorResponse(res, reqHeader, code, desc) {
  return res.status(200).json({
    FullAndMiniStatementRes: {
      Header: buildStatementResponseHeader(reqHeader, 'S'),
      Body: {},
      ReturnStatus: { ReturnCode: code, ReturnDesc: desc },
    },
  });
}

export async function fullAndMiniStatement(req, res) {
  const request = req.body?.FullAndMiniStatementReq;
  if (!request?.Header || !request?.Body) {
    return res.status(400).json({ message: 'FullAndMiniStatementReq.Header and Body are required' });
  }

  const { Header: reqHeader, Body: reqBody } = request;
  const { AccountNumber, FromDate, ToDate } = reqBody;

  if (!AccountNumber) {
    return res.status(400).json({ message: 'AccountNumber is required' });
  }

  const account = await Account.findById(AccountNumber);
  if (!account || account.countryCode !== COUNTRY_CODE) {
    return statementErrorResponse(res, reqHeader, 'EAI-BANCS-001', 'ERROR');
  }

  const party = await Party.findById(account.partyId);
  if (!party) {
    return statementErrorResponse(res, reqHeader, 'EAI-BANCS-001', 'ERROR');
  }

  const balance = account.balance.toFixed(3);

  res.json({
    FullAndMiniStatementRes: {
      Header: buildStatementResponseHeader(reqHeader, 'S'),
      Body: {
        BranchName: 'MAIN BRANCH',
        AccountHoldersName: party.name,
        AccountNumber: account._id,
        Address1: null,
        Address2: null,
        Address3: party.address || null,
        City: null,
        State: null,
        Country: account.countryCode,
        Zip: null,
        Currency: account.currencyCode,
        OrginationDate: formatDate(account.createdAt),
        InterestRate: '0.0000',
        ProductName: `CURRENT ACCOUNT-${account.currencyCode}-NBB`,
        StatementFromDate: FromDate || '',
        StatementToDate: ToDate || '',
        OpeningBalance: balance,
        ClosingBalance: balance,
        CurrentBalance: balance,
        AvailableBalance: balance,
        TotalCredits: 0,
        TotalDebits: 0,
        TotalCreditAmount: '0.000',
        TotalDebitAmount: '0.000',
        TotalNumberOfTxns: 0,
        AccountType: 2,
        Status: ACCOUNT_STATUS_CODES[account.status] || '00',
        ODILimit: '0.000',
        ODIExpiryDate: '00000000',
        IBANNumber: mockIban(account),
        TaxRegistrationNumber: '0',
        AccountStatement: [],
      },
      ReturnStatus: { ReturnCode: 'EAI-BANCS-000', ReturnDesc: 'SUCCESS' },
    },
  });
}
