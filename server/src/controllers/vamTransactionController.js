import { faker } from '@faker-js/faker';
import { DFL_ENVIRONMENTS } from '../config/dflEnvironments.js';

function buildMockTransferDetails(sourceAccountNumber, bankCountry) {
  return {
    accountNumber: sourceAccountNumber,
    accountHolderName: faker.person.fullName(),
    bankCode: `${faker.string.alpha({ length: 4, casing: 'upper' })}${bankCountry}${faker.string.alphanumeric({ length: 2, casing: 'upper' })}`,
    bankCountry,
    address: {
      line1: faker.location.streetAddress(),
      line2: faker.location.secondaryAddress(),
      line3: null,
      line4: null,
      country: bankCountry,
    },
    remittanceInformation: {
      line1: 'Invoice payment',
      line2: `INV-${new Date().getFullYear()}-${faker.string.numeric(4)}`,
      line3: null,
      line4: null,
    },
  };
}

export async function postVamCredit(req, res) {
  const {
    env,
    externalRefId,
    transactionReferenceId,
    accountId,
    ledgerId,
    currency,
    amount,
    sourceAccountNumber,
    bankCountry,
  } = req.body;

  const envKey = (env || '').toUpperCase();
  const target = DFL_ENVIRONMENTS[envKey];
  if (!target) {
    return res.status(400).json({ message: 'env must be one of DEV, QA' });
  }
  if (!target.baseUrl || !target.token) {
    return res.status(500).json({ message: `${envKey} environment is not configured` });
  }
  if (!accountId || !ledgerId || !currency || !amount) {
    return res.status(400).json({ message: 'accountId, ledgerId, currency and amount are required' });
  }
  if (!sourceAccountNumber || !bankCountry) {
    return res.status(400).json({ message: 'sourceAccountNumber and bankCountry are required' });
  }

  const body = {
    externalRefId,
    type: 'Money-In',
    transactionReferenceId,
    entries: [
      {
        accountId,
        indicator: 'CREDIT',
        amount,
        currency,
        transferDetails: buildMockTransferDetails(sourceAccountNumber, bankCountry),
      },
      { accountId: `${ledgerId}-CASH`, indicator: 'DEBIT', amount, currency },
    ],
  };

  let upstreamRes;
  try {
    upstreamRes = await fetch(`${target.baseUrl}/proxy/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${target.token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return res.status(502).json({ message: 'Failed to reach transactions service' });
  }

  const responseBody = await upstreamRes.json().catch(() => ({}));
  res.status(upstreamRes.status).json(responseBody);
}

export async function postVamStatusAck(req, res) {
  const { env, externalRefId, status, errorCode } = req.body;

  const envKey = (env || '').toUpperCase();
  const target = DFL_ENVIRONMENTS[envKey];
  if (!target) {
    return res.status(400).json({ message: 'env must be one of DEV, QA' });
  }
  if (!target.statusAckUrl || !target.token) {
    return res.status(500).json({ message: `${envKey} environment is not configured for status acknowledgement` });
  }
  if (!externalRefId || !status) {
    return res.status(400).json({ message: 'externalRefId and status are required' });
  }
  if (!['ACSC', 'RJCT'].includes(status)) {
    return res.status(400).json({ message: 'status must be ACSC or RJCT' });
  }
  if (status === 'RJCT' && !errorCode) {
    return res.status(400).json({ message: 'errorCode is required when status is RJCT' });
  }

  const body = { externalRefId, status, ...(status === 'RJCT' ? { errorCode } : {}) };

  let upstreamRes;
  try {
    upstreamRes = await fetch(target.statusAckUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${target.token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return res.status(502).json({ message: 'Failed to reach VAM status acknowledgement service' });
  }

  const responseBody = await upstreamRes.json().catch(() => ({}));
  res.status(upstreamRes.status).json(responseBody);
}
