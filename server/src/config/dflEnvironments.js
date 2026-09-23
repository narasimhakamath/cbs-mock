export const DFL_ENVIRONMENTS = {
  DEV: {
    baseUrl: process.env.DFL_DEV_BASE_URL,
    token: process.env.DFL_DEV_AUTH_TOKEN,
    statusAckUrl: process.env.VAM_DEV_STATUS_ACK_URL,
  },
  QA: {
    baseUrl: process.env.DFL_QA_BASE_URL,
    token: process.env.DFL_QA_AUTH_TOKEN,
    statusAckUrl: process.env.VAM_QA_STATUS_ACK_URL,
  },
};
