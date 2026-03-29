export const scoringConfig = {
  statusWeights: {
    Confirmed: 2,
    Opportunity: 1,
    Unknown: -1,
    'At Risk': -2,
    'Not Applicable': 0,
    '': 0,
  },
  postureThresholds: {
    red: -0.75,
    yellow: -0.1,
    green: 0.75,
  },
};
