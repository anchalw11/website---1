import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from './CustomSelect';
import FuturisticBackground from './FuturisticBackground';
import { useUser } from '../contexts/UserContext';
import { propFirms } from '../data/propFirms';
import api from '../api';

interface QuestionnaireAnswers {
  tradesPerDay: string;
  tradingSession: string;
  cryptoAssets: string[];
  forexAssets: string[];
  hasAccount: 'yes' | 'no';
  accountEquity: number | string;
  propFirm: string;
  accountType: string;
  accountSize: number | string;
  riskPercentage: number;
}

const tradesPerDayOptions = [
  { value: '1-2', label: '1-2 (Recommended)' },
  { value: '3-5', label: '3-5' },
  { value: '6-10', label: '6-10' },
  { value: '10+', label: '10+' },
];

const tradingSessionOptions = [
  { value: 'asian', label: 'Asian Session (Tokyo)' },
  { value: 'european', label: 'European Session (London)' },
  { value: 'us', label: 'US Session (New York)' },
  { value: 'any', label: 'Any/All Sessions' },
];

const cryptoOptions = [
  "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC", "LTC",
  "SHIB", "TRX", "LINK", "BCH", "XLM", "ALGO", "ATOM", "VET", "FIL", "ICP"
];

const forexOptionsList = {
  "Commodities & Indices": ["XAU/USD", "XAG/USD", "USOIL", "US30", "US100"],
  Majors: ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "USDCHF", "NZDUSD"],
  Minors: ["EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY", "EURAUD", "GBPAUD"],
  Exotics: ["USDTRY", "USDZAR", "USDMXN", "USDNOK", "USDSEK", "USDSGD", "USDHKD"]
};

const allCryptoOptions = cryptoOptions.map(c => ({ value: c, label: c }));
const allForexOptions = () => {
  const options = Object.entries(forexOptionsList).map(([group, pairs]) => ({
    label: group,
    options: pairs.map(p => ({ value: p, label: p }))
  }));
  const savedPairs = localStorage.getItem('customForexPairs');
  const customPairs = savedPairs ? JSON.parse(savedPairs) : [];
  if (customPairs.length > 0) {
    options.push({
      label: 'Custom',
      options: customPairs.map((p: string) => ({ value: p, label: p }))
    });
  }
  return options;
};

const Questionnaire: React.FC = () => {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    tradesPerDay: '1-2',
    tradingSession: 'any',
    cryptoAssets: [],
    forexAssets: [],
    hasAccount: 'no',
    accountEquity: '',
    propFirm: '',
    accountType: '',
    accountSize: '',
    riskPercentage: 1,
  });
  const [customPair, setCustomPair] = useState('');
  const [customPairs, setCustomPairs] = useState<string[]>(() => {
    const savedPairs = localStorage.getItem('customForexPairs');
    return savedPairs ? JSON.parse(savedPairs) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    if (!user || user.membershipTier === 'free') {
      navigate('/payment');
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    setIsLoading(true);
    localStorage.setItem('questionnaireAnswers', JSON.stringify(answers));
    console.log('User Answers:', answers);

    try {
      await api.post('/risk-plan', answers);
      navigate('/risk-management');
    } catch (error) {
      console.error('Failed to save risk plan:', error);
      // Handle error appropriately in a real application
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4 relative">
      <FuturisticBackground />
      <div className="relative bg-transparent p-8 rounded-2xl w-full max-w-3xl z-10">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Trading Preferences</h2>
        <p className="mb-8 text-center text-gray-400">Help us tailor your experience by answering a few questions.</p>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Prop Firm</label>
            <CustomSelect
              options={propFirms.map(firm => ({ value: firm.name, label: firm.name }))}
              value={answers.propFirm}
              onChange={(value) => setAnswers({ ...answers, propFirm: value as string, accountType: '', accountSize: '' })}
              placeholder="Select a prop firm..."
            />
          </div>

          {answers.propFirm && (
            <>
              <div>
                <label className="block mb-2 text-lg font-semibold text-gray-300">Account Type</label>
                <CustomSelect
                  options={propFirms.find(firm => firm.name === answers.propFirm)?.accountTypes.map(type => ({ value: type, label: type })) || []}
                  value={answers.accountType}
                  onChange={(value) => setAnswers({ ...answers, accountType: value as string })}
                  placeholder="Select an account type..."
                />
              </div>
              <div>
                <label className="block mb-2 text-lg font-semibold text-gray-300">Account Size</label>
                <CustomSelect
                  options={propFirms.find(firm => firm.name === answers.propFirm)?.accountSizes.map(size => ({ value: String(size), label: `$${size.toLocaleString()}` })) || []}
                  value={String(answers.accountSize)}
                  onChange={(value) => setAnswers({ ...answers, accountSize: Number(value) })}
                  placeholder="Select an account size..."
                />
              </div>
            </>
          )}

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Risk per Trade</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={answers.riskPercentage}
                onChange={(e) => setAnswers({ ...answers, riskPercentage: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-semibold text-blue-400">{answers.riskPercentage.toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">How many trades do you take per day?</label>
            <CustomSelect
              options={tradesPerDayOptions}
              value={answers.tradesPerDay}
              onChange={(value) => setAnswers({ ...answers, tradesPerDay: value as string })}
            />
            <p className="text-xs text-gray-400 mt-1">Note: You can change this in your settings once per week.</p>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Do you have an account already?</label>
            <CustomSelect
              options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
              value={answers.hasAccount}
              onChange={(value) => setAnswers({ ...answers, hasAccount: value as 'yes' | 'no' })}
            />
          </div>

          {answers.hasAccount === 'yes' && (
            <div>
              <label className="block mb-2 text-lg font-semibold text-gray-300">Current equity of that account</label>
              <input
                type="number"
                value={answers.accountEquity}
                onChange={(e) => setAnswers({ ...answers, accountEquity: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Enter your account equity"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which trading session suits you best?</label>
            <CustomSelect
              options={tradingSessionOptions}
              value={answers.tradingSession}
              onChange={(value) => setAnswers({ ...answers, tradingSession: value as string })}
            />
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which crypto assets do you trade?</label>
            <CustomSelect
              options={allCryptoOptions}
              value={answers.cryptoAssets}
              onChange={(value) => setAnswers({ ...answers, cryptoAssets: value as string[] })}
              multiple
              placeholder="Select crypto assets..."
            />
            <button
              onClick={() => setAnswers({ ...answers, cryptoAssets: cryptoOptions })}
              className="text-xs text-blue-400 mt-1 hover:underline"
            >
              Select All
            </button>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which forex pairs do you trade?</label>
            <CustomSelect
              options={allForexOptions()}
              value={answers.forexAssets}
              onChange={(value) => setAnswers({ ...answers, forexAssets: value as string[] })}
              multiple
              placeholder="Select forex pairs..."
            />
            <button
              onClick={() => setAnswers({ ...answers, forexAssets: Object.values(forexOptionsList).flat().concat(customPairs) })}
              className="text-xs text-blue-400 mt-1 hover:underline"
            >
              Select All
            </button>
            <div className="mt-2">
              <p className="text-xs text-gray-400">Your pair not here? Add it below:</p>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={customPair}
                  onChange={(e) => setCustomPair(e.target.value.toUpperCase())}
                  placeholder="e.g., EURNOK"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white"
                />
                <button
                  onClick={() => {
                    if (customPair && !customPairs.includes(customPair)) {
                      const newCustomPairs = [...customPairs, customPair];
                      setCustomPairs(newCustomPairs);
                      localStorage.setItem('customForexPairs', JSON.stringify(newCustomPairs));
                      setCustomPair('');
                    }
                  }}
                  className="p-2 bg-blue-600 rounded-r-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-8 p-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-blue-500/50 disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Preferences & Continue'}
        </button>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
