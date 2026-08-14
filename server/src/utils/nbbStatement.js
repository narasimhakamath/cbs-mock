import crypto from 'crypto';
import Transaction from '../models/Transaction.js';
import { toLocalDate, formatDDMMYYYY, localDayRangeToUtc } from './countryTime.js';

function netAmount(txn) {
  return txn.direction === 'INWARD_CREDIT' ? txn.amount : -txn.amount;
}

function generateSequenceId() {
  return String(crypto.randomInt(100000000, 999999999));
}

function mapTransaction(txn, countryCode, runningBalance) {
  const isCredit = txn.direction === 'INWARD_CREDIT';
  return {
    TransactionDate: formatDDMMYYYY(toLocalDate(txn.createdAt, countryCode)),
    SequenceID: generateSequenceId(),
    POSFlag: null,
    TransactionDescription: null,
    DebitAmount: isCredit ? '0.000' : txn.amount.toFixed(3),
    CreditAmount: isCredit ? txn.amount.toFixed(3) : '0.000',
    RunningBalance: runningBalance.toFixed(3),
    CheckNumber: null,
    PaymentsReferenceNumber: txn._id,
    TraceNumber: null,
    T01Desc: null,
    T35Channel: null,
    T39FXRate: null,
    T35BeneName: null,
    T20Narration: null,
    ExternalPaymentRefNumber: txn._id,
    TrfAcctNum: txn.counterpartyAccountNumber,
  };
}

export async function buildNbbAccountStatement(account, fromDateStr, toDateStr, orderBy) {
  const countryCode = account.countryCode;
  const periodStart = localDayRangeToUtc(fromDateStr, countryCode, false);
  const periodEnd = localDayRangeToUtc(toDateStr, countryCode, true);

  const [periodTxns, afterPeriodTxns] = await Promise.all([
    Transaction.find({
      accountNumber: account._id,
      ...(periodStart && periodEnd ? { createdAt: { $gte: periodStart, $lte: periodEnd } } : {}),
    }).sort({ createdAt: 1 }),
    periodEnd
      ? Transaction.find({ accountNumber: account._id, createdAt: { $gt: periodEnd } })
      : Promise.resolve([]),
  ]);

  const netAfterPeriod = afterPeriodTxns.reduce((sum, txn) => sum + netAmount(txn), 0);
  const closingBalance = account.balance - netAfterPeriod;
  const netWithinPeriod = periodTxns.reduce((sum, txn) => sum + netAmount(txn), 0);
  const openingBalance = closingBalance - netWithinPeriod;

  let runningBalance = openingBalance;
  const ascendingStatement = periodTxns.map((txn) => {
    runningBalance += netAmount(txn);
    return mapTransaction(txn, countryCode, runningBalance);
  });

  const totalCredits = periodTxns.filter((txn) => txn.direction === 'INWARD_CREDIT').length;
  const totalDebits = periodTxns.length - totalCredits;
  const totalCreditAmount = periodTxns
    .filter((txn) => txn.direction === 'INWARD_CREDIT')
    .reduce((sum, txn) => sum + txn.amount, 0);
  const totalDebitAmount = periodTxns
    .filter((txn) => txn.direction === 'OUTWARD_DEBIT')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const AccountStatement = orderBy === 'A' ? ascendingStatement : ascendingStatement.slice().reverse();

  return {
    AccountStatement,
    OpeningBalance: openingBalance.toFixed(3),
    ClosingBalance: closingBalance.toFixed(3),
    TotalCredits: totalCredits,
    TotalDebits: totalDebits,
    TotalCreditAmount: totalCreditAmount.toFixed(3),
    TotalDebitAmount: totalDebitAmount.toFixed(3),
    TotalNumberOfTxns: periodTxns.length,
  };
}
